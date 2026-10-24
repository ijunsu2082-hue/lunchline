// Demo schools: a handful of ready-to-try schools so the site never looks empty, plus the
// master school (MASTER_SCHOOL). Their menus fill themselves from the sample week in
// public/sample.js (every dish has a photo), one weekday at a time, the first time someone
// looks at that day. A day staff have saved is never replaced.
//
// The names are generic on purpose: every state has a Lincoln High, so none of these
// claims to be one particular real school.

import { SAMPLE_PLAN } from "../../public/sample.js";
import { MEALS } from "./vocab.mjs";
import { sha, normEmail, daysBetween } from "./util.mjs";

const HIGH = ["9", "10", "11", "12"], MIDDLE = ["6", "7", "8"], ELEMENTARY = ["K", "1", "2", "3", "4", "5"];

export const DEMO_SCHOOLS = [
  { name: "Lincoln High School", grades: HIGH, color: "#B91C1C" },
  { name: "Washington Middle School", grades: MIDDLE, color: "#1D4ED8" },
  { name: "Roosevelt Elementary School", grades: ELEMENTARY, color: "#15803D" },
  { name: "Jefferson High School", grades: HIGH, color: "#7C3AED" },
  { name: "Kennedy High School", grades: HIGH, color: "#0F766E" },
  { name: "Franklin Middle School", grades: MIDDLE, color: "#C2410C" },
  { name: "Madison Elementary School", grades: ELEMENTARY, color: "#BE185D" },
  { name: "Westview High School", grades: HIGH, color: "#1E3A8A" },
  { name: "Lakeside Middle School", grades: MIDDLE, color: "#0369A1" },
  { name: "Oak Grove High School", grades: HIGH, color: "#166534" },
  { name: "Riverside High School", grades: HIGH, color: "#9F1239" },
  { name: "Hillcrest Elementary School", grades: ELEMENTARY, color: "#A16207" },
];

export const SEED_KEY = "seed/demo-v1";
export const demoEnabled = () => process.env.DEMO_SCHOOLS !== "off";
export const masterEmail = () => normEmail(process.env.MASTER_EMAIL || "ajaysriramsankar@gmail.com");
export const masterSchoolName = () => process.env.MASTER_SCHOOL || "Irvine High School";

// Fixed ids, so seeding twice (or two servers seeding at once) lands on the same records.
export const demoId = name => "demo" + sha("demo-school:" + name).slice(0, 8);

const FILL_DAYS = 28; // how far before and after today a demo menu fills itself

// The sample menu for one weekday, or null on a weekend or too far from today. `offset` rotates
// the featured lunch so neighbouring demo schools don't serve the same thing on the same day.
export function demoDay(date, today, offset = 0) {
  const dow = new Date(date + "T00:00:00Z").getUTCDay();
  if (dow === 0 || dow === 6 || Math.abs(daysBetween(today, date)) > FILL_DAYS) return null;
  const plan = SAMPLE_PLAN[(dow - 1 + offset) % SAMPLE_PLAN.length];
  const day = { date };
  for (const meal of MEALS) day[meal] = (plan[meal] || []).map((it, i) => ({ ...it, id: sha(`${date}:${meal}:${i}`).slice(0, 10) }));
  return day;
}

// A stored day from before dishes had photos: every dish on it shows the emoji placeholder.
export const photoless = day => {
  const items = MEALS.flatMap(m => (Array.isArray(day?.[m]) ? day[m] : []));
  return items.length > 0 && items.every(i => !i.photo);
};
