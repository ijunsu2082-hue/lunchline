// LunchLine API: one function, routed by path. Everything is stored in a
// single Netlify Blobs store, one key per record, so writes never need a
// read-modify-write on shared data.
//
//   school/{id}                      school record
//   code/{CODE}                      join code -> school id
//   name/{slug}/{id}                 search index (key only)
//   admin/{sha256(key)}              admin key -> school id
//   day/{id}/{YYYY-MM-DD}            that day's breakfast + lunch
//   vote/{id}/{date}/{voter}/{item}  one rating per device per dish (open 7 days)
//   idea/{id}/{ideaId}               dream-menu idea
//   ideavote/{id}/{ideaId}/{voter}   one +1 per device per idea
//   photo/{id}/{photoId}             dish photo (binary)

import { createHash, randomBytes } from "node:crypto";

const ALLERGENS = ["peanuts", "tree_nuts", "dairy", "eggs", "gluten", "soy", "fish", "shellfish", "sesame"];
const CUISINES = ["american", "italian", "mexican", "korean", "chinese", "japanese", "indian", "mediterranean", "healthy", "other"];
const DIETS = ["vegetarian", "vegan", "halal", "spicy"];
const MEALS = ["breakfast", "lunch"];
const RATINGS = ["good", "mid", "bad"];

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const ID = /^[a-z0-9]{6,24}$/;
const VOTER = /^[A-Za-z0-9_-]{8,64}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const COMMENT_MAX = 280;
const IDEA_MAX = 120;
const PHOTO_MAX = 3 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BATCH = 50;
const RATE_DAYS = 7; // rating stays open this many days, counting the serving day

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new HttpError(status, message); };

const json = (data, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function handle(req, store) {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
    const [resource, id, action] = parts;
    const m = req.method;
    const q = url.searchParams;

    if (resource === "schools") {
      if (m === "POST" && !id) return json(await createSchool(store, await body(req)), 201);
      if (m === "GET" && !id) return json(await findSchools(store, q));
      if (m === "GET" && id && !action) return json({ school: publicSchool(await loadSchool(store, id)) });
      if (m === "DELETE" && id && !action) return json(await deleteSchool(store, await requireAdmin(store, req, id)));
    }
    if (resource === "session" && m === "POST" && !id) return json(await signIn(store, req));
    if (resource === "menu" && !id) {
      if (m === "GET") return json(await getMenu(store, q));
      if (m === "PUT") return json(await putMenu(store, req));
    }
    if (resource === "votes" && !id) {
      if (m === "GET") return json(await getMyVotes(store, q));
      if (m === "POST") return json(await castVote(store, await body(req)));
    }
    if (resource === "insights" && !id && m === "GET") return json(await getInsights(store, req, q));
    if (resource === "ideas") {
      if (m === "GET" && !id) return json(await listIdeas(store, q));
      if (m === "POST" && !id) return json(await addIdea(store, await body(req)), 201);
      if (m === "POST" && id && action === "vote") return json(await voteIdea(store, id, await body(req)));
      if (m === "DELETE" && id && !action) return json(await deleteIdea(store, req, id, q));
    }
    if (resource === "photos") {
      if (m === "POST" && !id) return json(await uploadPhoto(store, req, q), 201);
      if (m === "GET" && id && action) return await getPhoto(store, id, action);
    }
    return json({ error: "Not found" }, 404);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "Something went wrong on our side. Try again." }, 500);
  }
}

// ---------- helpers ----------

async function body(req) {
  try { return await req.json(); } catch { fail(400, "Request body must be JSON"); }
}

const str = (v, max) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");
const text = (v, max) => (typeof v === "string" ? v.trim().replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").slice(0, max) : "");
const pick = (arr, allowed) => (Array.isArray(arr) ? [...new Set(arr.filter(x => allowed.includes(x)))] : []);
const sha = s => createHash("sha256").update(s).digest("hex");
const randomId = (n = 12) => randomBytes(n).toString("hex").slice(0, n);
const randomCode = n => Array.from(randomBytes(n), b => CODE_CHARS[b % CODE_CHARS.length]).join("");
const normCode = s => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const slug = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

function validTz(tz) {
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; }
}

// Today's date (YYYY-MM-DD) in the school's own time zone.
export function todayIn(tz) {
  if (globalThis.__LL_TODAY) return globalThis.__LL_TODAY; // set only by scripts/dev.mjs
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = t => parts.find(p => p.type === t).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function validDate(d) {
  if (typeof d !== "string" || !DATE.test(d)) return false;
  const t = new Date(d + "T00:00:00Z");
  return !isNaN(t) && t.toISOString().slice(0, 10) === d;
}
const addDays = (d, n) => { const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 864e5);

function range(q, maxDays) {
  const from = q.get("from"), to = q.get("to");
  if (!validDate(from) || !validDate(to)) fail(400, "from and to must be dates (YYYY-MM-DD)");
  const span = daysBetween(from, to);
  if (span < 0 || span > maxDays) fail(400, `Date range must be 0–${maxDays} days`);
  return { from, to };
}

async function getAll(store, keys) {
  const out = [];
  for (let i = 0; i < keys.length; i += BATCH) {
    const chunk = await Promise.all(keys.slice(i, i + BATCH).map(k => store.get(k, { type: "json" })));
    out.push(...chunk);
  }
  return out.filter(Boolean);
}
const listKeys = async (store, prefix) => (await store.list({ prefix })).blobs.map(b => b.key);

// ---------- schools ----------

function publicSchool(s) {
  return { id: s.id, name: s.name, code: s.code, tz: s.tz, created_at: s.created_at };
}

async function loadSchool(store, id) {
  if (!ID.test(id || "")) fail(400, "Invalid school id");
  const s = await store.get(`school/${id}`, { type: "json" });
  if (!s) fail(404, "School not found");
  return s;
}

async function adminSchool(store, req) {
  const key = normCode(req.headers.get("x-admin-key"));
  if (key.length < 12) fail(401, "Admin key required");
  const ref = await store.get(`admin/${sha(key)}`, { type: "json" });
  if (!ref) fail(401, "That admin key isn't valid");
  return loadSchool(store, ref.school);
}

async function requireAdmin(store, req, schoolId) {
  const s = await adminSchool(store, req);
  if (s.id !== schoolId) fail(403, "This admin key belongs to a different school");
  return s;
}

async function createSchool(store, b) {
  const name = str(b.name, 60);
  if (name.length < 2) fail(400, "School name must be at least 2 characters");
  const tz = typeof b.tz === "string" && validTz(b.tz) ? b.tz : "America/Chicago";

  let code;
  for (let i = 0; i < 8 && !code; i++) {
    const c = randomCode(6);
    if (!(await store.get(`code/${c}`))) code = c;
  }
  if (!code) fail(500, "Couldn't make a join code. Try again.");

  const id = randomId(12);
  const adminKey = randomCode(12);
  const school = { id, name, code, tz, created_at: new Date().toISOString(), admin_hash: sha(adminKey) };

  await store.setJSON(`school/${id}`, school);
  await Promise.all([
    store.setJSON(`code/${code}`, { school: id }),
    store.setJSON(`admin/${school.admin_hash}`, { school: id }),
    store.set(`name/${slug(name) || "school"}/${id}`, "1"),
  ]);
  return { school: publicSchool(school), adminKey };
}

async function findSchools(store, q) {
  if (q.has("code")) {
    const code = normCode(q.get("code"));
    if (code.length !== 6) fail(400, "Join codes are 6 characters");
    const ref = await store.get(`code/${code}`, { type: "json" });
    if (!ref) fail(404, "No school uses that code. Check it with your cafeteria.");
    return { school: publicSchool(await loadSchool(store, ref.school)) };
  }
  const term = slug(q.get("q"));
  if (term.length < 2) return { schools: [] };
  const keys = await listKeys(store, "name/");
  const ids = keys
    .map(k => k.split("/"))
    .filter(([, s]) => s.includes(term))
    .sort(([, a], [, b]) => (a.startsWith(term) ? 0 : 1) - (b.startsWith(term) ? 0 : 1) || a.localeCompare(b))
    .slice(0, 8)
    .map(([, , id]) => `school/${id}`);
  return { schools: (await getAll(store, ids)).map(publicSchool) };
}

async function signIn(store, req) {
  return { school: publicSchool(await adminSchool(store, req)) };
}

async function deleteSchool(store, school) {
  const id = school.id;
  const keys = (await Promise.all(["day", "vote", "idea", "ideavote", "photo"].map(p => listKeys(store, `${p}/${id}/`)))).flat();
  keys.push(`code/${school.code}`, `admin/${school.admin_hash}`, `name/${slug(school.name) || "school"}/${id}`, `school/${id}`);
  for (let i = 0; i < keys.length; i += BATCH) await Promise.all(keys.slice(i, i + BATCH).map(k => store.delete(k)));
  return { deleted: true };
}

// ---------- menus ----------

function cleanItem(raw, schoolId) {
  if (!raw || typeof raw !== "object") fail(400, "Invalid dish");
  const id = ID.test(raw.id || "") ? raw.id : randomId(10);
  const name = str(raw.name, 80);
  if (!name) fail(400, "Every dish needs a name");
  const allergens = pick(raw.allergens, ALLERGENS);
  const cuisine = CUISINES.includes(raw.cuisine) ? raw.cuisine : "";
  const cal = Number(raw.calories);
  const photo = typeof raw.photo === "string" && new RegExp(`^/api/photos/${schoolId}/[a-z0-9]{6,24}$`).test(raw.photo) ? raw.photo : "";
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
    photo,
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
  const school = await loadSchool(store, q.get("school"));
  const { from, to } = range(q, 62);
  const dates = Array.from({ length: daysBetween(from, to) + 1 }, (_, i) => addDays(from, i));
  const days = await Promise.all(dates.map(d => store.get(`day/${school.id}/${d}`, { type: "json" })));
  const out = {};
  days.forEach(d => { if (d) out[d.date] = d; });
  return { days: out, today: todayIn(school.tz) };
}

async function putMenu(store, req) {
  const b = await body(req);
  const school = await requireAdmin(store, req, b.school);
  if (!Array.isArray(b.days) || !b.days.length || b.days.length > 40) fail(400, "Send 1–40 days");
  const days = b.days.map(d => cleanDay(d, school.id));
  await Promise.all(days.map(d =>
    d.breakfast.length || d.lunch.length
      ? store.setJSON(`day/${school.id}/${d.date}`, d)
      : store.delete(`day/${school.id}/${d.date}`)));
  const out = {};
  days.forEach(d => { out[d.date] = d; });
  return { days: out };
}

// ---------- votes ----------

async function getMyVotes(store, q) {
  const school = await loadSchool(store, q.get("school"));
  const voter = q.get("voter") || "";
  if (!VOTER.test(voter)) fail(400, "Invalid device id");
  const { from, to } = range(q, 14);
  const dates = Array.from({ length: daysBetween(from, to) + 1 }, (_, i) => addDays(from, i));
  const keys = (await Promise.all(dates.map(d => listKeys(store, `vote/${school.id}/${d}/${voter}/`)))).flat();
  return { votes: (await getAll(store, keys)).map(({ voter_id, ...row }) => row), today: todayIn(school.tz) };
}

async function castVote(store, b) {
  const school = await loadSchool(store, b.school);
  const voter = b.voter_id || "";
  if (!VOTER.test(voter)) fail(400, "Invalid device id");
  if (!RATINGS.includes(b.vote)) fail(400, "Vote must be good, mid, or bad");
  if (!ID.test(b.item_id || "")) fail(400, "Invalid dish id");

  // A dish can be rated on the day it's served and for the 6 days after.
  const today = todayIn(school.tz);
  if (!validDate(b.date)) fail(400, "Invalid date");
  if (b.date > today) fail(403, "You can rate this after it's served.");
  if (b.date < addDays(today, -(RATE_DAYS - 1))) fail(403, `Rating closed. Dishes can be rated for ${RATE_DAYS} days after they're served.`);

  const day = await store.get(`day/${school.id}/${b.date}`, { type: "json" });
  const meal = day && MEALS.find(ml => day[ml].some(i => i.id === b.item_id));
  if (!meal) fail(404, "That dish isn't on the menu for that day.");

  const row = {
    voter_id: voter, date: b.date, meal, item_id: b.item_id, vote: b.vote,
    comment: text(b.comment, COMMENT_MAX), updated_at: new Date().toISOString(),
  };
  await store.setJSON(`vote/${school.id}/${b.date}/${voter}/${b.item_id}`, row);
  const { voter_id, ...out } = row;
  return out;
}

async function getInsights(store, req, q) {
  const school = await requireAdmin(store, req, q.get("school"));
  const { from, to } = range(q, 400);
  const inRange = k => { const d = k.split("/")[2]; return d >= from && d <= to; };
  const [dayKeys, voteKeys] = await Promise.all([listKeys(store, `day/${school.id}/`), listKeys(store, `vote/${school.id}/`)]);
  const [days, votes] = await Promise.all([getAll(store, dayKeys.filter(inRange)), getAll(store, voteKeys.filter(inRange))]);
  const menu = {};
  days.forEach(d => { menu[d.date] = d; });
  return {
    today: todayIn(school.tz),
    days: menu,
    // Device ids are hashed so the dashboard can count students without seeing ids.
    votes: votes.map(({ voter_id, ...r }) => ({ ...r, who: sha(school.id + voter_id).slice(0, 12) })),
  };
}

// ---------- dream menu ideas ----------

async function listIdeas(store, q) {
  const school = await loadSchool(store, q.get("school"));
  const voter = q.get("voter") || "";
  const [ideaKeys, voteKeys] = await Promise.all([listKeys(store, `idea/${school.id}/`), listKeys(store, `ideavote/${school.id}/`)]);
  const counts = {}, mine = new Set();
  for (const k of voteKeys) {
    const [, , ideaId, who] = k.split("/");
    counts[ideaId] = (counts[ideaId] || 0) + 1;
    if (voter && who === voter) mine.add(ideaId);
  }
  const me = voter ? sha(school.id + voter) : "";
  const ideas = (await getAll(store, ideaKeys)).map(i => ({
    id: i.id, text: i.text, created_at: i.created_at,
    count: counts[i.id] || 0, voted: mine.has(i.id), own: !!me && i.by === me,
  }));
  ideas.sort((a, b) => b.count - a.count || b.created_at.localeCompare(a.created_at));
  return { ideas };
}

async function addIdea(store, b) {
  const school = await loadSchool(store, b.school);
  const voter = b.voter_id || "";
  if (!VOTER.test(voter)) fail(400, "Invalid device id");
  const t = str(b.text, IDEA_MAX);
  if (t.length < 2) fail(400, "Write a little more about your idea");
  const idea = { id: randomId(10), text: t, created_at: new Date().toISOString(), by: sha(school.id + voter) };
  await store.setJSON(`idea/${school.id}/${idea.id}`, idea);
  await store.set(`ideavote/${school.id}/${idea.id}/${voter}`, "1");
  return { id: idea.id, text: idea.text, created_at: idea.created_at, count: 1, voted: true, own: true };
}

async function voteIdea(store, ideaId, b) {
  const school = await loadSchool(store, b.school);
  const voter = b.voter_id || "";
  if (!VOTER.test(voter)) fail(400, "Invalid device id");
  if (!ID.test(ideaId)) fail(400, "Invalid idea id");
  if (!(await store.get(`idea/${school.id}/${ideaId}`))) fail(404, "That idea was removed");
  const key = `ideavote/${school.id}/${ideaId}/${voter}`;
  if (b.on) await store.set(key, "1"); else await store.delete(key);
  const count = (await listKeys(store, `ideavote/${school.id}/${ideaId}/`)).length;
  return { id: ideaId, voted: !!b.on, count };
}

async function deleteIdea(store, req, ideaId, q) {
  const school = await requireAdmin(store, req, q.get("school"));
  if (!ID.test(ideaId)) fail(400, "Invalid idea id");
  const keys = [`idea/${school.id}/${ideaId}`, ...(await listKeys(store, `ideavote/${school.id}/${ideaId}/`))];
  await Promise.all(keys.map(k => store.delete(k)));
  return { deleted: true };
}

// ---------- photos ----------

async function uploadPhoto(store, req, q) {
  const school = await requireAdmin(store, req, q.get("school"));
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
