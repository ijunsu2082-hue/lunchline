// Fills Irvine High School with a month of simulated student activity, so the dashboard has something real-looking
// to show: ratings with comments, a few kitchen replies, ideas with votes, and a trash log. Everything it writes is
// marked simulated (rows carry `sim: true`, the school carries `sim_data`), and the dashboard says so.
//
//   node scripts/seed-irvine.mjs                      fills the local dev data (.netlify/dev-blobs, or LL_DATA)
//   NETLIFY_SITE_ID=... NETLIFY_AUTH_TOKEN=... node scripts/seed-irvine.mjs --production
//                                                     fills the live site's store instead
//
// It is deterministic, so running it twice rewrites the same records rather than doubling them.
try { process.loadEnvFile(new URL("../.env", import.meta.url)); } catch { /* no .env */ }
import { getStore } from "@netlify/blobs";
import { BlobsServer } from "@netlify/blobs/server";
import { addDays, sha, slug, listKeys, getAll, todayIn } from "../netlify/lib/util.mjs";
import { fillIrvineMenu } from "../netlify/lib/api.mjs";

const PRODUCTION = process.argv.includes("--production");
const DAYS_BACK = 30;
let server;
if (PRODUCTION) {
  if (!process.env.NETLIFY_SITE_ID || !process.env.NETLIFY_AUTH_TOKEN) throw new Error("Set NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN to seed the live site.");
} else {
  server = new BlobsServer({ directory: process.env.LL_DATA || ".netlify/dev-blobs", token: "dev" });
  const { port } = await server.start();
  const edge = `http://localhost:${port}`;
  globalThis.netlifyBlobsContext = Buffer.from(JSON.stringify({ edgeURL: edge, uncachedEdgeURL: edge, siteID: "dev-site", token: "dev" })).toString("base64");
}
const store = PRODUCTION
  ? getStore({ name: "lunchline", siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN, consistency: "strong" })
  : getStore({ name: "lunchline", consistency: "strong" });

// ---- a small seeded random generator, so every run produces the same month
let seed = 20261023;
const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pickOne = list => list[Math.floor(rnd() * list.length)];
const pool = async (tasks, size = 24) => { for (let i = 0; i < tasks.length; i += size) await Promise.all(tasks.slice(i, i + size).map(f => f())); };

const schools = await getAll(store, await listKeys(store, "school/"));
const school = schools.find(s => slug(s.name) === slug("Irvine High School"));
if (!school) throw new Error("There is no Irvine High School in this store. Create it first (sign in with its owner's email).");
const today = todayIn(school.tz);
console.log(`Seeding ${school.name} (${school.id}) through ${today}${PRODUCTION ? " on the LIVE site" : " locally"}`);

// ---- menus for the past month and the weeks ahead (days staff already saved are left alone)
await fillIrvineMenu(store, school, DAYS_BACK + 3, 56);

// ---- students: 380 devices, grades weighted a little toward the lower classes
const STUDENTS = Array.from({ length: 380 }, (_, i) => ({ id: "sim-" + sha("irvine-student-" + i).slice(0, 24), grade: rnd() < .29 ? "9" : rnd() < .36 ? "10" : rnd() < .5 ? "11" : "12" }));
await pool(STUDENTS.map(s => () => store.setJSON(`profile/${school.id}/${s.id}`, { grade: s.grade, updated_at: new Date().toISOString(), sim: true })));

// ---- how much people like each dish
const LIKED = /pizza|tender|burrito|taco|burger|fries|bagel|donut|pancake|mac|chicken|teriyaki|orange|bosco|muffin|cinni|waffle|nugget/i;
const MEH = /salad|tofu|vegetable|fruit|yogurt|cereal|oatmeal|soup|cracker/i;
const appeal = name => Math.min(.9, Math.max(.18, .42 + ((parseInt(sha(name).slice(0, 4), 16) % 40) / 100) * .8 + (LIKED.test(name) ? .12 : 0) - (MEH.test(name) ? .16 : 0)));
const GOOD = ["Honestly the best thing on the line today.", "{d} was actually good. More of this please.", "Hot and fresh, no complaints.", "{d} hit different today.", "Big portion and it tasted great.", "Would eat {d} every day."];
const MID = ["{d} was fine, nothing special.", "It was okay. Needed more seasoning.", "Decent but a little dry.", "{d} was alright, the line was too long though."];
const BAD = ["{d} was cold in the middle.", "Way too salty today.", "{d} was dry and kind of hard.", "Please fix the sauce on {d}.", "Soggy. Not great.", "Got to the front and they ran out of {d}, then gave me something else.", "{d} tasted burnt."];
const sample = (n, k) => { const a = [...Array(n).keys()]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, k); };

// local lunch time as a UTC timestamp (Los Angeles is 7 or 8 hours behind)
const stamp = (date, minutes, seconds) => {
  const offset = new Date(date + "T12:00:00Z").getUTCMonth() >= 2 && new Date(date + "T12:00:00Z").getUTCMonth() <= 9 ? 7 : 8;
  const t = Date.parse(date + "T00:00:00Z") + (minutes + offset * 60) * 60000 + seconds * 1000;
  return new Date(t).toISOString();
};

const weekdays = [];
for (let n = -DAYS_BACK; n <= 0; n++) { const d = addDays(today, n), dow = new Date(d + "T00:00:00Z").getUTCDay(); if (dow !== 0 && dow !== 6) weekdays.push(d); }

const votes = [], wasteRows = [], commentRefs = []; // commentRefs: negative comments we may reply to
let weekIdx = 0;
for (const date of weekdays) {
  weekIdx = Math.floor((weekdays.indexOf(date)) / 5);
  const day = await store.get(`day/${school.id}/${date}`, { type: "json" });
  if (!day) continue;
  const active = STUDENTS.filter(() => rnd() < .30 + (weekIdx * .015));
  let good = 0, total = 0;
  for (const s of active) {
    let clock = 11 * 60 + 35 + Math.floor(rnd() * 100), sec = Math.floor(rnd() * 50);
    for (const [meal, chance, max] of [["lunch", 1, 4], ["breakfast", .22, 2], ["snack", .12, 1]]) {
      if (rnd() > chance || !(day[meal] || []).length) continue;
      const items = day[meal], howMany = Math.min(items.length, 1 + Math.floor(rnd() * max));
      for (const k of sample(items.length, howMany)) {
        const it = items[k];
        let p = appeal(it.name) + weekIdx * .015 + (s.grade === "12" ? -.05 : s.grade === "9" ? .04 : 0) + (rnd() - .5) * .12;
        const r = rnd(), vote = r < p * .9 ? "good" : r < p * .9 + (1 - p) * .42 ? "mid" : "bad";
        let comment = "";
        if (rnd() < .075) comment = pickOne(vote === "good" ? GOOD : vote === "mid" ? MID : BAD).replace("{d}", it.name);
        sec += 25 + Math.floor(rnd() * 70); clock += Math.floor(sec / 60); sec %= 60;
        const row = { voter_id: s.id, date, meal, item_id: it.id, vote, comment, updated_at: stamp(date, clock, sec), grade: s.grade, hidden: false, sim: true };
        votes.push(row); total++; if (vote === "good") good++;
        if (comment && vote === "bad") commentRefs.push(row);
      }
    }
  }
  const rate = total ? good / total : .5;
  wasteRows.push({ date, pounds: Math.round((55 - rate * 22 - weekIdx * 1.6 + (rnd() - .5) * 9) * 10) / 10, note: "", by: "kitchen", updated_at: stamp(date, 14 * 60, 5), sim: true });
}

// ---- a few kitchen replies: some private, some posted on the dish
const REPLIES = ["Thanks for telling us. The oven ran cold that day and it's fixed.", "We're changing the sauce next week. Let us know if it's better.", "Good catch. We moved to a smaller batch so it stays hot.", "Heard you. We're ordering more so we don't run out."];
commentRefs.sort(() => rnd() - .5);
const dayEdits = new Map();
commentRefs.slice(0, 7).forEach((row, i) => {
  const text = REPLIES[i % REPLIES.length], pub = i % 2 === 0;
  row.kitchen_reply = { text, at: stamp(addDays(row.date, 1), 9 * 60, 12), public: pub };
  if (pub) dayEdits.set(`${row.date}|${row.item_id}`, { text, to: row.comment });
});
commentRefs.slice(7, 9).forEach(row => { row.hidden = true; }); // two comments the kitchen hid, so "Unhide" has something to show

console.log(`Writing ${votes.length} ratings, ${wasteRows.length} trash logs...`);
await pool(votes.map(v => () => store.setJSON(`vote/${school.id}/${v.date}/${v.voter_id}/${v.item_id}`, v)), 30);
await pool(wasteRows.map(w => () => store.setJSON(`waste/${school.id}/${w.date}`, w)));
for (const [key, { text, to }] of dayEdits) {
  const [date, id] = key.split("|");
  const day = await store.get(`day/${school.id}/${date}`, { type: "json" });
  for (const m of ["breakfast", "snack", "lunch"]) day[m] = (day[m] || []).map(it => (it.id === id ? { ...it, reply: text, reply_to: to } : it));
  await store.setJSON(`day/${school.id}/${date}`, day);
}
// closed days are cached once computed; clear them so the new ratings show
await Promise.all((await listKeys(store, `votecache/${school.id}/`)).map(k => store.delete(k)));

// ---- ideas: what students asked for, how many agreed, and what the kitchen said
const IDEAS = [
  ["Orange chicken with fried rice", 142, "planned", "Testing a recipe now. Look for it in November."],
  ["Birria tacos", 118, "new", ""],
  ["More vegetarian bowls", 97, "on_menu", "The Masala Aloo Matar Bowl is on Thursdays now."],
  ["Chicken caesar wrap", 64, "new", ""],
  ["Hot breakfast sandwiches every day", 41, "new", ""],
  ["Sushi", 33, "not_now", "We can't keep raw fish safe on the line. Sorry."],
  ["Chicken tenders on Fridays", 29, "new", ""],
  ["Fresh fruit at every lunch", 22, "new", ""],
];
for (const [i, [text, count, status, reply]] of IDEAS.entries()) {
  const id = sha("irvine-idea-" + text).slice(0, 10);
  await store.setJSON(`idea/${school.id}/${id}`, { id, text, created_at: stamp(addDays(today, -26 + i * 3), 12 * 60, 3), by: sha(school.id + STUDENTS[i].id), status, ...(reply ? { reply } : {}), sim: true });
  const voters = sample(STUDENTS.length, Math.min(count, STUDENTS.length));
  await pool(voters.map(v => () => store.set(`ideavote/${school.id}/${id}/${STUDENTS[v].id}`, "1")));
}

await store.setJSON(`school/${school.id}`, { ...school, enrollment: school.enrollment || 1850, sim_data: true });
console.log("Done. The dashboard will say it includes simulated ratings.");
if (server) await server.stop();
process.exit(0);
