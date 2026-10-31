// staff accounts: magic links, sessions, team members. no passwords
import { randomBytes } from "node:crypto";
import { ROLES } from "./vocab.mjs";
import { fail, sha, emailHash, normEmail, normCode, loadSchool, listKeys, getAll } from "./util.mjs";

// how long things last
export const LOGIN_TTL = 15 * 60 * 1000;
export const INVITE_TTL = 7 * 24 * 3600 * 1000;
const SESSION_TTL = 30 * 24 * 3600 * 1000;
export const COOKIE = "ll_session";

// role order
export const roleRank = r => ROLES.indexOf(r) + 1; // 0 if unknown

// sign in links
export async function createMagic(store, data, ttl = LOGIN_TTL) {
  const token = randomBytes(24).toString("base64url");
  await store.setJSON(`ml/${sha(token)}`, { ...data, exp: Date.now() + ttl });
  return token;
}

// look up a link
async function readMagic(store, token) {
  if (typeof token !== "string" || token.length < 20 || token.length > 80) fail(400, "That sign-in link isn't valid. Ask for a new one.");
  const key = `ml/${sha(token)}`;
  const row = await store.get(key, { type: "json" });
  if (!row) fail(400, "That sign-in link was already used or isn't valid. Ask for a new one.");
  return { key, row };
}

// links only work once
export async function consumeMagic(store, token) {
  const { key, row } = await readMagic(store, token);
  await store.delete(key);
  if (row.exp < Date.now()) fail(400, "That sign-in link expired. Ask for a new one.");
  return row;
}

// mark them as signed in at least once
export async function markJoined(store, email) {
  const eh = emailHash(email);
  for (const k of await listKeys(store, `member/${eh}/`)) {
    const key = `staff/${k.split("/")[2]}/${eh}`;
    const row = await store.get(key, { type: "json" });
    if (row && !row.joined_at) await store.setJSON(key, { ...row, joined_at: new Date().toISOString() });
  }
}

// sessions
export async function startSession(store, email, schools = null) {
  const token = randomBytes(32).toString("base64url");
  await store.setJSON(`sess/${sha(token)}`, { email: normEmail(email), schools, exp: Date.now() + SESSION_TTL });
  return token;
}

// the cookie
export function sessionCookie(token, req, maxAgeSec = SESSION_TTL / 1000) {
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}

// pull the cookie out
export function readCookie(req, name = COOKIE) {
  const h = req.headers.get("cookie") || "";
  for (const part of h.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return "";
}

// who is signed in
export async function readSession(store, req) {
  const token = readCookie(req);
  if (!token) return null;
  const row = await store.get(`sess/${sha(token)}`, { type: "json" });
  if (!row) return null;
  if (row.exp < Date.now()) { await store.delete(`sess/${sha(token)}`); return null; }
  return { email: row.email, token, schools: Array.isArray(row.schools) ? row.schools : null };
}

// sign out
export async function endSession(store, req) {
  const token = readCookie(req);
  if (token) await store.delete(`sess/${sha(token)}`);
}

// team members
export async function addMember(store, schoolId, email, role, by = "") {
  const e = normEmail(email), eh = emailHash(e);
  const existing = await store.get(`staff/${schoolId}/${eh}`, { type: "json" });
  const row = { email: e, role, added_at: existing?.added_at || new Date().toISOString(), added_by: existing?.added_by || by, ...(existing?.joined_at ? { joined_at: existing.joined_at } : {}) };
  await Promise.all([
    store.setJSON(`staff/${schoolId}/${eh}`, row),
    store.set(`member/${eh}/${schoolId}`, "1"),
  ]);
  return { id: eh, ...row };
}

// remove someone
export async function removeMember(store, schoolId, eh) {
  await Promise.all([store.delete(`staff/${schoolId}/${eh}`), store.delete(`member/${eh}/${schoolId}`)]);
}

// everyone on a team
export async function listMembers(store, schoolId) {
  const keys = await listKeys(store, `staff/${schoolId}/`);
  const rows = await getAll(store, keys);
  return rows.map((r, i) => ({ id: emailHash(r.email), ...r })).sort((a, b) => roleRank(b.role) - roleRank(a.role) || a.added_at.localeCompare(b.added_at));
}

// schools an email is on
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

// same but can limit to some schools
export async function schoolsFor(store, email, only = null) {
  return (await membershipsFor(store, email))
    .filter(({ school }) => !only || only.includes(school.id))
    .map(({ school, staff }) => ({ school, role: staff.role }));
}

// who is calling and can they do this
export async function requireStaff(store, req, schoolId, minRole = "cook") {
  const school = await loadSchool(store, schoolId);
  const need = roleRank(minRole);

  const sess = await readSession(store, req);
  if (sess) {
    // changes need our header so other sites can't trigger them
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

// anyone signed in at all
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
