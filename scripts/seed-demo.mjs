// Fills a local dev server with a demo school: three weeks of the sample
// menu and a few days of ratings, so the staff dashboard has something to
// show in a demo. Ratings and comments are made up; never run this against
// production.
//   node scripts/dev.mjs              (in one terminal)
//   node scripts/seed-demo.mjs        (in another)
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const BASE = process.env.LL_BASE || "http://localhost:8888";
const call = async (method, path, body, key) => {
  const res = await fetch(BASE + "/api/" + path, {
    method,
    headers: { "Content-Type": "application/json", ...(key ? { "X-Admin-Key": key } : {}) },
    body: body && JSON.stringify(body),
  });
  const out = await res.json();
  if (!res.ok) throw new Error(`${method} ${path}: ${out.error}`);
  return out;
};

const sandbox = { window: {} };
vm.runInNewContext(await readFile(new URL("../public/sample.js", import.meta.url), "utf8"), sandbox);
const WEEK = sandbox.window.SAMPLE_WEEK;

const add = (d, n) => { const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const monday = d => { const w = new Date(d + "T00:00:00Z").getUTCDay(); return add(d, w === 0 ? -6 : 1 - w); };

const { school, adminKey } = await call("POST", "schools", { name: process.env.LL_NAME || "Demo High School", tz: "America/Los_Angeles" });
const { today } = await call("GET", `menu?school=${school.id}&from=2026-01-01&to=2026-01-01`);
const start = add(monday(today), -7);
const days = [];
for (let w = 0; w < 3; w++) WEEK.forEach((d, i) => days.push({ date: add(start, w * 7 + i), breakfast: d.breakfast, lunch: d.lunch }));
const saved = (await call("PUT", "menu", { school: school.id, days }, adminKey)).days;

// How much students like each dish, roughly. Higher = more Good votes.
const LIKE = {
  "Chicken Tenders & Fries": 0.82, "Beef Street Tacos": 0.78, "Orange Chicken & Fried Rice": 0.8, "Cheeseburger & Fries": 0.7,
  "Pepperoni Pizza": 0.74, "Cheese Pizza": 0.6, "Teriyaki Chicken Bowl": 0.66, "Mac & Cheese": 0.5, "Spaghetti & Meatballs": 0.46,
  "Cheese Quesadilla": 0.55, "Chicken Caesar Wrap": 0.4, "Caesar Salad": 0.3, "Chef Salad": 0.22,
  "Pancakes": 0.62, "French Toast": 0.58, "Breakfast Burrito": 0.52, "Yogurt Parfait": 0.44, "Blueberry Muffin": 0.5,
  "Fresh Fruit Cup": 0.35, "Banana Bread": 0.4, "Powdered Mini Donuts": 0.72, "Oatmeal Chocolate Chip Bar": 0.48, "Cheesy Pull-Aparts": 0.6,
};
// A few comments per dish, by rating, so the feed reads like real feedback.
const COMMENTS = {
  "Chicken Tenders & Fries": { good: ["The tenders were crispy for once", "Please make this every week"], bad: ["Fries were cold by the time I sat down"] },
  "Beef Street Tacos": { good: ["Tacos were really good today, thank you!", "More salsa next time but these were great"], mid: ["Good but three tacos isn't enough"] },
  "Orange Chicken & Fried Rice": { good: ["Best orange chicken this year"], mid: ["Rice was a little dry"] },
  "Spaghetti & Meatballs": { mid: ["Pasta was fine but the meatballs were cold"], bad: ["Way too much sauce, it was soupy"] },
  "Cheese Pizza": { mid: ["Crust was kind of soggy"], good: ["Pizza day is the best day"] },
  "Pepperoni Pizza": { good: ["Pizza day is the best day"], mid: ["Crust was kind of soggy"] },
  "Chef Salad": { bad: ["The salad was mostly lettuce, I threw most of it out", "Dressing ran out before my lunch period"] },
  "Caesar Salad": { bad: ["Caesar dressing was way too salty"], mid: ["Croutons were stale"] },
  "Chicken Caesar Wrap": { bad: ["Wrap was soggy by lunch"] },
  "Pancakes": { good: ["Pancakes were warm, thank you"], bad: ["Pancakes were cold and hard"] },
  "Fresh Fruit Cup": { bad: ["Fruit cup was warm and mushy"], good: ["The strawberries were really fresh"] },
  "Breakfast Burrito": { bad: ["Eggs were rubbery"], mid: ["Needs more salsa"] },
  "Teriyaki Chicken Bowl": { good: ["Teriyaki bowl was so good"], mid: ["Not enough chicken"] },
  "Mac & Cheese": { mid: ["Kind of bland today"] },
};
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const voters = Array.from({ length: 46 }, (_, i) => `demo-student-${String(i).padStart(3, "0")}`);
let votes = 0;
const used = new Set();
for (let i = 0; i < 7; i++) {
  const date = add(today, -i), day = saved[date];
  if (!day) continue;
  for (const meal of ["breakfast", "lunch"]) {
    for (const item of day[meal]) {
      const like = LIKE[item.name] ?? 0.5;
      for (const voter of voters) {
        if (rand() > (meal === "lunch" ? 0.42 : 0.2)) continue;
        const r = rand(), vote = r < like ? "good" : r < like + (1 - like) * 0.45 ? "mid" : "bad";
        const pool = COMMENTS[item.name]?.[vote];
        let comment = pool && rand() < 0.16 ? pool[Math.floor(rand() * pool.length)] : "";
        if (comment && used.has(date + comment)) comment = ""; // one of each per day reads more like real students
        if (comment) used.add(date + comment);
        await call("POST", "votes", { school: school.id, voter_id: voter, date, item_id: item.id, vote, comment });
        votes++;
      }
    }
  }
}
const ideas = ["Korean fried chicken", "Pho on rainy days", "Bigger salad bar", "Chicken teriyaki every Friday", "Spicy chicken sandwich"];
for (const [i, text] of ideas.entries()) {
  const idea = await call("POST", "ideas", { school: school.id, voter_id: voters[i], text });
  for (const v of voters.slice(10, 10 + Math.floor(rand() * 18) + (5 - i) * 3)) await call("POST", `ideas/${idea.id}/vote`, { school: school.id, voter_id: v, on: true });
}

console.log(`${school.name}: ${votes} ratings`);
console.log(`Student join code: ${school.code}`);
console.log(`Staff key:         ${adminKey}`);
