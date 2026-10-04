import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, cp, mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import http from "node:http";
import { build } from "esbuild";
import { chromium } from "@playwright/test";
import { sample, validateDesign, screenHTML } from "../src/design.js";

const root = new URL("../", import.meta.url).pathname;
const base = await mkdtemp(
  join((await import("node:os")).tmpdir(), "kindred-ui-"),
);
const web = join(base, "web");
await mkdir(web, { recursive: true });
await cp(join(root, "public"), web, { recursive: true });
await cp(
  join(root, "node_modules/@xyflow/react/dist/style.css"),
  join(web, "flow.css"),
);
await build({
  entryPoints: [join(root, "src/app.jsx")],
  outfile: join(web, "studio.js"),
  bundle: true,
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
await build({
  entryPoints: [join(root, "src/export.js")],
  outfile: join(base, "export-module.mjs"),
  bundle: true,
  format: "esm",
  platform: "node",
});
const { exportZip } = await import(join(base, "export-module.mjs"));
const report = [];
async function check(name, fn) {
  console.log("Checking: " + name);
  try {
    await fn();
    report.push({ name, passed: true });
  } catch (e) {
    report.push({ name, passed: false, error: e.message });
  }
  console.log(JSON.stringify(report.at(-1)));
  await writeFile(
    join(base, "ui-export-results.json"),
    JSON.stringify(report, null, 2),
  );
}
const sampleDesign = sample("clean-clinic");
sampleDesign.tokens = {
  ...sampleDesign.tokens,
  accent: "#ff00aa",
  radius: "33px",
};
const version = {
  design: sampleDesign,
  manifest: {
    id: "review-version",
    parent: null,
    source: "synthetic-review",
    scope: "All screens",
    sourceBaseline: "6038e4faceb4427af8f1256a691934431af908d0",
  },
};
const zip = exportZip(version);
await writeFile(join(base, "export.zip"), zip);
const py =
  "import zipfile,pathlib\np=pathlib.Path('" +
  base +
  "/export-build')\np.mkdir(exist_ok=True)\nwith zipfile.ZipFile('" +
  base +
  "/export.zip') as z:\n for n in z.namelist():\n  f=pathlib.PurePosixPath(n)\n  if f.is_absolute() or '..' in f.parts: raise RuntimeError('unsafe export path')\n z.extractall(p)\nprint('fixed export files extracted')";
assert.equal(spawnSync("python3", ["-c", py], { encoding: "utf8" }).status, 0);
const exported = join(base, "export-build");
await check("clean exported-package installation", async () => {
  const r = spawnSync(
    "npm",
    [
      "ci",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--cache",
      join(base, "npm-cache"),
    ],
    { cwd: exported, encoding: "utf8", timeout: 45000 },
  );
  await writeFile(
    join(base, "export-install.log"),
    (r.stdout || "") + (r.stderr || ""),
  );
  assert.equal(
    r.status,
    0,
    (r.stderr || r.error?.message || "install failed").slice(-500),
  );
});
await check("exported-package build", async () => {
  const r = spawnSync(
    "npm",
    ["run", "build", "--cache", join(base, "npm-cache")],
    { cwd: exported, encoding: "utf8", timeout: 30000 },
  );
  await writeFile(
    join(base, "export-build.log"),
    (r.stdout || "") + (r.stderr || ""),
  );
  assert.equal(r.status, 0, (r.stderr || "build failed").slice(-600));
});
await check("generated CSS retains booking layout rules", async () => {
  const css = await readFile(join(exported, "dist/design.css"), "utf8");
  assert.ok(
    css.includes(".brand,h1"),
    "Regeneration removed .brand,h1 and subsequent design layout rules",
  );
  assert.ok(
    !css.includes("\\n:root"),
    "CSS contains literal backslash-n before :root selectors",
  );
});
await check("proposal HTML escapes untrusted copy", async () => {
  const d = structuredClone(sampleDesign);
  d.screens[0].title = "<script>window.PWNED=1</script>";
  const html = screenHTML(d, 0);
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>window.PWNED"));
});
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://127.0.0.1");
  let path;
  if (
    ["/", "/index.html", "/studio.js", "/studio.css", "/flow.css"].includes(
      u.pathname,
    )
  )
    path = join(web, u.pathname === "/" ? "index.html" : u.pathname.slice(1));
  else if (u.pathname.startsWith("/export/") && !u.pathname.includes(".."))
    path = join(exported, "dist", u.pathname.slice(8));
  else {
    res.writeHead(404);
    res.end();
    return;
  }
  try {
    res.setHeader(
      "content-type",
      path.endsWith(".js")
        ? "text/javascript"
        : path.endsWith(".css")
          ? "text/css"
          : "text/html",
    );
    res.end(await readFile(path));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = "http://127.0.0.1:" + server.address().port;
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    acceptDownloads: true,
  });
  await context.route("**/*", (route) =>
    new URL(route.request().url()).origin === origin
      ? route.continue()
      : route.abort(),
  );
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  await page.addInitScript(
    ({ design }) => {
      window.reviewCalls = [];
      window.reviewSaved = null;
      window.kindred = {
        call: async (action, payload) => {
          window.reviewCalls.push(action);
          if (action === "state")
            return {
              configured: true,
              personal: true,
              session: {
                status: "connected",
                sharing: true,
                identity: {
                  name: "Synthetic Reviewer",
                  email: "review@example.test",
                },
              },
              project: window.reviewSaved,
            };
          if (action === "profiles")
            return {
              profiles: [
                {
                  id: "saved-profile",
                  label: "Saved registration",
                  identity: { email: "saved@example.test" },
                  status: "connected",
                },
              ],
            };
          if (action === "selectProfile") return {};
          if (action === "models")
            return {
              models: [
                { slug: "review-model", displayName: "Synthetic Model" },
              ],
            };
          if (action === "save") {
            window.reviewSaved = payload;
            return {};
          }
          if (action === "generate")
            return await new Promise((resolve) => {
              window.reviewComplete = () =>
                resolve({ text: JSON.stringify(design) });
            });
          if (action === "cancel" || action === "usage" || action === "export")
            return {};
          throw Error("Unexpected synthetic UI action " + action);
        },
      };
    },
    { design: sample("calm-spa") },
  );
  async function workspace() {
    await page.goto(origin);
    await page.getByRole("button", { name: "← Open local workspace" }).click();
    await page
      .getByRole("button", { name: "Load sample", exact: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Show screen list", exact: true })
      .click();
  }
  await check(
    "new draft survives completion of earlier generation",
    async () => {
      await workspace();
      await page.locator("textarea").fill("First synthetic refinement");
      await page.getByRole("button", { name: "Apply changes" }).click();
      await page.waitForFunction(() => !!window.reviewComplete);
      await page.locator("textarea").fill("KEEP THIS NEWER DRAFT");
      await page.evaluate(() => window.reviewComplete());
      await page
        .getByRole("status")
        .filter({ hasText: "Generation completed" })
        .waitFor();
      await page
        .getByRole("button", { name: "Accept design", exact: true })
        .click();
      assert.equal(
        await page.locator("textarea").inputValue(),
        "KEEP THIS NEWER DRAFT",
      );
    },
  );
  await check(
    "newly loaded sample is not overwritten by stale generation",
    async () => {
      await workspace();
      await page.locator("textarea").fill("Pending synthetic refinement");
      await page.getByRole("button", { name: "Apply changes" }).click();
      await page.waitForFunction(() => !!window.reviewComplete);
      await page
        .getByRole("button", { name: "Load sample", exact: true })
        .nth(2)
        .click();
      await page.evaluate(() => window.reviewComplete());
      await page.getByRole("button", { name: "Apply changes" }).waitFor();
      await page.waitForFunction(
        () =>
          !!window.reviewSaved &&
          window.reviewSaved.versions.at(-1).design.style === "modern-boutique",
      );
      const state = await page.evaluate(() => window.reviewSaved);
      const v = state.versions.find((v) => v.manifest.id === state.selected);
      assert.equal(v.manifest.source, "sample");
      assert.equal(v.design.style, "modern-boutique");
    },
  );
  await check("preview dialog has an accessible name", async () => {
    await workspace();
    await page
      .getByRole("button", { name: "Preview Service selection", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("dialog", { name: "Design preview", exact: true })
        .count(),
      1,
      "Native dialog has no accessible name",
    );
    await page.getByRole("button", { name: "Close dialog" }).click();
  });
  await check("connected account identity is visible", async () => {
    await workspace();
    assert.ok(
      (await page.locator("body").innerText()).includes("review@example.test"),
      "Active account email is not displayed",
    );
  });
  await check(
    "rename and account dialogs are named; saved account can be selected",
    async () => {
      await workspace();
      await page.getByRole("button", { name: "More project actions" }).click();
      await page.getByRole("menuitem", { name: "Rename project" }).click();
      await page
        .getByRole("dialog", { name: "Rename project", exact: true })
        .waitFor();
      await page.getByRole("button", { name: "Close dialog" }).click();
      await page.getByRole("button", { name: "More project actions" }).click();
      await page.getByRole("menuitem", { name: "Switch account" }).click();
      await page
        .getByRole("dialog", { name: "ChatGPT accounts", exact: true })
        .waitFor();
      await page.getByRole("button", { name: /saved@example.test/ }).click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      assert.ok(
        (await page.evaluate(() => window.reviewCalls)).includes(
          "selectProfile",
        ),
      );
    },
  );
  for (const width of [320, 390])
    await check(
      "browser layout width " + width + " and menu Escape",
      async () => {
        await page.setViewportSize({ width, height: 844 });
        await workspace();
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          "Main viewport overflows horizontally",
        );
        await page
          .getByRole("button", { name: "More project actions" })
          .click();
        await page.keyboard.press("Escape");
        await page.getByRole("menu").waitFor({ state: "hidden" });
        assert.equal(
          await page
            .getByRole("button", { name: "More project actions" })
            .evaluate((el) => el === document.activeElement),
          true,
        );
        await page.screenshot({ path: join(base, "studio-" + width + ".png") });
      },
    );
  await check("canvas selection, direct edit, undo and redo", async () => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await workspace();
    await page
      .getByRole("button", { name: "Show canvas", exact: true })
      .click();
    assert.equal(await page.locator(".react-flow__node").count(), 5);
    await page
      .getByRole("button", {
        name: "Select Date and slots button",
        exact: true,
      })
      .first()
      .click();
    await page.getByLabel("Selected element text").fill("Book my calm moment");
    await page.getByLabel("Button padding").fill("28");
    await page
      .getByRole("button", { name: "Save direct edit", exact: true })
      .click();
    await page.waitForFunction(
      () => window.reviewSaved.versions.at(-1).manifest.source === "manual",
    );
    assert.equal(
      await page.getByLabel("Selected element text").inputValue(),
      "Book my calm moment",
    );
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    assert.notEqual(
      await page.getByLabel("Selected element text").inputValue(),
      "Book my calm moment",
    );
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    assert.equal(
      await page.getByLabel("Selected element text").inputValue(),
      "Book my calm moment",
    );
    await page
      .getByRole("button", { name: "Interactive preview", exact: true })
      .click();
    const preview = page.frameLocator("iframe.large-preview");
    await preview
      .getByRole("button", { name: "Explore treatment", exact: true })
      .click();
    await preview
      .getByRole("button", { name: "Choose a time", exact: true })
      .click();
    await preview.getByRole("button", { name: "14:15", exact: true }).click();
    await preview
      .getByRole("button", { name: "Book my calm moment", exact: true })
      .click();
    await preview
      .getByRole("button", { name: "Confirm booking", exact: true })
      .click();
    await preview.getByRole("status").filter({ hasText: "14:15" }).waitFor();
    await page.getByRole("button", { name: "Close dialog" }).click();
  });
  const exportServer = http.createServer(async (req, res) => {
    const path = new URL(req.url, "http://127.0.0.1").pathname;
    const allowed = [
      "/",
      "/index.html",
      "/preview.js",
      "/styles.css",
      "/design.css",
      "/assets/kindred-mark.svg",
      "/designs/screen-1.html",
      "/interactive-design.html",
    ];
    if (!allowed.includes(path)) {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      const file = join(
        exported,
        "dist",
        path === "/" ? "index.html" : path.slice(1),
      );
      res.setHeader(
        "content-type",
        path.endsWith(".js")
          ? "text/javascript"
          : path.endsWith(".css")
            ? "text/css"
            : path.endsWith(".svg")
              ? "image/svg+xml"
              : "text/html",
      );
      res.end(await readFile(file));
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((r) => exportServer.listen(0, "127.0.0.1", r));
  const exportOrigin = "http://127.0.0.1:" + exportServer.address().port;
  const exportContext = await browser.newContext();
  await exportContext.route("**/*", (r) =>
    new URL(r.request().url()).origin === exportOrigin
      ? r.continue()
      : r.abort(),
  );
  const exportPage = await exportContext.newPage();
  try {
    await check("export renders selected style and tokens", async () => {
      await exportPage.goto(exportOrigin);
      await exportPage.waitForFunction(
        () => document.documentElement.dataset.design === "clean-clinic",
      );
      const actual = await exportPage.evaluate(() => ({
        style: document.documentElement.dataset.design,
        accent: getComputedStyle(document.documentElement)
          .getPropertyValue("--accent")
          .trim(),
        radius: getComputedStyle(document.documentElement)
          .getPropertyValue("--radius")
          .trim(),
      }));
      assert.deepEqual(actual, {
        style: "clean-clinic",
        accent: "#ff00aa",
        radius: "33px",
      });
    });
    await check("export serves the matching selected proposal", async () => {
      await exportPage.goto(exportOrigin + "/designs/screen-1.html");
      assert.equal(
        await exportPage.locator("h1").innerText(),
        sampleDesign.screens[0].title,
      );
    });
    await check(
      "exported interactive design completes synthetic booking",
      async () => {
        await exportPage.goto(exportOrigin + "/interactive-design.html");
        assert.equal(
          await exportPage.locator("h1").innerText(),
          sampleDesign.screens[0].title,
        );
        await exportPage
          .getByRole("button", {
            name: sampleDesign.screens[0].action,
            exact: true,
          })
          .click();
        await exportPage
          .getByRole("button", {
            name: sampleDesign.screens[1].action,
            exact: true,
          })
          .click();
        await exportPage
          .getByRole("button", { name: "14:15", exact: true })
          .click();
        await exportPage
          .getByRole("button", {
            name: sampleDesign.screens[2].action,
            exact: true,
          })
          .click();
        await exportPage
          .getByRole("button", {
            name: sampleDesign.screens[3].action,
            exact: true,
          })
          .click();
        await exportPage
          .getByRole("status")
          .filter({ hasText: "14:15" })
          .waitFor();
      },
    );
  } finally {
    await exportContext.close();
    await new Promise((r) => exportServer.close(r));
  }
  await context.close();
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
await writeFile(
  join(base, "ui-export-results.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));

assert.equal(
  report.filter((r) => r.passed === false).length,
  0,
  JSON.stringify(report.filter((r) => r.passed === false)),
);
