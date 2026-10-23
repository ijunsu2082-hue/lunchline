// Local dev server: serves public/ and runs the real API against a local
// Netlify Blobs server stored in .netlify/dev-blobs.
//   node scripts/dev.mjs            (today = real date)
//   LL_TODAY=2026-10-19 node scripts/dev.mjs
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { BlobsServer } from "@netlify/blobs/server";
import { getStore } from "@netlify/blobs";
import { handle } from "../netlify/lib/api.mjs";

const PORT = Number(process.env.PORT || 8888);
const ROOT = fileURLToPath(new URL("../public/", import.meta.url));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2" };

const blobs = new BlobsServer({ directory: ".netlify/dev-blobs", token: "dev" });
const { port } = await blobs.start();
const edge = `http://localhost:${port}`;
globalThis.netlifyBlobsContext = Buffer.from(JSON.stringify({ edgeURL: edge, uncachedEdgeURL: edge, siteID: "dev-site", token: "dev" })).toString("base64");
if (process.env.LL_TODAY) globalThis.__LL_TODAY = process.env.LL_TODAY;

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(url, { method: req.method, headers: req.headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const response = await handle(request, getStore({ name: "lunchline", consistency: "strong" }));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
    return;
  }
  const path = normalize(join(ROOT, url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname)));
  if (!path.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    const data = await readFile(path);
    res.writeHead(200, { "Content-Type": TYPES[extname(path)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(PORT, "0.0.0.0", () => console.log(`LunchLine dev on http://localhost:${PORT}${globalThis.__LL_TODAY ? ` (today = ${globalThis.__LL_TODAY})` : ""}`));
