// Signed tokens and the proof-of-work challenge.
//
// A student's device gets a token the first time it joins a school. The token
// binds a random device id to one school and is signed with a server secret, so
// a script that only knows a school id can't submit ratings. To get a token the
// device solves a small proof-of-work puzzle, which costs a browser a second or
// two and costs a bot farm real compute for every fake device it wants.

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const b64u = v => Buffer.from(v).toString("base64url");

export function sign(secret, payload) {
  const body = b64u(JSON.stringify(payload));
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verify(secret, token) {
  if (typeof token !== "string" || token.length > 1024) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, mac] = parts;
  const want = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(mac), b = Buffer.from(want);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try { return JSON.parse(Buffer.from(body, "base64url").toString("utf8")); } catch { return null; }
}

// ---------- server secret ----------
// SESSION_SECRET wins. Otherwise the server makes one random secret the first
// time it's needed and keeps it in the store, so nothing has to be configured.
let cachedSecret;
export async function getSecret(store) {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) return process.env.SESSION_SECRET;
  if (cachedSecret) return cachedSecret;
  let s = await store.get("config/secret", { type: "json" });
  if (!s) {
    await store.setJSON("config/secret", { v: randomBytes(32).toString("hex") });
    s = await store.get("config/secret", { type: "json" }); // re-read: if two requests raced, both agree on the stored one
  }
  cachedSecret = s.v;
  return cachedSecret;
}
export function _resetSecretCache() { cachedSecret = undefined; }

// ---------- proof of work ----------
export const POW_BITS = Number(process.env.POW_BITS || 16);
const CHALLENGE_TTL = 10 * 60 * 1000;
export const TOKEN_TTL = 200 * 24 * 3600 * 1000;

export function makeChallenge(secret, schoolId, now = Date.now()) {
  return sign(secret, { k: "pow", r: randomBytes(12).toString("hex"), t: now, s: schoolId });
}

export function leadingZeroBits(buf) {
  let bits = 0;
  for (const byte of buf) {
    if (byte === 0) { bits += 8; continue; }
    bits += Math.clz32(byte) - 24;
    break;
  }
  return bits;
}

export function powSolved(challenge, nonce, bits = POW_BITS) {
  if (typeof nonce !== "string" || nonce.length > 32) return false;
  const h = createHash("sha256").update(`${challenge}:${nonce}`).digest();
  return leadingZeroBits(h) >= bits;
}

// Returns the challenge payload when it's genuine, fresh, and for this school.
export function checkChallenge(secret, challenge, schoolId, now = Date.now()) {
  const p = verify(secret, challenge);
  if (!p || p.k !== "pow" || p.s !== schoolId) return null;
  if (now - p.t > CHALLENGE_TTL || now < p.t) return null;
  return p;
}

export function makeVoterToken(secret, schoolId, voterId, now = Date.now()) {
  return sign(secret, { k: "voter", s: schoolId, v: voterId, t: now });
}

export function readVoterToken(secret, token, schoolId, now = Date.now()) {
  const p = verify(secret, token);
  if (!p || p.k !== "voter" || p.s !== schoolId || typeof p.v !== "string") return null;
  if (now - p.t > TOKEN_TTL) return null;
  return p.v;
}
