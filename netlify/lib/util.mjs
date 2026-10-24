// Small helpers shared by every API module: errors, text cleaning, dates, and
// Blobs access.

import { createHash, randomBytes } from "node:crypto";
import { CODE_CHARS, DATE, ID, MEALS } from "./vocab.mjs";

// Days stored before a meal existed lack that key. Always read stored days
// through this so every meal is an array (null stays null).
export const normDay = day => {
  if (!day) return day;
  const out = { ...day };
  for (const m of MEALS) if (!Array.isArray(out[m])) out[m] = [];
  return out;
};

export class HttpError extends Error {
  constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; }
}
export const fail = (status, message, extra) => { throw new HttpError(status, message, extra); };

export const json = (data, status = 200, headers = {}) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function body(req) {
  try { return await req.json(); } catch { fail(400, "Request body must be JSON"); }
}

// ---------- text ----------
export const str = (v, max) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");
export const text = (v, max) => (typeof v === "string" ? v.trim().replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").slice(0, max) : "");
export const pick = (arr, allowed) => (Array.isArray(arr) ? [...new Set(arr.filter(x => allowed.includes(x)))] : []);
export const sha = s => createHash("sha256").update(s).digest("hex");
export const randomId = (n = 12) => randomBytes(n).toString("hex").slice(0, n);
export const randomCode = n => Array.from(randomBytes(n), b => CODE_CHARS[b % CODE_CHARS.length]).join("");
export const normCode = s => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
export const slug = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export const normEmail = s => String(s || "").trim().toLowerCase();
export const validEmail = s => s.length <= 254 && /^[^\s@]{1,64}@[^\s@.]{1,190}(\.[^\s@.]{1,63})+$/.test(s);
export const emailHash = email => sha("email:" + normEmail(email)).slice(0, 20);

// A short, readable word list filter for free-text fields. Deliberately small:
// it catches the obvious cases and staff can hide anything else.
const BLOCKED = ["fuck", "shit", "bitch", "asshole", "cunt", "dick", "nigg", "fag", "retard", "slut", "whore"];
export function cleanProfanity(s) {
  let out = s;
  for (const w of BLOCKED) out = out.replace(new RegExp(w + "\\w*", "gi"), m => "*".repeat(m.length));
  return out;
}

// ---------- dates ----------
export function validTz(tz) {
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; }
}

// Today's date (YYYY-MM-DD) in the school's own time zone.
export function todayIn(tz) {
  if (globalThis.__LL_TODAY) return globalThis.__LL_TODAY; // set only by scripts/dev.mjs
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = t => parts.find(p => p.type === t).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function validDate(d) {
  if (typeof d !== "string" || !DATE.test(d)) return false;
  const t = new Date(d + "T00:00:00Z");
  return !isNaN(t) && t.toISOString().slice(0, 10) === d;
}
export const addDays = (d, n) => { const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
export const daysBetween = (a, b) => Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 864e5);

export function range(q, maxDays) {
  const from = q.get("from"), to = q.get("to");
  if (!validDate(from) || !validDate(to)) fail(400, "from and to must be dates (YYYY-MM-DD)");
  const span = daysBetween(from, to);
  if (span < 0 || span > maxDays) fail(400, `Date range must be 0–${maxDays} days`);
  return { from, to };
}
export const eachDate = (from, to) => Array.from({ length: daysBetween(from, to) + 1 }, (_, i) => addDays(from, i));

// ---------- Blobs ----------
export const BATCH = 50;

export async function getAll(store, keys) {
  const out = [];
  for (let i = 0; i < keys.length; i += BATCH) {
    const chunk = await Promise.all(keys.slice(i, i + BATCH).map(k => store.get(k, { type: "json" })));
    out.push(...chunk);
  }
  return out.filter(Boolean);
}
export const listKeys = async (store, prefix) => (await store.list({ prefix })).blobs.map(b => b.key);

export async function deleteAll(store, keys) {
  for (let i = 0; i < keys.length; i += BATCH) await Promise.all(keys.slice(i, i + BATCH).map(k => store.delete(k)));
}

export async function loadSchool(store, id) {
  if (!ID.test(id || "")) fail(400, "Invalid school id");
  const s = await store.get(`school/${id}`, { type: "json" });
  if (!s) fail(404, "School not found");
  return s;
}

export function publicSchool(s) {
  return {
    id: s.id, name: s.name, code: s.code, tz: s.tz, created_at: s.created_at,
    theme: s.theme || { color: "#FF5A1F" }, grades: s.grades || ["9", "10", "11", "12"],
  };
}
