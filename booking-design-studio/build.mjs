import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist");
await cp("public", "dist", { recursive: true });
// export-baseline.json pins our trusted booking export. Model output cannot
// change its dependencies, paths or commands. The studio builds independently.
await build({
  entryPoints: ["src/app.jsx"],
  outfile: "dist/studio.js",
  bundle: true,
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
