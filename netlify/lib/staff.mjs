// Staff identity: passwords, setup links, sessions, school membership and roles.
//
// A password belongs to one membership (one email at one school), so an admin
// can only ever hand out access to their own school, and a session only opens
// the schools whose password was given.
//
//   ml/{sha(token)}              pending setup link   { email, purpose: "setup", school, exp }
//   sess/{sha(token)}            staff session        { email, schools (null = every school of that email), exp }
//   staff/{school}/{emailHash}   member of a school   { email, role, added_at, added_by, pw? }
//   member/{emailHash}/{school}  index: schools an email belongs to (key only)
//   admin/{sha(key)}             legacy shared key -> school (still honoured until retired)

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { ROLES } from "./vocab.mjs";
import { fail, sha, emailHash, normEmail, normCode, loadSchool, listKeys, getAll } from "./util.mjs";

const scrypt = promisify(scryptCb);
const SETUP_TTL = 7 * 24 * 3600 * 1000;
const SESSION_TTL = 30 * 24 * 3600 * 1000;
export const COOKIE = "ll_session";

export const roleRank = r => ROLES.indexOf(r) + 1; // 0 when unknown

// ---------- passwords ----------
export const PASSWORD_MIN = 8;

async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  return { salt, hash: (await scrypt(password, salt, 32)).toString("base64url") };
}

// Always runs scrypt, even with no stored password, so a wrong email takes as long as a wrong password.
export async function checkPassword(pw, password) {
  const got = await scrypt(String(password), pw?.salt || "no-password-here", 32);
  const want = pw?.hash ? Buffer.from(pw.hash, "base64url") : Buffer.alloc(32);
  return !!pw?.hash && want.length === got.length && timingSafeEqual(got, want);
}

// Sets the password for one email at one school. False when they aren't on that team.
export async function setMemberPassword(store, schoolId, email, password) {
  const key = `staff/${schoolId}/${emailHash(email)}`;
  const row = await store.get(key, { type: "json" });
  if (!row) return false;
  await store.setJSON(key, { ...row, pw: await hashPassword(password) });
  return true;
}

// ---------- setup links ----------
// An admin hands one to a teammate so they can set (or reset) their password for that school.
export async function createMagic(store, data) {
  const token = randomBytes(24).toString("base64url");
  await store.setJSON(`ml/${sha(token)}`, { ...data, exp: Date.now() + SETUP_TTL });
  return token;
}

async function readMagic(store, token) {
  if (typeof token !== "string" || token.length < 20 || token.length > 80) fail(400, "That setup link isn't valid. Ask your admin for a new one.");
  const key = `ml/${sha(token)}`;
  const row = await store.get(key, { type: "json" });
  if (!row) fail(400, "That setup link was already used or isn't valid. Ask your admin for a new one.");
  return { key, row };
}

// Look without using it up (to show who the link is for).
export async function peekMagic(store, token) {
  const { row } = await readMagic(store, token);
  if (row.exp < Date.now()) fail(400, "That setup link expired. Ask your admin for a new one.");
  return row;
}

// Single use: read, delete, then check expiry.
export async function consumeMagic(store, token) {
  const { key, row } = await readMagic(store, token);
  await store.delete(key);
  if (row.exp < Date.now()) fail(400, "That setup link expired. Ask your admin for a new one.");
  return row;
}

// ---------- sessions ----------
// `schools` lists the schools this session opens; null opens every school the email belongs to (master code).
export async function startSession(store, email, schools = null) {
  const token = randomBytes(32).toString("base64url");
  await store.setJSON(`sess/${sha(token)}`, { email: normEmail(email), schools, exp: Date.now() + SESSION_TTL });
  return token;
}

export function sessionCookie(token, req, maxAgeSec = SESSION_TTL / 1000) {
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}

export function readCookie(req, name = COOKIE) {
  const h = req.headers.get("cookie") || "";
  for (const part of h.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return "";
}

export async function readSession(store, req) {
  const token = readCookie(req);
  if (!token) return null;
  const row = await store.get(`sess/${sha(token)}`, { type: "json" });
  if (!row) return null;
  if (row.exp < Date.now()) { await store.delete(`sess/${sha(token)}`); return null; }
  return { email: row.email, token, schools: Array.isArray(row.schools) ? row.schools : null };
}

export async function endSession(store, req) {
  const token = readCookie(req);
  if (token) await store.delete(`sess/${sha(token)}`);
}

// ---------- membership ----------
export async function addMember(store, schoolId, email, role, by = "") {
  const e = normEmail(email), eh = emailHash(e);
  const existing = await store.get(`staff/${schoolId}/${eh}`, { type: "json" });
  const row = { email: e, role, added_at: existing?.added_at || new Date().toISOString(), added_by: existing?.added_by || by, ...(existing?.pw ? { pw: existing.pw } : {}) };
  await Promise.all([
    store.setJSON(`staff/${schoolId}/${eh}`, row),
    store.set(`member/${eh}/${schoolId}`, "1"),
  ]);
  return { id: eh, ...row };
}

export async function removeMember(store, schoolId, eh) {
  await Promise.all([store.delete(`staff/${schoolId}/${eh}`), store.delete(`member/${eh}/${schoolId}`)]);
}

export async function listMembers(store, schoolId) {
  const keys = await listKeys(store, `staff/${schoolId}/`);
  const rows = await getAll(store, keys);
  return rows.map((r, i) => ({ id: emailHash(r.email), ...r })).sort((a, b) => roleRank(b.role) - roleRank(a.role) || a.added_at.localeCompare(b.added_at));
}

// Every school an email is on the team of, with its membership row.
export async function membershipsFor(store, email) {
  const eh = emailHash(email);
  const keys = await listKeys(store, `member/${eh}/`);
  const out = [];
  for (const k of keys) {
    const id = k.split("/")[2];
    const [school, staff] = await Promise.all([store.get(`school/${id}`, { type: "json" }), store.get(`staff/${id}/${eh}`, { type: "json" })]);
    if (school && staff) out.push({ school, staff });
  }
  return out;
}

// `only`, when given, limits the answer to those school ids (a session's schools).
export async function schoolsFor(store, email, only = null) {
  return (await membershipsFor(store, email))
    .filter(({ school }) => !only || only.includes(school.id))
    .map(({ school, staff }) => ({ school, role: staff.role }));
}

// ---------- request auth ----------
// Who is calling, and as what role at this school? Accepts a session cookie or
// the legacy staff key header (treated as an owner until the key is retired).
export async function requireStaff(store, req, schoolId, minRole = "cook") {
  const school = await loadSchool(store, schoolId);
  const need = roleRank(minRole);

  const sess = await readSession(store, req);
  if (sess) {
    // The cookie is sent automatically by browsers, so state-changing calls must
    // also carry a header a cross-site form can't set.
    if (!["GET", "HEAD"].includes(req.method) && !req.headers.get("x-ll")) fail(403, "Missing request header.");
    const opens = !sess.schools || sess.schools.includes(school.id);
    const staff = opens && await store.get(`staff/${school.id}/${emailHash(sess.email)}`, { type: "json" });
    if (staff) {
      if (roleRank(staff.role) < need) fail(403, `You need the ${minRole} role for that.`);
      return { school, user: { email: sess.email, role: staff.role, via: "email" } };
    }
  }

  const key = normCode(req.headers.get("x-admin-key"));
  if (key.length >= 12) {
    const ref = await store.get(`admin/${sha(key)}`, { type: "json" });
    if (ref && ref.school === school.id) return { school, user: { email: "", role: "owner", via: "key" } };
  }

  fail(sess ? 403 : 401, sess ? "Your email isn't a staff member at this school." : "Please sign in.");
}

// Any signed-in staff identity at all (for /auth/me).
export async function whoAmI(store, req) {
  const sess = await readSession(store, req);
  if (sess) {
    const rows = await schoolsFor(store, sess.email, sess.schools);
    return { email: sess.email, via: "email", schools: rows };
  }
  const key = normCode(req.headers.get("x-admin-key"));
  if (key.length >= 12) {
    const ref = await store.get(`admin/${sha(key)}`, { type: "json" });
    if (ref) {
      const school = await store.get(`school/${ref.school}`, { type: "json" });
      if (school) return { email: "", via: "key", schools: [{ school, role: "owner" }] };
    }
  }
  return null;
}
