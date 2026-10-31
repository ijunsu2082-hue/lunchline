// dashboard math tests
import { test } from "node:test";
import assert from "node:assert/strict";
import { flagVotes, computeInsights, rankDishes, confidence, MIN_GROUP } from "../netlify/lib/insights.mjs";

const item = (id, name, extra = {}) => ({ id, name, desc: "", ingredients: "", allergens: [], may: [], diet: [], cuisine: "american", photo: "", ...extra });
const DAYS = { "2026-10-19": { date: "2026-10-19", breakfast: [], lunch: [item("aaaaaa1", "Pizza"), item("aaaaaa2", "Salad")] } };
let n = 0;
const vote = (who, item_id, v, extra = {}) => ({
  date: "2026-10-19", item_id, vote: v, comment: "", who, grade: "", hidden: false,
  updated_at: new Date(Date.parse("2026-10-19T12:00:00Z") + (n++) * 60_000).toISOString(), ...extra,
});

test("a burst of ratings from one device is set aside", () => {
  const t0 = Date.parse("2026-10-19T12:00:00Z");
  const rows = Array.from({ length: 14 }, (_, i) => ({ who: "bot", vote: i % 2 ? "good" : "bad", updated_at: new Date(t0 + i * 400).toISOString() }));
  flagVotes(rows);
  assert.ok(rows.filter(r => r.flag === "burst").length >= 12);
});

test("fast but human pacing is not flagged", () => {
  const t0 = Date.parse("2026-10-19T12:00:00Z");
  const rows = Array.from({ length: 12 }, (_, i) => ({ who: "kid", vote: i % 3 ? "good" : "mid", updated_at: new Date(t0 + i * 4000).toISOString() }));
  flagVotes(rows);
  assert.ok(rows.every(r => !r.flag));
});

test("one device giving the same rating to everything is set aside", () => {
  const rows = Array.from({ length: 13 }, (_, i) => ({ who: "u", vote: "bad", updated_at: new Date(Date.parse("2026-10-19T12:00:00Z") + i * 60_000).toISOString() }));
  flagVotes(rows);
  assert.ok(rows.every(r => r.flag === "uniform"));
  const few = rows.slice(0, 5);
  flagVotes(few);
  assert.ok(few.every(r => !r.flag), "a few identical ratings are normal");
});

test("flagged ratings never reach the headline numbers", () => {
  const t0 = Date.parse("2026-10-19T12:00:00Z");
  const bot = Array.from({ length: 14 }, (_, i) => ({ date: "2026-10-19", item_id: "aaaaaa1", vote: "bad", who: "bot", grade: "", hidden: false, comment: "", updated_at: new Date(t0 + i * 100).toISOString() }));
  const real = [vote("s1", "aaaaaa1", "good"), vote("s2", "aaaaaa1", "good")];
  const s = computeInsights({ days: DAYS, votes: [...bot, ...real] });
  assert.equal(s.total.total, 2);
  assert.equal(s.total.good, 2);
  assert.equal(s.flagged, 14);
  assert.equal(s.students, 2);
});

test("grades under the minimum group size are hidden", () => {
  const rows = [];
  for (let i = 0; i < MIN_GROUP; i++) rows.push(vote("big" + i, "aaaaaa1", "good", { grade: "10" }));
  for (let i = 0; i < MIN_GROUP - 1; i++) rows.push(vote("small" + i, "aaaaaa1", "bad", { grade: "12" }));
  const g = computeInsights({ days: DAYS, votes: rows }).grades;
  const g10 = g.find(x => x.grade === "10"), g12 = g.find(x => x.grade === "12");
  assert.equal(g10.ok, true);
  assert.equal(g12.ok, false);
  assert.equal(g12.t, undefined, "no numbers leak for a small group");
});

test("ratings for deleted dishes are ignored, hidden comments drop out", () => {
  const s = computeInsights({ days: DAYS, votes: [vote("a", "gone111", "bad"), vote("b", "aaaaaa1", "good", { comment: "yum" }), vote("c", "aaaaaa2", "mid", { comment: "rude", hidden: true })] });
  assert.equal(s.total.total, 2);
  assert.equal(s.comments.length, 1);
  assert.equal(s.comments[0].comment, "yum");
});

test("participation uses enrollment when it's known", () => {
  const rows = ["a", "b", "c", "d"].map(w => vote(w, "aaaaaa1", "good"));
  assert.equal(computeInsights({ days: DAYS, votes: rows, enrollment: 40 }).participation, 10);
  assert.equal(computeInsights({ days: DAYS, votes: rows, enrollment: 0 }).participation, null);
});

test("waste pounds add up per range", () => {
  const s = computeInsights({ days: DAYS, votes: [], waste: [{ date: "2026-10-19", pounds: 20.5 }, { date: "2026-10-18", pounds: 10 }] });
  assert.equal(s.waste.pounds, 30.5);
  assert.equal(s.waste.days, 2);
});

test("small samples don't outrank solid ones", () => {
  const T = (g, m, b) => ({ good: g, mid: m, bad: b, total: g + m + b });
  const { loved } = rankDishes([{ name: "lucky", t: T(3, 0, 0) }, { name: "solid", t: T(12, 1, 0) }]);
  assert.equal(loved[0].name, "solid");
});

test("confidence grows with independent raters", () => {
  assert.equal(confidence(1), "low");
  assert.equal(confidence(5), "medium");
  assert.equal(confidence(10), "high");
});
