// Fills a LOCAL dev server with a clearly simulated demo school: three weeks of
// the sample menu, a week of made-up ratings with grade levels, suggestions
// (typos included, to show grouping), and a waste log. Everything here is fake.
// Never run it against production, and don't present its numbers as real.
//
//   node scripts/dev.mjs              (in one terminal)
//   node scripts/seed-demo.mjs        (in another)
//
// It uses the same paths a real school does: password sign-up, proof-of-work
// device tokens, and the normal API.
import { createHash, randomBytes } from "node:crypto";
import { SAMPLE_PLAN } from "../public/sample.js";

const BASE = process.env.LL_BASE || "http://localhost:8888";
const EMAIL = process.env.LL_EMAIL || "demo.staff@example.com";
const PASSWORD = process.env.LL_PASSWORD || randomBytes(9).toString("base64url");
let cookie = "";

async function call(method, path, body, { token } = {}) {
  const res = await fetch(BASE + "/api/" + path, {
    method,
    headers: { "Content-Type": "application/json", "x-ll": "1", ...(cookie ? { cookie } : {}), ...(token ? { "x-ll-token": token } : {}) },
    body: body && JSON.stringify(body),
  });
  const set = res.headers.getSetCookie?.()[0];
  if (set) cookie = set.split(";")[0];
  const out = await res.json();
  if (!res.ok) throw new Error(`${method} ${path}: ${out.error}`);
  return out;
}

function solve(challenge, bits) {
  for (let n = 0; ; n++) {
    const h = createHash("sha256").update(`${challenge}:${n}`).digest();
    let z = 0;
    for (const b of h) { if (b === 0) { z += 8; continue; } z += Math.clz32(b) - 24; break; }
    if (z >= bits) return String(n);
  }
}
async function deviceToken(school, voter) {
  const { challenge, bits } = await call("GET", `pow?school=${school.id}`);
  return (await call("POST", "token", { school: school.id, voter_id: voter, challenge, nonce: solve(challenge, bits) })).token;
}

const WEEK = SAMPLE_PLAN;
const add = (d, n) => { const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const monday = d => { const w = new Date(d + "T00:00:00Z").getUTCDay(); return add(d, w === 0 ? -6 : 1 - w); };

// ----- staff sign-up through the real path -----
const signedUp = await call("POST", "auth/signup", { email: EMAIL, password: PASSWORD, name: process.env.LL_NAME || "Demo High School (simulated data)", tz: "America/Los_Angeles" });
const school = signedUp.created;
await call("PATCH", `schools/${school.id}`, { theme: { color: "#1F7A4D" }, enrollment: 400, grades: ["9", "10", "11", "12"] });

const { today } = await call("GET", `menu?school=${school.id}&from=2026-01-01&to=2026-01-01`);
const start = add(monday(today), -7);
const days = [];
for (let w = 0; w < 3; w++) WEEK.forEach((d, i) => days.push({ date: add(start, w * 7 + i), breakfast: d.breakfast, snack: d.snack || [], lunch: d.lunch }));
const saved = (await call("PUT", "menu", { school: school.id, days })).days;

const LIKE = {
  "Chicken Tenders & Fries": 0.82, "Beef Street Tacos": 0.78, "Orange Chicken & Fried Rice": 0.8, "Cheeseburger & Fries": 0.7,
  "Pepperoni Pizza": 0.74, "Cheese Pizza": 0.6, "Teriyaki Chicken Bowl": 0.66, "Mac & Cheese": 0.5, "Spaghetti & Meatballs": 0.46,
  "Cheese Quesadilla": 0.55, "Chicken Caesar Wrap": 0.4, "Caesar Salad": 0.3, "Chef Salad": 0.22,
  "Pancakes": 0.62, "French Toast": 0.58, "Breakfast Burrito": 0.52, "Yogurt Parfait": 0.44, "Blueberry Muffin": 0.5,
  "Fresh Fruit Cup": 0.35, "Banana Bread": 0.4, "Powdered Mini Donuts": 0.72, "Oatmeal Chocolate Chip Bar": 0.48, "Cheesy Pull-Aparts": 0.6,
};
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const GRADES = ["9", "9", "9", "10", "10", "11", "11", "12", "12", "12"];
const voters = [];
for (let i = 0; i < 46; i++) {
  const voter = `demo-student-${String(i).padStart(3, "0")}`;
  const token = await deviceToken(school, voter);
  const grade = GRADES[i % GRADES.length];
  await call("POST", "profile", { school: school.id, grade }, { token });
  voters.push({ voter, token, grade });
}

let votes = 0;
for (let i = 0; i < 7; i++) {
  const date = add(today, -i), day = saved[date];
  if (!day) continue;
  for (const meal of ["breakfast", "snack", "lunch"]) {
    for (const item of day[meal] || []) {
      const like = LIKE[item.name] ?? 0.5;
      for (const v of voters) {
        if (rand() > (meal === "lunch" ? 0.42 : 0.2)) continue;
        // 12th graders are harder on the salad bar, as a deliberate pattern to chart
        const tilt = v.grade === "12" && /salad|wrap/i.test(item.name) ? -0.12 : 0;
        const r = rand(), l = Math.max(0.05, like + tilt);
        const vote = r < l ? "good" : r < l + (1 - l) * 0.45 ? "mid" : "bad";
        await call("POST", "votes", { school: school.id, date, item_id: item.id, vote, comment: "" }, { token: v.token });
        votes++;
        await new Promise(r => setTimeout(r, 60)); // paced like people, or the bot check would (rightly) set them aside
      }
    }
  }
}

for (const [i, text] of ["Korean fried chicken", "Pho on rainy days", "Bigger salad bar", "Chicken teriyaki every Friday", "Spicy chicken sandwich", "korean fried chiken", "Pho"].entries()) {
  const v = voters[i];
  const r = await call("POST", "ideas", { school: school.id, text }, { token: v.token });
  if (r.merged) continue;
  for (const o of voters.slice(10, 10 + Math.floor(rand() * 18) + (5 - Math.min(i, 5)) * 3)) await call("POST", `ideas/${r.idea.id}/vote`, { school: school.id, on: true }, { token: o.token });
}
for (let i = 0; i < 5; i++) await call("PUT", "waste", { school: school.id, date: add(today, -i), pounds: Math.round((18 + rand() * 14) * 10) / 10, note: "" });

console.log(`${school.name}: ${votes} simulated ratings from ${voters.length} simulated students`);
console.log(`Student join code: ${school.code}`);
console.log(`Staff sign-in:     ${EMAIL} / ${PASSWORD}`);
