// Fixed-window rate limits kept in the same Blobs store. Counters are
// read-then-write, so a burst of parallel requests can slip a few extra
// through. That's fine for abuse control; it is not a billing meter.

import { createHash } from "node:crypto";
import { HttpError } from "./util.mjs";

export function clientIp(req) {
  return req.headers.get("x-nf-client-connection-ip")
    || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim()
    || "local";
}

export const ipHash = (secret, ip) => createHash("sha256").update(secret + "|" + ip).digest("hex").slice(0, 16);

export async function hit(store, key, max, windowSec, now = Date.now()) {
  const nowSec = Math.floor(now / 1000);
  const win = Math.floor(nowSec / windowSec);
  const k = `rl/${key}/${win}`;
  const cur = (await store.get(k, { type: "json" })) || { n: 0 };
  if (cur.n >= max) return { ok: false, retryAfter: windowSec - (nowSec % windowSec) };
  await store.setJSON(k, { n: cur.n + 1 });
  return { ok: true, left: max - cur.n - 1 };
}

// Throws a 429 with a friendly message when over the limit.
export async function limit(store, key, max, windowSec, what = "requests") {
  const r = await hit(store, key, max, windowSec);
  if (!r.ok) {
    const mins = Math.max(1, Math.ceil(r.retryAfter / 60));
    throw new HttpError(429, `Too many ${what}. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`, { retryAfter: r.retryAfter });
  }
}
