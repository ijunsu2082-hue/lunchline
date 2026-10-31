// device tokens and the puzzle
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// base64 helper
const b64u = v => Buffer.from(v).toString("base64url");

// sign some data
export function sign(secret, payload) {
  const body = b64u(JSON.stringify(payload));
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

// check a signed token
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

// server secret
let cachedSecret;
export async function getSecret(store) {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) return process.env.SESSION_SECRET;
  if (cachedSecret) return cachedSecret;
  let s = await store.get("config/secret", { type: "json" });
  if (!s) {
    await store.setJSON("config/secret", { v: randomBytes(32).toString("hex") });
    s = await store.get("config/secret", { type: "json" }); // read again in case two requests raced
  }
  cachedSecret = s.v;
  return cachedSecret;
}
export function _resetSecretCache() { cachedSecret = undefined; }

// proof of work puzzle
export const POW_BITS = Number(process.env.POW_BITS || 16);
const CHALLENGE_TTL = 10 * 60 * 1000;
export const TOKEN_TTL = 200 * 24 * 3600 * 1000;

// new puzzle
export function makeChallenge(secret, schoolId, now = Date.now()) {
  return sign(secret, { k: "pow", r: randomBytes(12).toString("hex"), t: now, s: schoolId });
}

// count zero bits
export function leadingZeroBits(buf) {
  let bits = 0;
  for (const byte of buf) {
    if (byte === 0) { bits += 8; continue; }
    bits += Math.clz32(byte) - 24;
    break;
  }
  return bits;
}

// did they solve it
export function powSolved(challenge, nonce, bits = POW_BITS) {
  if (typeof nonce !== "string" || nonce.length > 32) return false;
  const h = createHash("sha256").update(`${challenge}:${nonce}`).digest();
  return leadingZeroBits(h) >= bits;
}

// is the puzzle real and fresh
export function checkChallenge(secret, challenge, schoolId, now = Date.now()) {
  const p = verify(secret, challenge);
  if (!p || p.k !== "pow" || p.s !== schoolId) return null;
  if (now - p.t > CHALLENGE_TTL || now < p.t) return null;
  return p;
}

// token for one device
export function makeVoterToken(secret, schoolId, voterId, now = Date.now()) {
  return sign(secret, { k: "voter", s: schoolId, v: voterId, t: now });
}

// read the device id back out
export function readVoterToken(secret, token, schoolId, now = Date.now()) {
  const p = verify(secret, token);
  if (!p || p.k !== "voter" || p.s !== schoolId || typeof p.v !== "string") return null;
  if (now - p.t > TOKEN_TTL) return null;
  return p.v;
}
