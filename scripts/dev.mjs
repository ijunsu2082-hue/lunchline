// local dev server. LL_TODAY=2026-10-19 fakes the date, LL_LAN=1 opens it to your phone
import http from "node:http";
// load .env
try { process.loadEnvFile(new URL("../.env", import.meta.url)); } catch { /* no .env is fine */ }
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { networkInterfaces } from "node:os";
import { BlobsServer } from "@netlify/blobs/server";
import { getStore } from "@netlify/blobs";
import { handle } from "../netlify/lib/api.mjs";

// settings
const PORT = Number(process.env.PORT || 8888);
const HOST = process.env.LL_LAN ? "0.0.0.0" : "127.0.0.1";
const ROOT = fileURLToPath(new URL("../public/", import.meta.url));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2" };

// same security headers as production
const SECURITY = {};
try {
  const toml = readFileSync(fileURLToPath(new URL("../netlify.toml", import.meta.url)), "utf8");
  const block = toml.slice(toml.indexOf('for = "/*"'), toml.indexOf("[[headers]]", toml.indexOf('for = "/*"') + 1) > 0 ? toml.indexOf("[[headers]]", toml.indexOf('for = "/*"') + 1) : undefined);
  for (const m of block.matchAll(/^\s+([A-Za-z-]+) = "([^"]+)"$/gm)) SECURITY[m[1]] = m[2];
} catch { /* headers are optional in dev */ }

// local blob store
const blobs = new BlobsServer({ directory: process.env.LL_DATA || ".netlify/dev-blobs", token: "dev" });
const { port } = await blobs.start();
const edge = `http://localhost:${port}`;
globalThis.netlifyBlobsContext = Buffer.from(JSON.stringify({ edgeURL: edge, uncachedEdgeURL: edge, siteID: "dev-site", token: "dev" })).toString("base64");
// dev flags
if (process.env.LL_TODAY) globalThis.__LL_TODAY = process.env.LL_TODAY;
globalThis.__LL_DEV = true; // setup links point back at this server, not SITE_URL

// api calls go to the real api code, everything else is a file
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(url, { method: req.method, headers: req.headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks) });
    let response;
    try { response = await handle(request, getStore({ name: "lunchline", consistency: "strong" })); }
    catch (e) {
      console.error(`API error on ${req.method} ${url.pathname}:`, e);
      response = new Response(JSON.stringify({ error: "Server error: " + (e?.message || e) }), { status: 500, headers: { "content-type": "application/json" } });
    }
    const headers = Object.fromEntries(response.headers);
    const cookies = response.headers.getSetCookie?.() || [];
    if (cookies.length) headers["set-cookie"] = cookies;
    res.writeHead(response.status, headers);
    res.end(Buffer.from(await response.arrayBuffer()));
    return;
  }
  // static files
  let path = normalize(join(ROOT, url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname)));
  if (!path.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    const data = await readFile(path);
    res.writeHead(200, { ...SECURITY, "Content-Type": TYPES[extname(path)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  } catch {
    res.writeHead(404).end("Not found");
  }
});

// port already taken
server.on("error", e => {
  if (e.code === "EADDRINUSE") {
    console.error(`\nPort ${PORT} is already in use, probably by an older LunchLine dev server that is still running with old code.\nStop it (close its terminal, or end the node process) and run this again, or pick another port:  PORT=8899 npm run dev\n`);
    process.exit(1);
  }
  throw e;
});

// say where it is
server.listen(PORT, HOST, () => {
  console.log(`LunchLine dev on http://localhost:${PORT}${globalThis.__LL_TODAY ? ` (today = ${globalThis.__LL_TODAY})` : ""}`);
  if (process.env.LL_LAN) {
    for (const list of Object.values(networkInterfaces())) for (const n of list || []) {
      if (n.family === "IPv4" && !n.internal) console.log(`On your phone (same wifi):  http://${n.address}:${PORT}`);
    }
    console.log("Open the app from that address on your computer too, so the QR codes it makes point to an address your phone can reach.");
  }
});
