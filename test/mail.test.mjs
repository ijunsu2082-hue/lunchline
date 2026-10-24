import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { sendMail, mailConfigured, demoLinks } from "../netlify/lib/mail.mjs";

const KEYS = ["RESEND_API_KEY", "BREVO_API_KEY", "ALLOW_DEMO_LOGIN_LINKS", "FROM_EMAIL"];
let saved, realFetch, calls;

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map(k => [k, process.env[k]]));
  KEYS.forEach(k => delete process.env[k]);
  globalThis.__LL_DEV = false;
  realFetch = globalThis.fetch;
  calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url, init, body: JSON.parse(init.body) }); return new Response("{}", { status: 200 }); };
});
afterEach(() => {
  KEYS.forEach(k => { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; });
  globalThis.fetch = realFetch;
  globalThis.__LL_DEV = true;
});

const msg = { to: "cook@school.edu", subject: "Hi", html: "<p>Hi</p>", text: "Hi" };

test("with no email service and no demo mode, sending is refused with a clear message", async () => {
  await assert.rejects(() => sendMail(msg), e => e.status === 503 && /email/i.test(e.message));
  assert.equal(calls.length, 0);
  assert.equal(mailConfigured(), false);
  assert.equal(demoLinks(), false);
});

test("demo mode shows the link instead of emailing, and never calls out", async () => {
  process.env.ALLOW_DEMO_LOGIN_LINKS = "true";
  assert.deepEqual(await sendMail(msg), { dev: true });
  assert.equal(calls.length, 0);
});

test("Resend gets the key, sender and recipient", async () => {
  process.env.RESEND_API_KEY = "re_test";
  process.env.FROM_EMAIL = "LunchLine <hello@school.edu>";
  assert.deepEqual(await sendMail(msg), { sent: true });
  assert.equal(calls[0].url, "https://api.resend.com/emails");
  assert.equal(calls[0].init.headers.Authorization, "Bearer re_test");
  assert.equal(calls[0].body.from, "LunchLine <hello@school.edu>");
  assert.deepEqual(calls[0].body.to, ["cook@school.edu"]);
});

test("Brevo works with a single verified sender address", async () => {
  process.env.BREVO_API_KEY = "xkeysib-test";
  process.env.FROM_EMAIL = "cafeteria@school.edu";
  assert.deepEqual(await sendMail(msg), { sent: true });
  assert.equal(calls[0].url, "https://api.brevo.com/v3/smtp/email");
  assert.equal(calls[0].init.headers["api-key"], "xkeysib-test");
  assert.deepEqual(calls[0].body.sender, { name: "LunchLine", email: "cafeteria@school.edu" });
  assert.deepEqual(calls[0].body.to, [{ email: "cook@school.edu" }]);
  assert.equal(calls[0].body.htmlContent, "<p>Hi</p>");
});

test("a provider error becomes a friendly 502 and never leaks the key", async () => {
  process.env.RESEND_API_KEY = "re_secret_key";
  globalThis.fetch = async () => new Response("bad key re_secret_key", { status: 401 });
  const origErr = console.error; console.error = () => {};
  try {
    await assert.rejects(() => sendMail(msg), e => e.status === 502 && !e.message.includes("re_secret_key"));
  } finally { console.error = origErr; }
});
