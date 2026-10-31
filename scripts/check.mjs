// checks everything lines up: npm run check
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

// paths
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUB = join(ROOT, "public");
const problems = [];
const bad = (section, msg) => problems.push({ section, msg });
const rel = p => relative(ROOT, p).split(sep).join("/");

// list all files
function walk(dir) {
  return readdirSync(dir).flatMap(n => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const jsFiles = walk(join(PUB, "js")).filter(f => f.endsWith(".js"));
const lines = f => readFileSync(f, "utf8").split(/\r?\n/);

// language files
const en = Object.keys((await import(pathToFileURL(join(PUB, "i18n/en.js")).href)).default);
const es = new Set(Object.keys((await import(pathToFileURL(join(PUB, "i18n/es.js")).href)).default));
const enSet = new Set(en);
const DYNAMIC = ["allergen.", "cuisine.", "diet.", "rate.", "status.", "ago."];

// every t() key exists in en.js
let used = 0;
for (const f of jsFiles) {
  lines(f).forEach((line, i) => {
    const keys = new Set();
    for (const m of line.matchAll(/\bt\(\s*(["'])([\w.-]+)\1/g)) keys.add(m[2]);
    if (/\bt\(/.test(line)) for (const m of line.matchAll(/(["'])([a-z]+\.[\w.-]+)\1/g)) if (/^[a-z]+\.[a-z_0-9]+$/.test(m[2]) && /^[a-z]+$/.test(m[2].split(".")[0]) && en.some(k => k.split(".")[0] === m[2].split(".")[0])) keys.add(m[2]);
    for (const m of line.matchAll(/\bt\(\s*[`"']([a-z]+\.)(?:["'`]\s*\+|\$\{)/g)) {
      if (!en.some(k => k.startsWith(m[1]))) bad("i18n", `${rel(f)}:${i + 1} dynamic prefix "${m[1]}" has no keys in en.js`);
    }
    for (const k of keys) {
      if (k.endsWith(".")) continue; // dynamic prefix, checked below
      used++;
      if (!enSet.has(k)) bad("i18n", `${rel(f)}:${i + 1} key "${k}" is not in public/i18n/en.js`);
    }
  });
}
for (const p of DYNAMIC) if (!en.some(k => k.startsWith(p))) bad("i18n", `no keys under dynamic prefix "${p}" in en.js`);

// every english key has a spanish one
for (const k of en) if (!es.has(k)) bad("es", `key "${k}" is in en.js but missing from es.js`);
for (const k of es) if (!enSet.has(k)) bad("es", `key "${k}" is in es.js but not en.js`);

// imports point at real files and exports
const exportsOf = src => {
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([\w$]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g))
    for (const part of m[1].split(",")) { const n = part.trim().split(/\s+as\s+/).pop(); if (n) names.add(n); }
  if (/export\s+default\b/.test(src)) names.add("default");
  return names;
};
let imports = 0;
for (const f of jsFiles) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/import\s+(?:([\s\S]*?)\s+from\s+)?(["'])(\.{1,2}\/[^"'?]+)(?:\?[^"']*)?\2/g)) {
    imports++;
    const line = src.slice(0, m.index).split("\n").length;
    const target = resolve(dirname(f), m[3]);
    if (!existsSync(target)) { bad("import", `${rel(f)}:${line} imports ${m[3]} which does not exist`); continue; }
    if (!m[1]) continue;
    const ex = exportsOf(readFileSync(target, "utf8"));
    const clause = m[1];
    const named = (clause.match(/\{([\s\S]*)\}/) || [, ""])[1].split(",").map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
    for (const n of named) if (!ex.has(n)) bad("import", `${rel(f)}:${line} imports { ${n} } but ${rel(target)} does not export it`);
    const def = clause.replace(/\{[\s\S]*\}/, "").replace(/,/g, "").trim();
    if (def && !def.startsWith("*") && !ex.has("default")) bad("import", `${rel(f)}:${line} default-imports ${m[3]} which has no default export`);
  }
}

// service worker file list matches what's on disk
const swPath = join(PUB, "sw.js");
const sw = readFileSync(swPath, "utf8");
const shell = (sw.match(/const SHELL = \[([\s\S]*?)\];/) || [, ""])[1];
const listed = [...shell.matchAll(/"([^"]+)"/g)].map(m => m[1]);
const listedPaths = new Set(listed.map(u => u.split("?")[0]));
for (const u of listed) {
  const p = u.split("?")[0];
  if (p !== "/" && !existsSync(join(PUB, p))) bad("sw", `public/sw.js lists ${u} but public${p} does not exist`);
}
if (!listedPaths.has("/")) bad("sw", "public/sw.js does not precache /");
const expected = [
  ...jsFiles.map(f => "/" + relative(PUB, f).split(sep).join("/")),
  "/vendor/qrcode.mjs", "/i18n/en.js", "/i18n/es.js", "/styles.css", "/landing.css", "/flat.css", "/logo.svg", "/icon.svg",
  ...readdirSync(join(PUB, "fonts")).filter(n => n.endsWith(".woff2")).map(n => "/fonts/" + n),
];
for (const p of expected) if (!listedPaths.has(p)) bad("sw", `${p} exists but is not in the public/sw.js precache list`);
const cacheName = (sw.match(/const CACHE = "([^"]+)"/) || [])[1];
if (!cacheName) bad("sw", "public/sw.js has no CACHE constant");

for (const f of jsFiles) {
  // every browser file has to parse
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status !== 0) bad("syntax", `${rel(f)} doesn't parse: ${(r.stderr.split("\n").find(l => /Error/.test(l)) || "").trim()}`);
}

// summary
console.log(`i18n: ${used} key uses checked against ${en.length} English keys (${es.size} Spanish)`);
console.log(`imports: ${imports} relative imports checked in ${jsFiles.length} files`);
console.log(`sw: ${listed.length} precache entries, cache "${cacheName}"`);
for (const p of problems) console.log(`  [${p.section}] ${p.msg}`);
console.log(problems.length ? `\nFAIL: ${problems.length} problem(s)` : "\nPASS: all checks passed");
process.exit(problems.length ? 1 : 0);
