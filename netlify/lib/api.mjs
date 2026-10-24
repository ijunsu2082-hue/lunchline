// LunchLine API: one function, routed by path. Everything lives in a single
// Netlify Blobs store, one key per record, so writes rarely need a
// read-modify-write on shared data.
//
//   school/{id}                          school record (incl. theme, grades, enrollment)
//   code/{CODE}                          join code -> school id
//   name/{slug}/{id}                     search index (key only)
//   staff/{id}/{emailHash}               staff member + role        (see staff.mjs)
//   day/{id}/{YYYY-MM-DD}                that day's breakfast + snack + lunch
//   vote/{id}/{date}/{voter}/{item}      one rating per device per dish (open 7 days)
//   votecache/{id}/{date}                compact ratings for a closed day (fast dashboards)
//   profile/{id}/{voter}                 optional grade level for a device
//   idea/{id}/{ideaId}                   student suggestion
//   ideavote/{id}/{ideaId}/{voter}       one +1 per device per idea
//   waste/{id}/{date}                    pounds thrown away that day
//   report/{id}/{date}                   weekly report
//   audit/{id}/{ts}-{rand}               who changed what
//   photo/{id}/{photoId}                 dish photo (binary)
//   rl/…  used/…  ml/…  sess/…           rate limits, spent challenges, setup links, sessions
//   seed/demo-v1                         marker: demo schools were created (see demo.mjs)

import { timingSafeEqual } from "node:crypto";
import {
  ALLERGENS, CUISINES, DIETS, MEALS, RATINGS, ROLES, IDEA_STATUSES, RATE_DAYS, COMMENT_MAX, IDEA_MAX, REPLY_MAX,
  PHOTO_MAX, PHOTO_TYPES, ID, VOTER,
} from "./vocab.mjs";
import {
  HttpError, fail, json, body, str, text, pick, sha, randomId, randomCode, normCode, slug, normEmail, validEmail, emailHash,
  cleanProfanity, validTz, todayIn, validDate, addDays, daysBetween, range, eachDate, BATCH, getAll, listKeys, deleteAll,
  loadSchool, publicSchool, normDay,
} from "./util.mjs";
import { getSecret, makeChallenge, checkChallenge, powSolved, POW_BITS, makeVoterToken, readVoterToken } from "./tokens.mjs";
import { clientIp, ipHash, limit } from "./ratelimit.mjs";
import { findSimilar, similarity, SAME, tidyText } from "./similarity.mjs";
import { computeInsights } from "./insights.mjs";
import { aiSummary, reportData, weekWindow } from "./reports.mjs";
import {
  createMagic, consumeMagic, peekMagic, startSession, sessionCookie, endSession, addMember, removeMember, listMembers,
  schoolsFor, membershipsFor, requireStaff, whoAmI, roleRank, checkPassword, setMemberPassword, PASSWORD_MIN, COOKIE,
} from "./staff.mjs";
import { DEMO_SCHOOLS, SEED_KEY, demoEnabled, masterEmail, masterSchoolName, demoId, demoDay, photoless } from "./demo.mjs";

const GRADE_LIST = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const DEFAULT_GRADES = ["9", "10", "11", "12"];
const DEFAULT_COLOR = "#FF5A1F";
const HEX = /^#[0-9a-fA-F]{6}$/;

export async function handle(req, store) {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
    const [resource, id, action] = parts;
    const m = req.method;
    const q = url.searchParams;

    switch (resource) {
      case "schools":
        if (m === "GET" && !id) return json(await findSchools(store, q));
        if (m === "GET" && id && !action) return json({ school: publicSchool(await loadSchool(store, id)) });
        if (m === "PATCH" && id && !action) return json(await updateSchool(store, req, id));
        if (m === "DELETE" && id && !action) return json(await deleteSchool(store, req, id));
        if (m === "POST" && id && action === "retire-key") return json(await retireKey(store, req, id));
        break;

      case "auth":
        if (m === "POST" && id === "signup") return await authSignup(store, req);
        if (m === "POST" && id === "login") return await authLogin(store, req);
        if (m === "POST" && id === "setup-info") return json(await authSetupInfo(store, req));
        if (m === "POST" && id === "setup") return await authSetup(store, req);
        if (m === "POST" && id === "master") return await authMaster(store, req);
        if (m === "GET" && id === "me") return json(await authMe(store, req));
        if (m === "POST" && id === "logout") { await endSession(store, req); return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", req, 0) }); }
        break;

      case "session": // legacy staff key sign-in
        if (m === "POST" && !id) return json(await authMe(store, req));
        break;

      case "staff":
        if (m === "GET" && !id) return json(await getStaff(store, req, q));
        if (m === "POST" && !id) return json(await inviteStaff(store, req), 201);
        if (m === "POST" && id && action === "link") return json(await memberLink(store, req, id, q));
        if (m === "DELETE" && id && !action) return json(await dropStaff(store, req, id, q));
        break;

      case "pow":
        if (m === "GET" && !id) return json(await getPow(store, req, q));
        break;
      case "token":
        if (m === "POST" && !id) return json(await issueToken(store, req), 201);
        break;
      case "profile":
        if (m === "GET" && !id) return json(await getProfile(store, req, q));
        if (m === "POST" && !id) return json(await setProfile(store, req));
        break;

      case "menu":
        if (m === "GET" && !id) return json(await getMenu(store, q));
        if (m === "PUT" && !id) return json(await putMenu(store, req));
        break;
      case "replies":
        if (m === "POST" && !id) return json(await postReply(store, req));
        break;

      case "votes":
        if (m === "GET" && !id) return json(await getMyVotes(store, req, q));
        if (m === "POST" && !id) return json(await castVote(store, req));
        if (m === "POST" && id === "hide") return json(await hideComment(store, req));
        break;

      case "insights":
        if (m === "GET" && !id) return json(await getInsights(store, req, q));
        break;
      case "waste":
        if (m === "PUT" && !id) return json(await putWaste(store, req));
        break;

      case "ideas":
        if (m === "GET" && !id) return json(await listIdeas(store, req, q));
        if (m === "GET" && id === "similar") return json(await similarIdeas(store, q));
        if (m === "GET" && id === "dupes") return json(await dupeIdeas(store, req, q));
        if (m === "POST" && !id) return json(await addIdea(store, req), 201);
        if (m === "POST" && id && action === "vote") return json(await voteIdea(store, req, id));
        if (m === "POST" && id && action === "merge") return json(await mergeIdea(store, req, id));
        if (m === "PATCH" && id && !action) return json(await patchIdea(store, req, id));
        if (m === "DELETE" && id && !action) return json(await deleteIdea(store, req, id, q));
        break;

      case "photos":
        if (m === "POST" && !id) return json(await uploadPhoto(store, req, q), 201);
        if (m === "GET" && id && action) return await getPhoto(store, id, action);
        break;

      case "reports":
        if (m === "GET" && !id) return json(await getReports(store, req, q));
        if (m === "POST" && id === "build") return json(await buildReportNow(store, req));
        break;

      case "audit":
        if (m === "GET" && !id) return json(await getAudit(store, req, q));
        break;
    }
    return json({ error: "Not found" }, 404);
  } catch (e) {
    if (e instanceof HttpError) {
      const headers = e.extra?.retryAfter ? { "Retry-After": String(e.extra.retryAfter) } : {};
      return json({ error: e.message, ...(e.extra?.code ? { code: e.extra.code } : {}) }, e.status, headers);
    }
    console.error(e);
    return json({ error: "Something went wrong on our side. Try again." }, 500);
  }
}

// ---------- audit ----------
async function audit(store, schoolId, by, action) {
  const at = new Date().toISOString();
  await store.setJSON(`audit/${schoolId}/${at}-${randomId(4)}`, { at, by: by || "staff key", action });
}

async function getAudit(store, req, q) {
  const { school } = await requireStaff(store, req, q.get("school"), "admin");
  const keys = (await listKeys(store, `audit/${school.id}/`)).sort().reverse().slice(0, 25);
  return { entries: await getAll(store, keys) };
}

// ---------- schools ----------
const staffSchool = s => ({ ...publicSchool(s), enrollment: s.enrollment || 0 });

// `id`, `grades` and `demo` are only set by the demo seeding below.
export async function createSchool(store, { name, tz, email, color, id, grades, demo }) {
  name = str(name, 60);
  if (name.length < 2) fail(400, "School name must be at least 2 characters");
  tz = typeof tz === "string" && validTz(tz) ? tz : "America/Chicago";

  let code;
  for (let i = 0; i < 8 && !code; i++) {
    const c = randomCode(6);
    if (!(await store.get(`code/${c}`))) code = c;
  }
  if (!code) fail(500, "Couldn't make a join code. Try again.");

  id = id || randomId(12);
  const school = {
    id, name, code, tz, created_at: new Date().toISOString(),
    theme: { color: HEX.test(color || "") ? color.toUpperCase() : DEFAULT_COLOR }, grades: grades ? [...grades] : [...DEFAULT_GRADES], enrollment: 0,
    ...(demo ? { demo } : {}),
  };
  await store.setJSON(`school/${id}`, school);
  await Promise.all([
    store.setJSON(`code/${code}`, { school: id }),
    store.set(`name/${slug(name) || "school"}/${id}`, "1"),
    email ? addMember(store, id, email, "owner", "setup") : null,
  ]);
  return school;
}

// ---------- demo schools ----------
// The master school, owned by the master email. An existing school with that name is claimed rather than
// copied; if it still has the old menu from before dishes had photos, those days are cleared so the
// photo menu fills in. Returns { school, created }.
async function masterSchool(store, email) {
  const name = masterSchoolName();
  const ids = (await listKeys(store, `name/${slug(name) || "school"}/`)).map(k => k.split("/")[2]);
  let school = (await getAll(store, ids.map(id => `school/${id}`))).sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
  let created = false;
  if (!school) {
    school = await createSchool(store, { name, tz: "America/Los_Angeles", email, color: DEFAULT_COLOR, id: demoId(name), demo: { offset: 0 } });
    created = true;
  } else if (!school.demo) {
    const days = await getAll(store, await listKeys(store, `day/${school.id}/`));
    await deleteAll(store, days.filter(photoless).map(d => `day/${school.id}/${d.date}`));
    school = { ...school, demo: { offset: 0 } };
    await store.setJSON(`school/${school.id}`, school);
  }
  if (!(await store.get(`staff/${school.id}/${emailHash(email)}`))) await addMember(store, school.id, email, "owner", "master code");
  return { school, created };
}

// Runs once per store. The marker is written first so a second request doesn't seed alongside; if seeding
// dies halfway, it runs again a minute later, and the fixed ids keep that from making copies.
async function ensureDemo(store) {
  if (!demoEnabled()) return;
  const mark = await store.get(SEED_KEY, { type: "json" });
  if (mark && (mark.done || Date.now() - mark.at < 60000)) return;
  await store.setJSON(SEED_KEY, { at: Date.now() });
  const email = masterEmail();
  await masterSchool(store, email);
  for (const [i, d] of DEMO_SCHOOLS.entries()) {
    const id = demoId(d.name);
    if (await store.get(`school/${id}`)) continue;
    await createSchool(store, { name: d.name, tz: "America/Los_Angeles", email, color: d.color, id, grades: d.grades, demo: { offset: (i + 1) % 5 } });
  }
  await store.setJSON(SEED_KEY, { at: Date.now(), done: true });
}

async function findSchools(store, q) {
  await ensureDemo(store);
  if (q.has("code")) {
    const code = normCode(q.get("code"));
    if (code.length !== 6) fail(400, "Join codes are 6 characters");
    const ref = await store.get(`code/${code}`, { type: "json" });
    if (!ref) fail(404, "No school uses that code. Check it with your cafeteria.");
    return { school: publicSchool(await loadSchool(store, ref.school)) };
  }
  const keys = await listKeys(store, "name/");
  if (q.get("all") === "1") { // every school, A to Z, for browsing before typing
    const all = keys.map(k => k.split("/")).sort(([, a], [, b]) => a.localeCompare(b)).slice(0, 60).map(([, , id]) => `school/${id}`);
    return { schools: (await getAll(store, all)).map(publicSchool) };
  }
  const term = slug(q.get("q"));
  if (term.length < 2) return { schools: [] };
  const ids = keys
    .map(k => k.split("/"))
    .filter(([, s]) => s.includes(term))
    .sort(([, a], [, b]) => (a.startsWith(term) ? 0 : 1) - (b.startsWith(term) ? 0 : 1) || a.localeCompare(b))
    .slice(0, 8)
    .map(([, , id]) => `school/${id}`);
  return { schools: (await getAll(store, ids)).map(publicSchool) };
}

async function updateSchool(store, req, id) {
  const { school, user } = await requireStaff(store, req, id, "admin");
  const b = await body(req);
  const next = { ...school };
  const notes = [];

  if (b.name !== undefined) {
    const name = str(b.name, 60);
    if (name.length < 2) fail(400, "School name must be at least 2 characters");
    if (name !== school.name) {
      await Promise.all([store.delete(`name/${slug(school.name) || "school"}/${id}`), store.set(`name/${slug(name) || "school"}/${id}`, "1")]);
      next.name = name; notes.push("renamed the school");
    }
  }
  if (b.theme !== undefined) {
    const color = b.theme && b.theme.color;
    if (typeof color !== "string" || !HEX.test(color)) fail(400, "Pick a color like #1F7A4D");
    next.theme = { color: color.toUpperCase() }; notes.push("changed the school color");
  }
  if (b.grades !== undefined) {
    const g = GRADE_LIST.filter(x => Array.isArray(b.grades) && b.grades.includes(x));
    if (!g.length) fail(400, "Choose at least one grade");
    next.grades = g; notes.push("changed the grades served");
  }
  if (b.enrollment !== undefined) {
    const n = Math.round(Number(b.enrollment));
    if (!Number.isFinite(n) || n < 0 || n > 20000) fail(400, "Enrollment must be between 0 and 20,000");
    next.enrollment = n; notes.push("set enrollment");
  }
  if (b.tz !== undefined) {
    if (typeof b.tz !== "string" || !validTz(b.tz)) fail(400, "Unknown time zone");
    next.tz = b.tz; notes.push("changed the time zone");
  }
  await store.setJSON(`school/${id}`, next);
  if (notes.length) await audit(store, id, user.email, notes.join(", "));
  return { school: staffSchool(next) };
}

async function retireKey(store, req, id) {
  const { school, user } = await requireStaff(store, req, id, "owner");
  if (user.via !== "email") fail(400, "Sign in with your email first, then retire the old key.");
  if (school.admin_hash) {
    await store.delete(`admin/${school.admin_hash}`);
    await store.setJSON(`school/${id}`, { ...school, admin_hash: null });
    await audit(store, id, user.email, "retired the old staff key");
  }
  return { retired: true };
}

async function deleteSchool(store, req, id) {
  const { school, user } = await requireStaff(store, req, id, "owner");
  const members = await listMembers(store, school.id);
  const prefixes = ["day", "vote", "votecache", "profile", "idea", "ideavote", "waste", "report", "audit", "photo", "staff"];
  const keys = (await Promise.all(prefixes.map(p => listKeys(store, `${p}/${school.id}/`)))).flat();
  keys.push(`code/${school.code}`, `name/${slug(school.name) || "school"}/${school.id}`, `school/${school.id}`);
  if (school.admin_hash) keys.push(`admin/${school.admin_hash}`);
  for (const mem of members) keys.push(`member/${mem.id}/${school.id}`);
  await deleteAll(store, keys);
  console.log(`school ${school.id} deleted by ${user.email || "staff key"}`);
  return { deleted: true };
}

// ---------- staff login ----------
// Local dev always links back to itself, even when .env carries the production SITE_URL:
// a dev sign-in token only exists in the local blob store.
const originOf = req => (!globalThis.__LL_DEV && process.env.SITE_URL) || new URL(req.url).origin;

// Signed in: starts a session that opens `schools` (null = every school of this email) and returns them.
async function signedIn(store, req, email, schools, created = null, sample = false) {
  const mine = await schoolsFor(store, email, schools);
  const session = await startSession(store, email, schools);
  return json({
    email,
    schools: mine.map(({ school, role }) => ({ school: staffSchool(school), role })),
    created: created ? staffSchool(created) : null,
    sample,
  }, 200, { "Set-Cookie": sessionCookie(session, req) });
}

function newPassword(v) {
  const p = typeof v === "string" ? v : "";
  if (p.length < PASSWORD_MIN) fail(400, `Use a password with at least ${PASSWORD_MIN} characters.`);
  if (p.length > 200) fail(400, "That password is too long (200 characters at most).");
  return p;
}

const setupLink = async (store, req, schoolId, email) =>
  `${originOf(req)}/?setup=${await createMagic(store, { email: normEmail(email), purpose: "setup", school: schoolId })}`;

// A new school with its owner's email and password. The password opens this school only.
async function authSignup(store, req) {
  const secret = await getSecret(store);
  const b = await body(req);
  const email = normEmail(b.email);
  if (!validEmail(email)) fail(400, "That doesn't look like an email address.");
  const password = newPassword(b.password);
  const name = str(b.name, 60);
  if (name.length < 2) fail(400, "School name must be at least 2 characters");
  await limit(store, `signup/${ipHash(secret, clientIp(req))}`, 10, 3600, "new schools from this network");
  const school = await createSchool(store, {
    name, email, color: HEX.test(b.color || "") ? b.color.toUpperCase() : DEFAULT_COLOR,
    tz: typeof b.tz === "string" && validTz(b.tz) ? b.tz : "America/Chicago",
  });
  await setMemberPassword(store, school.id, email, password);
  await audit(store, school.id, email, "created the school");
  return signedIn(store, req, email, [school.id], school, !!b.sample);
}

// Opens every school where this email's password matches. Wrong email and wrong password get the same answer.
async function authLogin(store, req) {
  const secret = await getSecret(store);
  const b = await body(req);
  const email = normEmail(b.email);
  const password = typeof b.password === "string" ? b.password.slice(0, 200) : "";
  await limit(store, `loginip/${ipHash(secret, clientIp(req))}`, 30, 3600, "sign-in attempts");
  await limit(store, `loginmail/${sha(email).slice(0, 16)}`, 10, 900, "sign-in attempts for that email");
  const rows = validEmail(email) && password ? (await membershipsFor(store, email)).filter(r => r.staff.pw) : [];
  const opens = [];
  for (const r of rows) if (await checkPassword(r.staff.pw, password)) opens.push(r.school.id);
  if (!rows.length) await checkPassword(null, password); // same work, so timing doesn't tell
  if (!opens.length) fail(401, "That email and password don't match. New to the team? Ask your school's admin for a setup link.");
  return signedIn(store, req, email, opens);
}

// Who a setup link is for, without using it up.
async function authSetupInfo(store, req) {
  const secret = await getSecret(store);
  await limit(store, `verify/${ipHash(secret, clientIp(req))}`, 60, 3600, "attempts");
  const b = await body(req);
  const row = await peekMagic(store, b.token);
  if (row.purpose !== "setup") fail(400, "That setup link isn't valid. Ask your admin for a new one.");
  const school = await store.get(`school/${row.school}`, { type: "json" });
  return { email: row.email, school: school?.name || "" };
}

// Sets (or resets) the password for the link's email at the link's school, and signs them in there.
async function authSetup(store, req) {
  const secret = await getSecret(store);
  await limit(store, `verify/${ipHash(secret, clientIp(req))}`, 60, 3600, "attempts");
  const b = await body(req);
  const password = newPassword(b.password); // checked first, so a typo doesn't use up the link
  const row = await consumeMagic(store, b.token);
  if (row.purpose !== "setup") fail(400, "That setup link isn't valid. Ask your admin for a new one.");
  if (!(await setMemberPassword(store, row.school, row.email, password))) fail(400, "You're not on that school's team anymore. Ask your admin to add you again.");
  await audit(store, row.school, row.email, "set a password");
  return signedIn(store, req, row.email, [row.school]);
}

// Master code: a shared secret from the MASTER_CODE environment variable that signs in as MASTER_EMAIL, the owner of
// MASTER_SCHOOL and the demo schools. It exists so a live demo never depends on anyone's password. It is off unless
// MASTER_CODE is set (8+ characters), it is compared in constant time, and wrong guesses are rate limited per network.
async function authMaster(store, req) {
  const want = process.env.MASTER_CODE || "";
  if (want.length < 8) fail(403, "Master code sign-in isn't turned on for this site.");
  const secret = await getSecret(store);
  await limit(store, `master/${ipHash(secret, clientIp(req))}`, 10, 3600, "master code attempts");
  const b = await body(req);
  const given = Buffer.from(sha(String(b.code || "").trim())), expected = Buffer.from(sha(want));
  if (!timingSafeEqual(given, expected)) fail(401, "That master code isn't right.");
  const email = masterEmail();
  let created = null;
  if (!(await schoolsFor(store, email)).length) {
    const m = await masterSchool(store, email);
    if (m.created) { created = m.school; await audit(store, created.id, email, "created the school (master code)"); }
  }
  await ensureDemo(store);
  return signedIn(store, req, email, null, created); // its menu fills itself, so no sample menu to load
}

async function authMe(store, req) {
  const who = await whoAmI(store, req);
  if (!who) fail(401, "Please sign in.");
  return { email: who.email, via: who.via, schools: who.schools.map(({ school, role }) => ({ school: staffSchool(school), role })) };
}

// ---------- staff management ----------
async function getStaff(store, req, q) {
  const { school, user } = await requireStaff(store, req, q.get("school"), "cook");
  const members = await listMembers(store, school.id);
  const me = user.email ? emailHash(user.email) : "";
  // `ready`: they've set a password for this school.
  return { members: members.map(m => ({ id: m.id, email: m.email, role: m.role, added_at: m.added_at, ready: !!m.pw, me: m.id === me })), legacy_key: !!school.admin_hash, me_role: user.role };
}

async function inviteStaff(store, req) {
  const b = await body(req);
  const { school, user } = await requireStaff(store, req, b.school, "admin");
  const email = normEmail(b.email);
  if (!validEmail(email)) fail(400, "That doesn't look like an email address.");
  const role = ROLES.includes(b.role) ? b.role : "cook";
  if (roleRank(role) > roleRank(user.role)) fail(403, "You can't give someone a higher role than your own.");
  const mem = await addMember(store, school.id, email, role, user.email);
  await audit(store, school.id, user.email, `added ${email} as ${role}`);
  // Nothing is emailed: the admin passes this link on, and it lets the new member pick a password.
  const link = mem.pw ? "" : await setupLink(store, req, school.id, email);
  return { member: { id: mem.id, email, role, ready: !!mem.pw }, link };
}

// A fresh setup link for a teammate who hasn't set a password yet, or who forgot it. It only ever
// touches their password for this school.
async function memberLink(store, req, eh, q) {
  const { school, user } = await requireStaff(store, req, q.get("school"), "admin");
  if (!/^[a-f0-9]{20}$/.test(eh)) fail(404, "That person isn't on your team.");
  const target = await store.get(`staff/${school.id}/${eh}`, { type: "json" });
  if (!target) fail(404, "That person isn't on your team.");
  if (roleRank(target.role) > roleRank(user.role)) fail(403, "You can't reset someone with a higher role.");
  const link = await setupLink(store, req, school.id, target.email);
  await audit(store, school.id, user.email, `made a setup link for ${target.email}`);
  return { email: target.email, link };
}

async function dropStaff(store, req, eh, q) {
  const { school, user } = await requireStaff(store, req, q.get("school"), "admin");
  const target = await store.get(`staff/${school.id}/${eh}`, { type: "json" });
  if (!target) fail(404, "That person isn't on your team.");
  if (roleRank(target.role) > roleRank(user.role)) fail(403, "You can't remove someone with a higher role.");
  if (target.role === "owner") {
    const owners = (await listMembers(store, school.id)).filter(m => m.role === "owner");
    if (owners.length <= 1) fail(400, "A school needs at least one owner.");
  }
  await removeMember(store, school.id, eh);
  await audit(store, school.id, user.email, `removed ${target.email}`);
  return { removed: true };
}

// ---------- student identity: proof of work, token, profile ----------
async function getPow(store, req, q) {
  const school = await loadSchool(store, q.get("school"));
  const secret = await getSecret(store);
  await limit(store, `powip/${ipHash(secret, clientIp(req))}`, 8000, 3600, "requests");
  return { challenge: makeChallenge(secret, school.id), bits: POW_BITS };
}

async function issueToken(store, req) {
  const b = await body(req);
  const school = await loadSchool(store, b.school);
  const secret = await getSecret(store);
  const voter = b.voter_id || "";
  if (!VOTER.test(voter)) fail(400, "Invalid device id");
  if (!checkChallenge(secret, b.challenge, school.id)) fail(400, "That check expired. Reload and try again.");
  if (!powSolved(b.challenge, b.nonce)) fail(400, "That check wasn't solved correctly.");
  const spent = `used/${sha(b.challenge).slice(0, 32)}`;
  if (await store.get(spent)) fail(400, "That check was already used. Reload and try again.");
  // A whole school (1,000+ students) can sit behind one IP at lunch, so the per-IP caps are very generous; the
  // per-school cap stops one script from flooding a school with fake devices.
  await limit(store, `tokip/${ipHash(secret, clientIp(req))}`, 5000, 3600, "new devices from this network");
  await limit(store, `toksch/${school.id}`, 8000, 3600, "new devices for this school");
  await store.set(spent, "1");
  return { token: makeVoterToken(secret, school.id, voter), voter_id: voter };
}

// Who is rating? The token says; the request body never does.
async function voterFrom(store, req, schoolId, { optional = false } = {}) {
  const secret = await getSecret(store);
  const v = readVoterToken(secret, req.headers.get("x-ll-token") || "", schoolId);
  if (!v && !optional) fail(401, "This device needs to be verified again.", { code: "token" });
  return v;
}

async function getProfile(store, req, q) {
  const school = await loadSchool(store, q.get("school"));
  const voter = await voterFrom(store, req, school.id);
  const p = await store.get(`profile/${school.id}/${voter}`, { type: "json" });
  return { grade: p?.grade || "" };
}

async function setProfile(store, req) {
  const b = await body(req);
  const school = await loadSchool(store, b.school);
  const voter = await voterFrom(store, req, school.id);
  await limit(store, `profile/${voter}`, 30, 3600, "profile changes");
  const grade = b.grade === "" || b.grade == null ? "" : String(b.grade);
  if (grade && grade !== "other" && !(school.grades || DEFAULT_GRADES).includes(grade)) fail(400, "That grade isn't offered at this school.");
  if (grade) await store.setJSON(`profile/${school.id}/${voter}`, { grade, updated_at: new Date().toISOString() });
  else await store.delete(`profile/${school.id}/${voter}`);
  // Ratings still open pick up the new grade, so it applies no matter when the student set it.
  const today = todayIn(school.tz);
  const dates = eachDate(addDays(today, -(RATE_DAYS - 1)), today);
  const keys = (await Promise.all(dates.map(d => listKeys(store, `vote/${school.id}/${d}/${voter}/`)))).flat();
  const rows = await getAll(store, keys);
  await Promise.all(rows.map(r => store.setJSON(`vote/${school.id}/${r.date}/${voter}/${r.item_id}`, { ...r, grade })));
  return { grade };
}

// ---------- menus ----------
// A nutrient amount: a number from 0 up to a sane maximum, or null when it's blank or nonsense.
const nutrient = (v, max) => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n * 10) / 10 : null;
};

function cleanItem(raw, schoolId) {
  if (!raw || typeof raw !== "object") fail(400, "Invalid dish");
  const id = ID.test(raw.id || "") ? raw.id : randomId(10);
  const name = str(raw.name, 80);
  if (!name) fail(400, "Every dish needs a name");
  const allergens = pick(raw.allergens, ALLERGENS);
  const cuisine = CUISINES.includes(raw.cuisine) ? raw.cuisine : "";
  const cal = Number(raw.calories);
  // An uploaded photo for this school, or one of the bundled sample photos.
  const photo = typeof raw.photo === "string" && (new RegExp(`^/api/photos/${schoolId}/[a-z0-9]{6,24}$`).test(raw.photo) || /^\/samples\/[a-z0-9-]{1,60}\.jpg$/.test(raw.photo)) ? raw.photo : "";
  return {
    id, name,
    desc: str(raw.desc, 200),
    ingredients: text(raw.ingredients, 800),
    allergens,
    allergens_other: str(raw.allergens_other, 100),
    may: pick(raw.may, ALLERGENS).filter(a => !allergens.includes(a)),
    may_other: str(raw.may_other, 100),
    diet: pick(raw.diet, DIETS),
    cuisine,
    cuisine_other: cuisine === "other" ? str(raw.cuisine_other, 40) : "",
    calories: Number.isFinite(cal) && cal > 0 && cal <= 5000 ? Math.round(cal) : null,
    protein: nutrient(raw.protein, 500), fat: nutrient(raw.fat, 500), sat_fat: nutrient(raw.sat_fat, 300),
    carbs: nutrient(raw.carbs, 1000), fiber: nutrient(raw.fiber, 200), sodium: nutrient(raw.sodium, 10000),
    photo,
    reply: cleanProfanity(str(raw.reply, REPLY_MAX)),
  };
}

function cleanDay(raw, schoolId) {
  if (!raw || !validDate(raw.date)) fail(400, "Each day needs a valid date");
  const day = { date: raw.date };
  const seen = new Set();
  for (const meal of MEALS) {
    const items = Array.isArray(raw[meal]) ? raw[meal] : [];
    if (items.length > 25) fail(400, "Up to 25 dishes per meal");
    day[meal] = items.map(i => cleanItem(i, schoolId)).map(i => {
      while (seen.has(i.id)) i.id = randomId(10);
      seen.add(i.id);
      return i;
    });
  }
  return day;
}

async function getMenu(store, q) {
  await ensureDemo(store); // a returning student may open a menu before anyone has searched
  const school = await loadSchool(store, q.get("school"));
  const { from, to } = range(q, 62);
  const dates = eachDate(from, to);
  const days = await Promise.all(dates.map(d => store.get(`day/${school.id}/${d}`, { type: "json" })));
  const today = todayIn(school.tz);
  if (school.demo) { // demo schools: a weekday nobody has saved yet gets the sample menu, stored so it can be rated
    const fills = [];
    dates.forEach((date, i) => {
      const sample = !days[i] && demoDay(date, today, school.demo.offset || 0);
      if (sample) { days[i] = cleanDay(sample, school.id); fills.push(store.setJSON(`day/${school.id}/${date}`, days[i])); }
    });
    await Promise.all(fills);
  }
  const out = {};
  days.forEach(d => { if (d) out[d.date] = normDay(d); });
  return { days: out, today };
}

async function putMenu(store, req) {
  const b = await body(req);
  const { school, user } = await requireStaff(store, req, b.school, "cook");
  if (!Array.isArray(b.days) || !b.days.length || b.days.length > 40) fail(400, "Send 1–40 days");
  const days = b.days.map(d => cleanDay(d, school.id));
  await Promise.all(days.map(d =>
    MEALS.some(m => d[m].length)
      ? store.setJSON(`day/${school.id}/${d.date}`, d)
      : store.delete(`day/${school.id}/${d.date}`)));
  const out = {};
  days.forEach(d => { out[d.date] = d; });
  if (days.length <= 5) await audit(store, school.id, user.email, `edited the menu for ${days.map(d => d.date).join(", ")}`);
  else await audit(store, school.id, user.email, `loaded ${days.length} days of menu`);
  return { days: out };
}

async function postReply(store, req) {
  const b = await body(req);
  const { school } = await requireStaff(store, req, b.school, "cook");
  if (!validDate(b.date) || !ID.test(b.item_id || "")) fail(400, "Invalid dish");
  const day = normDay(await store.get(`day/${school.id}/${b.date}`, { type: "json" }));
  const meal = day && MEALS.find(ml => day[ml].some(i => i.id === b.item_id));
  if (!meal) fail(404, "That dish isn't on the menu for that day.");
  const reply = cleanProfanity(str(b.text, REPLY_MAX));
  day[meal] = day[meal].map(i => (i.id === b.item_id ? { ...i, reply } : i));
  await store.setJSON(`day/${school.id}/${b.date}`, day);
  return { reply };
}

// ---------- votes ----------
async function getMyVotes(store, req, q) {
  const school = await loadSchool(store, q.get("school"));
  const voter = await voterFrom(store, req, school.id);
  const { from, to } = range(q, 14);
  const keys = (await Promise.all(eachDate(from, to).map(d => listKeys(store, `vote/${school.id}/${d}/${voter}/`)))).flat();
  return { votes: (await getAll(store, keys)).map(({ voter_id, hidden, ...row }) => row), today: todayIn(school.tz) };
}

async function castVote(store, req) {
  const b = await body(req);
  const school = await loadSchool(store, b.school);
  const voter = await voterFrom(store, req, school.id);
  const secret = await getSecret(store);
  if (!RATINGS.includes(b.vote)) fail(400, "Vote must be good, mid, or bad");
  if (!ID.test(b.item_id || "")) fail(400, "Invalid dish id");

  // A dish can be rated on the day it's served and for the 6 days after.
  const today = todayIn(school.tz);
  if (!validDate(b.date)) fail(400, "Invalid date");
  if (b.date > today) fail(403, "You can rate this after it's served.");
  if (b.date < addDays(today, -(RATE_DAYS - 1))) fail(403, `Rating closed. Dishes can be rated for ${RATE_DAYS} days after they're served.`);

  await limit(store, `vote/${voter}`, 150, 3600, "ratings from this phone");
  await limit(store, `voteip/${ipHash(secret, clientIp(req))}`, 40000, 3600, "ratings from this network");

  const day = normDay(await store.get(`day/${school.id}/${b.date}`, { type: "json" }));
  const meal = day && MEALS.find(ml => day[ml].some(i => i.id === b.item_id));
  if (!meal) fail(404, "That dish isn't on the menu for that day.");

  const [profile, prev] = await Promise.all([
    store.get(`profile/${school.id}/${voter}`, { type: "json" }),
    store.get(`vote/${school.id}/${b.date}/${voter}/${b.item_id}`, { type: "json" }),
  ]);
  const comment = cleanProfanity(text(b.comment, COMMENT_MAX));
  const row = {
    voter_id: voter, date: b.date, meal, item_id: b.item_id, vote: b.vote, comment,
    updated_at: new Date().toISOString(), grade: profile?.grade || "",
    // a comment staff hid stays hidden unless the student rewrites it
    hidden: !!prev && prev.comment === comment && !!prev.hidden,
  };
  await store.setJSON(`vote/${school.id}/${b.date}/${voter}/${b.item_id}`, row);
  const { voter_id, hidden, ...out } = row;
  return out;
}

async function hideComment(store, req) {
  const b = await body(req);
  const { school, user } = await requireStaff(store, req, b.school, "cook");
  if (!validDate(b.date) || !ID.test(b.item_id || "") || typeof b.cid !== "string") fail(400, "Invalid comment");
  const keys = (await listKeys(store, `vote/${school.id}/${b.date}/`)).filter(k => k.endsWith("/" + b.item_id));
  for (const row of await getAll(store, keys)) {
    if (sha(school.id + row.voter_id).slice(0, 12) !== b.cid) continue;
    await store.setJSON(`vote/${school.id}/${row.date}/${row.voter_id}/${row.item_id}`, { ...row, hidden: true });
    await store.delete(`votecache/${school.id}/${b.date}`);
    await audit(store, school.id, user.email, `hid a comment on ${b.date}`);
    return { hidden: true };
  }
  fail(404, "That comment is gone.");
}

// ---------- insights ----------
const compact = (school, v) => ({
  date: v.date, item_id: v.item_id, vote: v.vote, comment: v.comment || "", updated_at: v.updated_at,
  who: sha(school.id + v.voter_id).slice(0, 12), grade: v.grade || "", hidden: !!v.hidden,
});

async function ratingRows(store, school, date, closed) {
  const cacheKey = `votecache/${school.id}/${date}`;
  if (closed) {
    const cached = await store.get(cacheKey, { type: "json" });
    if (cached) return cached;
  }
  const rows = (await getAll(store, await listKeys(store, `vote/${school.id}/${date}/`))).map(v => compact(school, v));
  if (closed) await store.setJSON(cacheKey, rows); // nothing can change on a closed day, so keep a one-read copy
  return rows;
}

export async function loadStats(store, school, from, to) {
  const today = todayIn(school.tz);
  const inRange = k => { const d = k.split("/")[2]; return d >= from && d <= to; };
  const [dayKeys, wasteKeys] = await Promise.all([listKeys(store, `day/${school.id}/`), listKeys(store, `waste/${school.id}/`)]);
  const [dayList, waste] = await Promise.all([getAll(store, dayKeys.filter(inRange)), getAll(store, wasteKeys.filter(inRange))]);
  const days = {};
  dayList.forEach(d => { days[d.date] = normDay(d); });
  const closedBefore = addDays(today, -(RATE_DAYS - 1));
  const dates = Object.keys(days), votes = [];
  for (let i = 0; i < dates.length; i += BATCH) {
    const chunk = await Promise.all(dates.slice(i, i + BATCH).map(d => ratingRows(store, school, d, d < closedBefore)));
    chunk.forEach(rows => votes.push(...rows));
  }
  const stats = computeInsights({ days, votes, waste, enrollment: school.enrollment || 0, today });
  return { stats, waste };
}

async function getInsights(store, req, q) {
  const { school } = await requireStaff(store, req, q.get("school"), "cook");
  const { from, to } = range(q, 400);
  const { stats, waste } = await loadStats(store, school, from, to);
  const ideas = (await ideaList(store, school, null)).slice(0, 5);
  const wasteLog = waste.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14).map(({ date, pounds, note }) => ({ date, pounds, note: note || "" }));
  return { today: todayIn(school.tz), from, to, stats, ideas, waste_log: wasteLog, school: staffSchool(school) };
}

async function putWaste(store, req) {
  const b = await body(req);
  const { school, user } = await requireStaff(store, req, b.school, "cook");
  if (!validDate(b.date)) fail(400, "Invalid date");
  if (b.date > todayIn(school.tz)) fail(400, "You can log waste for today or earlier.");
  const pounds = Math.round(Number(b.pounds) * 10) / 10;
  if (!Number.isFinite(pounds) || pounds < 0 || pounds > 5000) fail(400, "Pounds must be between 0 and 5,000");
  const row = { date: b.date, pounds, note: str(b.note, 140), by: user.email, updated_at: new Date().toISOString() };
  await store.setJSON(`waste/${school.id}/${b.date}`, row);
  return { waste: { date: row.date, pounds: row.pounds, note: row.note } };
}

// ---------- suggestions ----------
const ideaSim = (q, idea) => Math.max(similarity(q, idea.text), ...(idea.aliases || []).map(a => similarity(q, a)));

async function ideaList(store, school, voter) {
  const [ideaKeys, voteKeys] = await Promise.all([listKeys(store, `idea/${school.id}/`), listKeys(store, `ideavote/${school.id}/`)]);
  const counts = {}, mine = new Set();
  for (const k of voteKeys) {
    const [, , ideaId, who] = k.split("/");
    counts[ideaId] = (counts[ideaId] || 0) + 1;
    if (voter && who === voter) mine.add(ideaId);
  }
  const me = voter ? sha(school.id + voter) : "";
  const ideas = (await getAll(store, ideaKeys)).map(i => ({
    id: i.id, text: i.text, created_at: i.created_at, aliases: i.aliases || [],
    status: i.status || "new", reply: i.reply || "", served_on: i.served_on || "",
    count: counts[i.id] || 0, voted: mine.has(i.id), own: !!me && i.by === me,
  }));
  ideas.sort((a, b) => b.count - a.count || b.created_at.localeCompare(a.created_at));
  return ideas;
}

// An idea marked "On the menu" for a date points at the dish that fulfils it.
async function attachDishes(store, school, ideas) {
  const dates = [...new Set(ideas.filter(i => i.status === "on_menu" && i.served_on).map(i => i.served_on))];
  if (!dates.length) return ideas;
  const days = Object.fromEntries((await Promise.all(dates.map(async d => [d, normDay(await store.get(`day/${school.id}/${d}`, { type: "json" }))]))));
  for (const i of ideas) {
    const day = days[i.served_on];
    if (i.status !== "on_menu" || !day) continue;
    const best = MEALS.flatMap(ml => day[ml]).map(it => ({ it, s: ideaSim(it.name, i) })).sort((a, b) => b.s - a.s)[0];
    if (best && best.s >= 0.6) i.dish = { date: day.date, item_id: best.it.id, name: best.it.name };
  }
  return ideas;
}

async function listIdeas(store, req, q) {
  const school = await loadSchool(store, q.get("school"));
  const voter = await voterFrom(store, req, school.id, { optional: true });
  const ideas = await attachDishes(store, school, await ideaList(store, school, voter));
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  return { ideas: ideas.map(i => ({ ...i, fresh: i.created_at >= weekAgo })) };
}

async function similarIdeas(store, q) {
  const school = await loadSchool(store, q.get("school"));
  const query = str(q.get("q"), IDEA_MAX);
  if (query.length < 3) return { matches: [] };
  const ideas = await ideaList(store, school, null);
  const matches = ideas
    .map(i => ({ idea: i, score: ideaSim(query, i) }))
    .filter(x => x.score >= 0.6)
    .sort((a, b) => b.score - a.score || b.idea.count - a.idea.count)
    .slice(0, 3)
    .map(({ idea, score }) => ({ id: idea.id, text: idea.text, count: idea.count, score, same: score >= SAME }));
  return { matches };
}

// Pairs of suggestions that look like the same thing, for staff to merge.
async function dupeIdeas(store, req, q) {
  const { school } = await requireStaff(store, req, q.get("school"), "cook");
  const ideas = (await ideaList(store, school, null)).slice(0, 150);
  const pairs = [];
  for (let i = 0; i < ideas.length; i++) {
    for (let j = i + 1; j < ideas.length; j++) {
      const score = Math.max(ideaSim(ideas[i].text, ideas[j]), ideaSim(ideas[j].text, ideas[i]));
      if (score >= 0.6) pairs.push({ a: ideas[i].id, b: ideas[j].id, score });
    }
  }
  pairs.sort((x, y) => y.score - x.score);
  return { pairs: pairs.slice(0, 20) };
}

async function addIdea(store, req) {
  const b = await body(req);
  const school = await loadSchool(store, b.school);
  const voter = await voterFrom(store, req, school.id);
  const secret = await getSecret(store);
  await limit(store, `idea/${voter}`, 6, 86400, "suggestions today");
  await limit(store, `ideaip/${ipHash(secret, clientIp(req))}`, 4000, 3600, "suggestions from this network");

  const raw = str(b.text, IDEA_MAX);
  if (raw.length < 2) fail(400, "Write a little more about your idea");
  const t = tidyText(cleanProfanity(raw));
  const existing = await ideaList(store, school, voter);
  const dup = existing.map(i => ({ i, s: ideaSim(t, i) })).filter(x => x.s >= 0.9).sort((a, b) => b.s - a.s)[0];
  if (dup) {
    // "NOOdLEs" when "Noodles" exists: count it as a vote instead of a copy.
    if (!dup.i.voted) await store.set(`ideavote/${school.id}/${dup.i.id}/${voter}`, "1");
    return { merged: true, idea: { ...dup.i, voted: true, count: dup.i.count + (dup.i.voted ? 0 : 1) } };
  }
  const idea = { id: randomId(10), text: t, created_at: new Date().toISOString(), by: sha(school.id + voter), status: "new" };
  await store.setJSON(`idea/${school.id}/${idea.id}`, idea);
  await store.set(`ideavote/${school.id}/${idea.id}/${voter}`, "1");
  return { merged: false, idea: { id: idea.id, text: idea.text, created_at: idea.created_at, status: "new", reply: "", served_on: "", count: 1, voted: true, own: true, fresh: true } };
}

async function voteIdea(store, req, ideaId) {
  const b = await body(req);
  const school = await loadSchool(store, b.school);
  const voter = await voterFrom(store, req, school.id);
  if (!ID.test(ideaId)) fail(400, "Invalid idea id");
  await limit(store, `ideavote/${voter}`, 120, 86400, "votes today");
  if (!(await store.get(`idea/${school.id}/${ideaId}`))) fail(404, "That idea was removed");
  const key = `ideavote/${school.id}/${ideaId}/${voter}`;
  if (b.on) await store.set(key, "1"); else await store.delete(key);
  const count = (await listKeys(store, `ideavote/${school.id}/${ideaId}/`)).length;
  return { id: ideaId, voted: !!b.on, count };
}

async function patchIdea(store, req, ideaId) {
  const b = await body(req);
  const { school, user } = await requireStaff(store, req, b.school, "cook");
  if (!ID.test(ideaId)) fail(400, "Invalid idea id");
  const idea = await store.get(`idea/${school.id}/${ideaId}`, { type: "json" });
  if (!idea) fail(404, "That idea was removed");
  if (b.status !== undefined) {
    if (!IDEA_STATUSES.includes(b.status)) fail(400, "Unknown status");
    idea.status = b.status;
  }
  if (b.reply !== undefined) idea.reply = cleanProfanity(str(b.reply, REPLY_MAX));
  if (b.served_on !== undefined) {
    if (b.served_on && !validDate(b.served_on)) fail(400, "Invalid date");
    idea.served_on = b.served_on || "";
  }
  if (idea.status !== "on_menu") idea.served_on = idea.served_on || "";
  await store.setJSON(`idea/${school.id}/${ideaId}`, idea);
  await audit(store, school.id, user.email, `marked a suggestion "${idea.text}" as ${idea.status}`);
  return { id: ideaId, status: idea.status, reply: idea.reply || "", served_on: idea.served_on || "" };
}

async function mergeIdea(store, req, fromId) {
  const b = await body(req);
  const { school, user } = await requireStaff(store, req, b.school, "cook");
  const intoId = b.into;
  if (!ID.test(fromId) || !ID.test(intoId || "") || fromId === intoId) fail(400, "Pick two different suggestions");
  const [from, into] = await Promise.all([store.get(`idea/${school.id}/${fromId}`, { type: "json" }), store.get(`idea/${school.id}/${intoId}`, { type: "json" })]);
  if (!from || !into) fail(404, "One of those suggestions was removed");
  const voteKeys = await listKeys(store, `ideavote/${school.id}/${fromId}/`);
  await Promise.all(voteKeys.map(k => store.set(`ideavote/${school.id}/${intoId}/${k.split("/")[3]}`, "1")));
  into.aliases = [...new Set([...(into.aliases || []), from.text, ...(from.aliases || [])])].slice(0, 20);
  await store.setJSON(`idea/${school.id}/${intoId}`, into);
  await deleteAll(store, [`idea/${school.id}/${fromId}`, ...voteKeys]);
  await audit(store, school.id, user.email, `merged "${from.text}" into "${into.text}"`);
  const count = (await listKeys(store, `ideavote/${school.id}/${intoId}/`)).length;
  return { merged: intoId, count };
}

async function deleteIdea(store, req, ideaId, q) {
  const { school, user } = await requireStaff(store, req, q.get("school"), "cook");
  if (!ID.test(ideaId)) fail(400, "Invalid idea id");
  const keys = [`idea/${school.id}/${ideaId}`, ...(await listKeys(store, `ideavote/${school.id}/${ideaId}/`))];
  await deleteAll(store, keys);
  await audit(store, school.id, user.email, "removed a suggestion");
  return { deleted: true };
}

// ---------- photos ----------
async function uploadPhoto(store, req, q) {
  const { school } = await requireStaff(store, req, q.get("school"), "cook");
  const type = (req.headers.get("content-type") || "").split(";")[0].trim();
  if (!PHOTO_TYPES.includes(type)) fail(415, "Photos must be JPEG, PNG, or WebP");
  const data = await req.arrayBuffer();
  if (!data.byteLength) fail(400, "Empty photo");
  if (data.byteLength > PHOTO_MAX) fail(413, "Photo is too large (max 3 MB)");
  const id = randomId(16);
  await store.set(`photo/${school.id}/${id}`, data, { metadata: { type } });
  return { url: `/api/photos/${school.id}/${id}` };
}

async function getPhoto(store, schoolId, photoId) {
  if (!ID.test(schoolId) || !ID.test(photoId)) fail(404, "Not found");
  const r = await store.getWithMetadata(`photo/${schoolId}/${photoId}`, { type: "arrayBuffer" });
  if (!r) fail(404, "Not found");
  return new Response(r.data, {
    headers: { "Content-Type": r.metadata?.type || "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}

// ---------- weekly reports ----------
// Builds this week's report, stores it, and (optionally) emails it.
export async function buildWeeklyReport(store, school) {
  const today = todayIn(school.tz);
  const w = weekWindow(today);
  const [{ stats }, { stats: prev }] = await Promise.all([loadStats(store, school, w.from, w.to), loadStats(store, school, w.prevFrom, w.prevTo)]);
  const ideas = await ideaList(store, school, null);
  const data = reportData(school, stats, prev, ideas.filter(i => i.status === "new" || i.status === "planned"));
  const { text: summary, ai } = await aiSummary(data);
  const report = { date: today, from: w.from, to: w.to, ...data, summary, ai, comments: undefined };
  await store.setJSON(`report/${school.id}/${today}`, report);
  return report;
}

async function getReports(store, req, q) {
  const { school } = await requireStaff(store, req, q.get("school"), "cook");
  const keys = (await listKeys(store, `report/${school.id}/`)).sort().reverse().slice(0, 8);
  return { reports: await getAll(store, keys) };
}

async function buildReportNow(store, req) {
  const b = await body(req);
  const { school } = await requireStaff(store, req, b.school, "cook");
  await limit(store, `reportnow/${school.id}`, 6, 3600, "reports");
  return { report: await buildWeeklyReport(store, school) };
}
