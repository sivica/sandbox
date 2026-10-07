import assert from "node:assert/strict";
import { unzipSync } from "fflate";
import { readFile, writeFile, mkdir, cp, mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import http from "node:http";
import { build } from "esbuild";
import { chromium } from "@playwright/test";
import { sample, validateDesign, screenHTML, authoredPreset, palettes } from "../src/design.js";

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
      const originalRead = FileReader.prototype.readAsDataURL;
      FileReader.prototype.readAsDataURL = function(file) {
        if (file.name === "late.png") window.finishLateImage = () => originalRead.call(this, file);
        else originalRead.call(this, file);
      };
      window.reviewCalls = [];
      window.reviewSaved = JSON.parse(sessionStorage.getItem("sg-persist") || "null");
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
            if (window.reviewPersist) sessionStorage.setItem("sg-persist",JSON.stringify(payload));
            return {};
          }
          if (action === "startRecording") return { recording: true };
          if (action === "stopRecording") return window.failRecordingSave ? { recording: false, directory: "/synthetic/recording", saveError: "Manifest save failed" } : { recording: false, directory: "/synthetic/recording" };
          if (action === "retryRecording") return { recording: false, directory: "/synthetic/recording" };
          if (action === "generate") {
            window.reviewPayload = payload;
            if (window.reviewLimit) return { error: "ChatGPT usage limit reached. Try again after reset." };
            return await new Promise((resolve) => {
              window.reviewComplete = () =>
                resolve({ text: JSON.stringify(window.reviewDesign || design) });
            });
          }
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
      .getByRole("button", { name: "Apply Calm spa style", exact: true })
      .first()
      .click();
    await page.getByRole("button", { name: "Accept design", exact: true }).click();
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
        .getByRole("button", { name: "Apply Modern boutique style", exact: true })
        .click();
      await page.getByRole("button", { name: "Accept design", exact: true }).click();
      await page.evaluate(() => window.reviewComplete());
      await page.getByRole("button", { name: "Apply changes" }).waitFor();
      await page.waitForFunction(
        () =>
          !!window.reviewSaved &&
          window.reviewSaved.versions.at(-1).design.style === "modern-boutique",
      );
      const state = await page.evaluate(() => window.reviewSaved);
      const v = state.versions.find((v) => v.manifest.id === state.selected);
      assert.equal(v.manifest.source, "authored-preset");
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
  await check("usage-limit failure preserves design and allows retry after recovery", async () => {
    await workspace();
    const before = await page.evaluate(() => JSON.stringify(window.reviewSaved.versions));
    await page.evaluate(() => { window.reviewLimit = true; });
    await page.locator("textarea").fill("Refine the fictional booking design");
    await page.getByRole("button", { name: "Apply changes" }).click();
    await page.getByRole("alert").filter({ hasText: "usage limit reached" }).waitFor();
    assert.equal(await page.evaluate(() => JSON.stringify(window.reviewSaved.versions)), before);
    await page.evaluate(() => { window.reviewLimit = false; });
    await page.getByRole("button", { name: "Apply changes" }).click();
    await page.waitForFunction(() => !!window.reviewComplete);
    await page.evaluate(() => window.reviewComplete());
    await page.getByRole("button", { name: "Accept design", exact: true }).click();
    assert.notEqual(await page.evaluate(() => JSON.stringify(window.reviewSaved.versions)), before);
  });
  await check("recording hides account identity and restores it after stop", async () => {
    await workspace();
    await page.getByRole("button", { name: "Record demo", exact: true }).click();
    await page.getByRole("button", { name: "Stop demo recording", exact: true }).waitFor();
    assert.ok(!(await page.locator("body").innerText()).includes("review@example.test"));
    await page.getByRole("button", { name: "Stop demo recording", exact: true }).click();
    await page.getByRole("button", { name: "Record demo", exact: true }).waitFor();
    assert.ok((await page.locator("body").innerText()).includes("review@example.test"));
  });
  await check("reference image is bounded JPEG input and absent from saved project", async () => {
    await workspace();
    await page.locator('input[type="file"]').setInputFiles({ name: "fictional.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ7cAAAAASUVORK5CYII=", "base64") });
    await page.getByRole("button", { name: "Remove reference" }).waitFor();
    await page.locator("textarea").fill("Create a fictional treatment design inspired by this image");
    await page.getByRole("button", { name: "Apply changes" }).click();
    await page.waitForFunction(() => !!window.reviewComplete);
    const payload = await page.evaluate(() => window.reviewPayload);
    assert.ok(payload.reference.startsWith("data:image/jpeg;base64,"));
    await page.evaluate(() => window.reviewComplete());
    await page.getByRole("button", { name: "Accept design", exact: true }).click();
    assert.ok(!JSON.stringify(await page.evaluate(() => window.reviewSaved)).includes("data:image"));
    await page.getByRole("button", { name: "Remove reference" }).click();
    assert.equal(await page.getByRole("button", { name: "Remove reference" }).count(), 0);
  });
  await check("interactive dialog initializes on every opening", async () => {
    await workspace();
    for (let attempt=0; attempt<2; attempt++) {
      await page.getByRole("button", { name: "Interactive preview", exact: true }).click();
      await page.frameLocator(".large-preview").getByRole("button", { name: "Explore treatment", exact: true }).waitFor();
      await page.getByRole("button", { name: "Close dialog", exact: true }).click();
      assert.equal(await page.locator(".large-preview").count(), 0);
    }
  });
  const referenceFixture = name => ({ name, mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ7cAAAAASUVORK5CYII=", "base64") });
  await check("stale image reads cannot replace a newer reference", async () => {
    await workspace();
    await page.locator('input[type=file]').setInputFiles(referenceFixture("late.png"));
    assert.equal(await page.getByRole("button", { name: "Apply changes" }).isEnabled(), false);
    await page.locator('input[type=file]').setInputFiles(referenceFixture("newer.png"));
    await page.locator(".reference span").filter({ hasText: "newer.png" }).waitFor();
    await page.evaluate(() => window.finishLateImage());
    await page.waitForTimeout(150);
    assert.ok((await page.locator(".reference span").innerText()).includes("newer.png"));
  });
  await check("reference removal cancels a pending read and prevents submission", async () => {
    await workspace();
    await page.locator('input[type=file]').setInputFiles(referenceFixture("late.png"));
    await page.getByRole("button", { name: "Remove reference" }).click();
    await page.evaluate(() => window.finishLateImage());
    await page.waitForTimeout(150);
    assert.equal(await page.locator(".reference").count(), 0);
    await page.locator("textarea").fill("Fictional design without the removed image");
    await page.getByRole("button", { name: "Apply changes" }).click();
    await page.waitForFunction(() => !!window.reviewComplete);
    assert.ok(!(await page.evaluate(() => window.reviewPayload)).reference);
    await page.evaluate(() => window.reviewComplete());
    await page.getByRole("button", { name: "Discard proposal" }).click();
  });
  await check("preview navigation preserves editing screen and manifest scope", async () => {
    await workspace();
    await page.getByRole("button", { name: "Select Date and slots button", exact: true }).click();
    await page.getByRole("button", { name: "Interactive preview", exact: true }).click();
    await page.locator(".preview-controls select").first().selectOption("4");
    await page.getByRole("button", { name: "Close dialog", exact: true }).click();
    assert.ok((await page.locator(".element-editor h2").innerText()).includes("Date and slots"));
    await page.getByLabel("Selected element text").fill("Checked date action");
    await page.getByRole("button", { name: "Save direct edit", exact: true }).click();
    await page.waitForFunction(() => window.reviewSaved.versions.at(-1).manifest.source === "manual");
    const version = await page.evaluate(() => window.reviewSaved.versions.at(-1));
    assert.equal(version.design.screens[2].action, "Checked date action");
    assert.equal(version.manifest.scope, "Date and slots");
  });
  await check("keyboard slot selection keeps focus on the selected button", async () => {
    await workspace();
    await page.getByRole("button", { name: "Interactive preview", exact: true }).click();
    const frame = page.frameLocator(".large-preview");
    await frame.getByRole("button", { name: "Explore treatment", exact: true }).click();
    await frame.getByRole("button", { name: "Choose a time", exact: true }).click();
    await frame.getByRole("button", { name: "14:15", exact: true }).focus();
    await page.keyboard.press("Enter");
    assert.equal(await frame.getByRole("button", { name: "14:15", exact: true }).evaluate(el => document.activeElement === el && el.getAttribute("aria-pressed") === "true"), true);
  });
  await check("recording manifest save failure restores privacy state and permits retry", async () => {
    await workspace();
    await page.getByRole("button", { name: "Record demo", exact: true }).click();
    await page.getByRole("button", { name: "Stop demo recording", exact: true }).waitFor();
    await page.evaluate(() => { window.failRecordingSave = true; });
    await page.getByRole("button", { name: "Stop demo recording", exact: true }).click();
    await page.getByRole("button", { name: "Retry recording save", exact: true }).waitFor();
    assert.ok((await page.locator("body").innerText()).includes("review@example.test"));
    await page.getByRole("button", { name: "Retry recording save", exact: true }).click();
    await page.getByRole("button", { name: "Record demo", exact: true }).waitFor();
  });
  await check("first proposal allows all five screens to be reviewed before acceptance", async () => {
    await page.goto(origin);
    await page.getByRole("button", { name: "← Open local workspace" }).click();
    await page.locator("textarea").fill("Create all five fictional booking screens");
    await page.getByRole("button", { name: "Generate designs" }).click();
    await page.waitForFunction(() => !!window.reviewComplete);
    await page.evaluate(() => window.reviewComplete());
    for (let i=0; i<5; i++) {
      await page.getByLabel("Proposed screen", { exact: true }).selectOption(String(i));
      await page.frameLocator('.proposal iframe').getByText("STEP " + (i+1) + " OF 5", { exact: true }).waitFor();
      assert.equal((await page.evaluate(() => window.reviewSaved)).versions.length, 0);
    }
    await page.getByRole("button", { name: "Accept design", exact: true }).click();
    await page.waitForFunction(() => window.reviewSaved.versions.length === 1);
  });
  await check("undo follows parent branch and new edits discard old redo path", async () => {
    await workspace();
    const first = await page.evaluate(() => window.reviewSaved.selected);
    await page.getByLabel("Selected element text").fill("Version two action");
    await page.getByRole("button", { name: "Save direct edit", exact: true }).click();
    await page.waitForFunction(() => window.reviewSaved.versions.length === 2);
    const second = await page.evaluate(() => window.reviewSaved.selected);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await page.getByLabel("Selected element text").fill("Branched version three action");
    await page.getByRole("button", { name: "Save direct edit", exact: true }).click();
    await page.waitForFunction(() => window.reviewSaved.versions.length === 3);
    const third = await page.evaluate(() => window.reviewSaved.selected);
    assert.equal(await page.getByRole("button", { name: "Redo", exact: true }).isEnabled(), false);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await page.waitForFunction(id => window.reviewSaved.selected === id, first);
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    await page.waitForFunction(id => window.reviewSaved.selected === id, third);
    assert.notEqual(third, second);
  });
  await check("manual export metadata follows edited screen rather than refinement scope", async () => {
    await workspace();
    await page.getByLabel("Change scope").selectOption("Date and slots");
    await page.getByLabel("Selected element text").fill("Changed service action");
    await page.getByRole("button", { name: "Save direct edit", exact: true }).click();
    await page.waitForFunction(() => window.reviewSaved.versions.at(-1).manifest.source === "manual");
    const version = await page.evaluate(() => window.reviewSaved.versions.at(-1));
    const manifest = JSON.parse(Buffer.from(unzipSync(exportZip(version))["version-manifest.json"]).toString());
    assert.equal(manifest.scope, "Service selection");
    assert.equal(manifest.component, "action");
    assert.ok(manifest.fields.includes("action"));
    assert.equal(version.design.screens[0].action, "Changed service action");
    assert.equal(version.design.screens[2].action, "Continue");
  });
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

  await check("SG-001 legacy defaults and invalid layouts", async () => {
    const legacy = validateDesign(sample("calm-spa"));
    assert.deepEqual(legacy.screens.map(s => s.layout), ["card","card","card","card","card"]);
    for (const bad of ["unknown", "<script>", 7]) {
      const d = structuredClone(legacy); d.screens[0].layout = bad;
      assert.throws(() => validateDesign(d));
    }
    const d = structuredClone(legacy); d.screens[2].layout = "hero";
    assert.throws(() => validateDesign(d));
    const card = structuredClone(legacy), hero = structuredClone(legacy), list = structuredClone(legacy);
    hero.screens[0].layout = "hero"; list.screens[0].layout = "list";
    assert.deepEqual(hero.tokens,card.tokens); assert.deepEqual(list.tokens,card.tokens);
    assert.ok(screenHTML(card,0).includes('class="card"'));
    assert.ok(screenHTML(hero,0).includes('class="quiet-orbit"'));
    assert.ok(screenHTML(list,0).includes('class="list-marker"'));
    const luminance = hex => { const a = hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4); return a[0]*.2126+a[1]*.7152+a[2]*.0722; };
    const contrast = (a,b) => {const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
    for (const t of Object.values(palettes)) {
      for (const bg of [t.paper,t.soft]) {
        assert.ok(contrast(t.ink,bg)>=4.5); assert.ok(contrast(t.muted,bg)>=4.5);
        assert.ok(contrast(t.accent,bg)>=3);
      }
      assert.ok(contrast("#ffffff",t.accent)>=4.5);
    }
  });
  await check("SG-001 inspector changes only composition and supports Undo/Redo", async () => {
    await workspace();
    const before = await page.evaluate(() => window.reviewSaved.versions.at(-1));
    await page.getByLabel("Screen layout", {exact:true}).selectOption("list");
    await page.waitForFunction(() => window.reviewSaved.versions.at(-1).design.screens[0].layout === "list");
    const after = await page.evaluate(() => window.reviewSaved.versions.at(-1));
    const expected = structuredClone(before.design); expected.screens[0].layout = "list";
    assert.deepEqual(after.design, expected);
    assert.deepEqual(after.manifest.fields, ["layout"]);
    assert.equal(after.manifest.scope, "Service selection");
    await page.getByRole("button", {name:"Undo", exact:true}).click();
    assert.equal(await page.getByLabel("Screen layout", {exact:true}).inputValue(), "hero");
    await page.getByRole("button", {name:"Redo", exact:true}).click();
    assert.equal(await page.getByLabel("Screen layout", {exact:true}).inputValue(), "list");
    await page.getByRole("button", {name:"Select Treatment details button", exact:true}).click();
    await page.getByLabel("Screen layout", {exact:true}).selectOption("card");
    await page.waitForFunction(() => window.reviewSaved.versions.at(-1).design.screens[1].layout === "card");
    const detail = await page.evaluate(() => window.reviewSaved.versions.at(-1));
    assert.deepEqual(detail.manifest.fields, ["layout"]);
    assert.equal(detail.manifest.scope, "Treatment details");
  });
  await check("SG-002 nested direct edits isolate roles, escape text and export exact metadata", async () => {
    await workspace();
    const before = await page.evaluate(() => window.reviewSaved.versions.at(-1).design);
    await page.getByRole("button", {name:"Service eyebrow", exact:true}).click();
    await page.getByLabel("Selected element text").fill("CALM & CARE");
    await page.getByRole("button", {name:"Save direct edit", exact:true}).click();
    await page.waitForFunction(() => window.reviewSaved.versions.at(-1).design.screens[0].eyebrow === "CALM & CARE");
    await page.getByRole("button", {name:"Service description", exact:true}).click();
    const copy = '<img src=x onerror="window.bad=true"> & gentle';
    await page.getByLabel("Selected element text").fill(copy);
    await page.getByRole("button", {name:"Save direct edit", exact:true}).click();
    await page.waitForFunction(copy => window.reviewSaved.versions.at(-1).design.screens[0].description === copy, copy);
    const version = await page.evaluate(() => window.reviewSaved.versions.at(-1));
    const expected = structuredClone(before); expected.screens[0].eyebrow = "CALM & CARE"; expected.screens[0].description = copy;
    assert.deepEqual(version.design, expected);
    assert.deepEqual(version.manifest.fields, ["description"]);
    assert.equal(version.manifest.component, "description");
    const files = unzipSync(exportZip(version));
    const html = new TextDecoder().decode(files["public/designs/screen-1.html"]);
    assert.ok(html.includes("&lt;img")); assert.ok(!html.includes("<img src=x"));
    assert.ok(html.includes("Demo Relaxation")); assert.ok(html.includes("MKD 1,400"));
    assert.deepEqual(JSON.parse(new TextDecoder().decode(files["version-manifest.json"])), version.manifest);
    assert.deepEqual(JSON.parse(new TextDecoder().decode(files["design-specification.json"])), version.design);
    await writeFile(join(base, "nested-export.zip"), exportZip(version));
    await page.getByRole("button", {name:"Undo", exact:true}).click();
    assert.notEqual(await page.getByLabel("Selected element text").inputValue(), copy);
    await page.getByRole("button", {name:"Redo", exact:true}).click();
    assert.equal(await page.getByLabel("Selected element text").inputValue(), copy);
  });
  await check("SG-002 scoped AI nested edit rejects unrelated model changes", async () => {
    await workspace();
    await page.getByRole("button", {name:"Service description", exact:true}).click();
    const before = await page.evaluate(() => window.reviewSaved.versions.at(-1).design);
    const response = structuredClone(before);
    response.screens[0].description = "An unhurried fictional experience";
    response.screens[1].title = "Unrelated model change";
    response.screens[0].layout = "list";
    response.tokens.accent = "#000000";
    await page.evaluate(d => {window.reviewDesign = d}, response);
    await page.locator("textarea").fill("Refine only the selected description");
    await page.getByRole("button", {name:"Apply changes"}).click();
    await page.waitForFunction(() => !!window.reviewComplete);
    assert.equal((await page.evaluate(() => window.reviewPayload)).component, "description");
    await page.evaluate(() => window.reviewComplete());
    await page.getByRole("button", {name:"Accept design", exact:true}).click();
    await page.waitForFunction(() => window.reviewSaved.versions.at(-1).manifest.source === "chatgpt");
    const v = await page.evaluate(() => window.reviewSaved.versions.at(-1));
    const expected = structuredClone(before); expected.screens[0].description = response.screens[0].description;
    assert.deepEqual(v.design, expected);
    assert.deepEqual(v.manifest.fields, ["description"]);
    assert.equal(v.manifest.scope, "Service selection");
    await writeFile(join(base,"scoped-nested-evidence.json"), JSON.stringify({before, modelResponse:response, accepted:v},null,2));
  });
  await check("SG-002 omitted nested role fails without changing accepted design", async () => {
    await workspace();
    await page.getByRole("button", {name:"Service description", exact:true}).click();
    const before = await page.evaluate(() => JSON.stringify(window.reviewSaved.versions));
    await page.locator("textarea").fill("Refine selected description");
    await page.getByRole("button", {name:"Apply changes"}).click();
    await page.waitForFunction(() => !!window.reviewComplete);
    await page.evaluate(() => window.reviewComplete());
    await page.getByRole("alert").filter({hasText:"omitted the selected text role"}).waitFor();
    assert.equal(await page.evaluate(() => JSON.stringify(window.reviewSaved.versions)), before);
  });
  await check("SG-003 offline thumbnails, preview focus, stage/discard and authored provenance", async () => {
    await workspace();
    await page.locator("textarea").fill("My preserved draft");
    const before = await page.evaluate(() => JSON.stringify(window.reviewSaved.versions));
    assert.equal(await page.locator(".preset-thumb iframe").count(), 6);
    for (let i=0;i<6;i++) await page.frameLocator(".preset-thumb iframe").nth(i).getByText("Demo Relaxation",{exact:true}).first().waitFor();
    const calls = await page.evaluate(() => window.reviewCalls.filter(x=>x==="generate").length);
    for (const name of ["Calm spa", "Clean clinic", "Modern boutique"]) {
      const button = page.getByRole("button", {name:"Preview " + name, exact:true});
      await button.click();
      await page.getByRole("dialog", {name:"Authored style preview"}).waitFor();
      assert.equal(await page.locator(".style-preview-screens iframe").count(),2);
      await page.keyboard.press("Escape");
      await page.getByRole("dialog", {name:"Authored style preview"}).waitFor({state:"detached"});
      assert.equal(await button.evaluate(el=>el===document.activeElement), true);
      assert.equal(await page.evaluate(() => JSON.stringify(window.reviewSaved.versions)), before);
      assert.equal(await page.locator("textarea").inputValue(), "My preserved draft");
    }
    await page.getByRole("button", {name:"Apply Clean clinic style", exact:true}).click();
    assert.equal(await page.evaluate(() => JSON.stringify(window.reviewSaved.versions)), before);
    await page.getByRole("button", {name:"Discard proposal", exact:true}).click();
    assert.equal(await page.evaluate(() => JSON.stringify(window.reviewSaved.versions)), before);
    await page.getByRole("button", {name:"Apply Modern boutique style", exact:true}).click();
    await page.getByRole("button", {name:"Accept design", exact:true}).click();
    await page.waitForFunction(() => window.reviewSaved.versions.at(-1).design.style === "modern-boutique");
    const v = await page.evaluate(() => window.reviewSaved.versions.at(-1));
    assert.equal(v.manifest.source,"authored-preset");
    assert.deepEqual(v.manifest.provenance,{type:"local-authored",id:"modern-boutique",revision:1});
    assert.equal(await page.locator("textarea").inputValue(), "My preserved draft");
    assert.equal(await page.evaluate(() => window.reviewCalls.filter(x=>x==="generate").length), calls);
  });
  await check("SG-001/003 all authored layouts fit 320/390/desktop and complete trusted walkthrough", async () => {
    const {bookingHTML} = await import("../src/interactive.js");
    const preview = await context.newPage();
    preview.setDefaultTimeout(7000);
    for (const width of [320,390,1200]) {
      await page.setViewportSize({width,height:850});
      await workspace();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      for (const style of ["calm-spa","clean-clinic","modern-boutique"]) {
        const design = authoredPreset(style);
        for (const index of [0,1]) {
          await preview.setViewportSize({width,height:850});
          await preview.goto("about:blank");
          await preview.setContent(screenHTML(design,index));
          assert.ok(await preview.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          const box = await preview.locator(".action").boundingBox(); assert.ok(box.height >=44);
          await preview.screenshot({path:join(base, `${style}-screen${index}-${width}.png`)});
        }
        await preview.goto("about:blank");
        await preview.setContent(bookingHTML(design));
        for (let i=0;i<4;i++) {
          if (i===2) {await preview.getByRole("button", {name:"14:15",exact:true}).focus(); await preview.keyboard.press("Enter");}
          await preview.locator(".action").click();
        }
        await preview.getByRole("status").filter({hasText:"14:15"}).waitFor();
        assert.ok((await preview.getByRole("status").innerText()).includes("no reservation created"));
      }
      await page.bringToFront();
      await page.locator(".inspiration-grid").scrollIntoViewIfNeeded();
      for (let i=0;i<6;i++) await page.frameLocator(".preset-thumb iframe").nth(i).getByText("Demo Relaxation",{exact:true}).first().waitFor();
      await page.waitForTimeout(250);
      await page.screenshot({path:join(base, `picker-${width}.png`),fullPage:true});
      await page.locator(".inspiration-card").first().screenshot({path:join(base, `picker-card-${width}.png`)});
    }
    await preview.close(); await page.setViewportSize({width:1200,height:900});
  });


  await check("SG-001/002 accepted layout and nested copy survive reload", async () => {
    await workspace();
    await page.evaluate(() => {window.reviewPersist=true});
    await page.getByLabel("Screen layout",{exact:true}).selectOption("list");
    await page.getByRole("button",{name:"Service description",exact:true}).click();
    await page.getByLabel("Selected element text").fill("A preserved fictional description");
    await page.getByRole("button",{name:"Save direct edit",exact:true}).click();
    await page.waitForFunction(()=>window.reviewSaved.versions.at(-1).design.screens[0].description==="A preserved fictional description");
    const before = await page.evaluate(()=>JSON.stringify(window.reviewSaved));
    await page.reload();
    await page.getByRole("button",{name:"← Open local workspace"}).click();
    await page.getByRole("button",{name:"Service description",exact:true}).click();
    assert.equal(await page.getByLabel("Selected element text").inputValue(),"A preserved fictional description");
    assert.equal(await page.getByLabel("Screen layout",{exact:true}).inputValue(),"list");
    assert.equal(await page.evaluate(()=>JSON.stringify(window.reviewSaved)),before);
    await page.evaluate(()=>sessionStorage.removeItem("sg-persist"));
  });

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
