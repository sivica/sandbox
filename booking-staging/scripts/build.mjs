import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("public", "dist", { recursive: true });
await build({
  entryPoints: ["src/app.js"],
  outfile: "dist/app.js",
  bundle: true,
  minify: true,
  format: "esm",
  target: ["es2022"],
  define: { "process.env.NODE_ENV": '"production"' },
});
await build({
  entryPoints: ["src/admin.js"],
  outfile: "dist/admin.js",
  bundle: true,
  minify: true,
  format: "esm",
  target: ["es2022"],
});
await build({
  entryPoints: ["src/demo.js"],
  outfile: "dist/demo.js",
  bundle: true,
  minify: true,
  format: "esm",
  target: ["es2022"],
});
