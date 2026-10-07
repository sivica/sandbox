import { readFile, writeFile, mkdtemp, cp } from "node:fs/promises";
import { join } from "node:path";
import http from "node:http";
import { chromium } from "@playwright/test";

const base = await mkdtemp(
  join((await import("node:os")).tmpdir(), "kindred-recovery-"),
);
const web = join(base, "web");
await cp(new URL("../dist", import.meta.url), web, { recursive: true });

const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, "http://127.0.0.1").pathname;
  const file = {
    "/": "index.html",
    "/index.html": "index.html",
    "/studio.js": "studio.js",
    "/studio.css": "studio.css",
    "/flow.css": "flow.css",
  }[path];
  if (!file) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader(
    "content-type",
    file.endsWith(".js")
      ? "text/javascript"
      : file.endsWith(".css")
        ? "text/css"
        : "text/html",
  );
  res.end(await readFile(join(web, file)));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = "http://127.0.0.1:" + server.address().port;
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await context.route("**/*", (route) =>
    new URL(route.request().url()).origin === origin
      ? route.continue()
      : route.abort(),
  );
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  await page.addInitScript(() => {
    window.reviewExpired = false;
    window.reviewCalls = [];
    window.kindred = {
      call: async (action, payload) => {
        window.reviewCalls.push(action);
        if (action === "state")
          return {
            configured: true,
            personal: true,
            session: window.reviewExpired
              ? { status: "disconnected", sharing: false }
              : {
                  status: "connected",
                  sharing: true,
                  identity: {
                    name: "Synthetic Reviewer",
                    email: "review@example.test",
                  },
                },
          };
        if (action === "profiles") return { profiles: [] };
        if (action === "models")
          return {
            models: [{ slug: "review-model", displayName: "Synthetic Model" }],
          };
        if (action === "save") return {};
        if (action === "generate") {
          window.reviewExpired = true;
          return { error: "ChatGPT sign-in expired. Reconnect." };
        }
        if (action === "cancel" || action === "usage") return {};
        throw Error("Unexpected synthetic action " + action);
      },
    };
  });
  await page.goto(origin);
  await page.getByRole("button", { name: "← Open local workspace" }).click();
  await page
    .getByRole("button", { name: "Apply Calm spa style", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Accept design", exact: true }).click();
  const frameHandle = await page
    .locator(".gallery iframe")
    .first()
    .elementHandle();
  const frame = await frameHandle.contentFrame();
  await frame.locator("h1").waitFor();
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await frame.locator("h1").waitFor();
    await page.screenshot({
      path: join(base, "studio-" + width + "-settled.png"),
    });
  }
  await page
    .locator("textarea")
    .fill("Synthetic refinement that encounters an expired session");
  await page.getByRole("button", { name: "Apply changes" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "ChatGPT sign-in expired. Reconnect." })
    .waitFor();
  const result = {
    name: "terminal authentication failure updates connected UI",
    backendSession: await page.evaluate(() => window.kindred.call("state")),
    claimsPlanAccess: (await page.locator("body").innerText()).includes(
      "Using ChatGPT plan",
    ),
    reconnectButtons: await page
      .getByRole("button", { name: "Connect", exact: true })
      .count(),
    applyChangesEnabled: await page
      .getByRole("button", { name: "Apply changes" })
      .isEnabled(),
    calls: await page.evaluate(() => window.reviewCalls),
  };
  result.passed =
    !result.claimsPlanAccess &&
    result.reconnectButtons > 0 &&
    !result.applyChangesEnabled;
  await writeFile(
    join(base, "session-recovery-results.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
  if (!result.passed) throw Error("Session recovery regression");
  await context.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
