// tokens, puzzle and rate limit tests
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { sign, verify, makeChallenge, checkChallenge, powSolved, leadingZeroBits, makeVoterToken, readVoterToken, TOKEN_TTL } from "../netlify/lib/tokens.mjs";
import { hit } from "../netlify/lib/ratelimit.mjs";
import { memStore } from "./helpers.mjs";

const SECRET = "test-secret-test-secret";

test("signed tokens verify, and any change breaks them", () => {
  const t = sign(SECRET, { a: 1 });
  assert.deepEqual(verify(SECRET, t), { a: 1 });
  assert.equal(verify("other-secret-other-secret", t), null);
  const [body, mac] = t.split(".");
  assert.equal(verify(SECRET, `${Buffer.from('{"a":2}').toString("base64url")}.${mac}`), null);
  assert.equal(verify(SECRET, body), null);
  assert.equal(verify(SECRET, ""), null);
  assert.equal(verify(SECRET, "x".repeat(2000)), null);
});

test("leadingZeroBits counts bits across bytes", () => {
  assert.equal(leadingZeroBits(Buffer.from([0, 0, 0xff])), 16);
  assert.equal(leadingZeroBits(Buffer.from([0, 0x0f])), 12);
  assert.equal(leadingZeroBits(Buffer.from([0x80])), 0);
});

test("proof of work only passes with a real solution", () => {
  const c = makeChallenge(SECRET, "school123456");
  let n = 0;
  while (!powSolved(c, String(n), 10)) n++;
  assert.ok(powSolved(c, String(n), 10));
  const h = createHash("sha256").update(`${c}:${n}`).digest();
  assert.ok(leadingZeroBits(h) >= 10);
  assert.ok(!powSolved(c, "not-a-solution-" + n, 24));
  assert.ok(!powSolved(c, "x".repeat(40), 1), "oversized nonce is rejected");
});

test("challenges are tied to a school and expire", () => {
  const now = Date.now();
  const c = makeChallenge(SECRET, "school123456", now);
  assert.ok(checkChallenge(SECRET, c, "school123456", now + 1000));
  assert.equal(checkChallenge(SECRET, c, "otherschool12", now + 1000), null, "wrong school");
  assert.equal(checkChallenge(SECRET, c, "school123456", now + 11 * 60 * 1000), null, "expired");
  assert.equal(checkChallenge(SECRET, c, "school123456", now - 5000), null, "from the future");
  assert.equal(checkChallenge(SECRET, makeVoterToken(SECRET, "school123456", "voter-abcdef"), "school123456"), null, "a device token isn't a challenge");
});

test("device tokens bind one device to one school", () => {
  const now = Date.now();
  const t = makeVoterToken(SECRET, "school123456", "voter-abcdef", now);
  assert.equal(readVoterToken(SECRET, t, "school123456", now), "voter-abcdef");
  assert.equal(readVoterToken(SECRET, t, "otherschool12", now), null);
  assert.equal(readVoterToken(SECRET, t, "school123456", now + TOKEN_TTL + 1000), null);
  assert.equal(readVoterToken(SECRET, makeChallenge(SECRET, "school123456"), "school123456"), null, "a challenge isn't a device token");
});

test("rate limit counts per window and resets in the next one", async () => {
  const store = memStore();
  const t0 = 1_700_000_000_000;
  for (let i = 0; i < 3; i++) assert.ok((await hit(store, "k", 3, 60, t0)).ok);
  const blocked = await hit(store, "k", 3, 60, t0);
  assert.ok(!blocked.ok && blocked.retryAfter > 0 && blocked.retryAfter <= 60);
  assert.ok((await hit(store, "other", 3, 60, t0)).ok, "separate keys don't share a budget");
  assert.ok((await hit(store, "k", 3, 60, t0 + 61_000)).ok, "next window is fresh");
});
