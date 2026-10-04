import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
const root = resolve("dist");
const paths = new Set(["/", "/index.html", "/studio.js", "/studio.css", "/flow.css"]);
http
  .createServer(async (req, res) => {
    const path = new URL(req.url, "http://localhost").pathname;
    if (!paths.has(path)) {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      res.setHeader(
        "Content-Type",
        { ".js": "text/javascript", ".css": "text/css", ".html": "text/html" }[
          extname(path)
        ] || "text/html",
      );
      res.end(
        await readFile(
          resolve(root, "." + (path === "/" ? "/index.html" : path)),
        ),
      );
    } catch {
      res.writeHead(404);
      res.end();
    }
  })
  .listen(Number(process.env.PORT || 4190), "127.0.0.1", () =>
    console.log("Local studio: http://127.0.0.1:" + (process.env.PORT || 4190)),
  );
