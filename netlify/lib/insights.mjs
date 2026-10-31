// turns ratings into dashboard numbers
import { MEALS } from "./vocab.mjs";

// counting helpers
export const MIN_GROUP = 5; // min students before a grade shows

const T = () => ({ good: 0, mid: 0, bad: 0, total: 0 });
const add = (t, v) => { t[v]++; t.total++; };
export const pctGood = t => (t.total ? Math.round((100 * t.good) / t.total) : 0);
export const pctBad = t => (t.total ? Math.round((100 * t.bad) / t.total) : 0);

// mark votes that look like a script
export function flagVotes(rows, { burstCount = 12, burstSeconds = 10, uniformCount = 12 } = {}) {
  const byWho = new Map();
  for (const r of rows) {
    r.flag = "";
    if (!byWho.has(r.who)) byWho.set(r.who, []);
    byWho.get(r.who).push(r);
  }
  for (const list of byWho.values()) {
    if (list.length >= uniformCount && list.every(r => r.vote === list[0].vote)) {
      for (const r of list) r.flag = "uniform";
    }
    const sorted = [...list].sort((a, b) => a.updated_at.localeCompare(b.updated_at));
    for (let i = 0; i + burstCount <= sorted.length; i++) {
      const span = (Date.parse(sorted[i + burstCount - 1].updated_at) - Date.parse(sorted[i].updated_at)) / 1000;
      if (span <= burstSeconds) for (let k = i; k < i + burstCount; k++) sorted[k].flag ||= "burst";
    }
  }
  return rows;
}

// how sure are we
export function confidence(raters) {
  return raters >= 10 ? "high" : raters >= 4 ? "medium" : "low";
}

// ranking that doesn't overrate tiny samples
const goodScore = t => (t.good + 1) / (t.total + 2);
const badScore = t => (t.bad + 1) / (t.total + 2);

// best and worst dishes
export function rankDishes(dishes) {
  const byGood = [...dishes].sort((a, b) => goodScore(b.t) - goodScore(a.t) || b.t.total - a.t.total);
  const k = Math.min(5, Math.ceil(dishes.length / 2));
  const loved = byGood.slice(0, k);
  const set = new Set(loved);
  const needs = dishes.filter(d => !set.has(d))
    .sort((a, b) => badScore(b.t) - badScore(a.t) || goodScore(a.t) - goodScore(b.t) || b.t.total - a.t.total)
    .slice(0, 5);
  return { loved, needs };
}

// cuisine name
const cuisineKey = it => (it.cuisine === "other" ? (it.cuisine_other || "other").toLowerCase() : it.cuisine || "");

// all the dashboard numbers
export function computeInsights({ days, votes, waste = [], enrollment = 0, today = "" }) {
  // look up each dish by date and id
  const meta = {};
  for (const day of Object.values(days)) for (const meal of MEALS) for (const it of day[meal] || []) meta[day.date + "|" + it.id] = { it, date: day.date, meal };

  flagVotes(votes);
  const total = T(), byDate = {}, byMeal = Object.fromEntries(MEALS.map(m => [m, T()])), byCuisine = {}, byDish = {};
  const who = new Set(), gradeWho = {}, byGrade = {}, byGradeDish = {};
  const comments = [], hiddenComments = [];
  let flagged = 0;

  // tally every vote
  for (const v of votes) {
    const m = meta[v.date + "|" + v.item_id];
    if (!m) continue; // dish got deleted
    if (v.flag) { flagged++; continue; }
    add(total, v.vote); who.add(v.who);
    add(byDate[v.date] ||= T(), v.vote);
    add(byMeal[m.meal], v.vote);
    add(byCuisine[cuisineKey(m.it)] ||= T(), v.vote);

    const k = m.it.name.trim().toLowerCase();
    const dish = byDish[k] ||= { key: k, name: m.it.name, t: T(), meals: new Set(), photo: "", who: new Set(), flagged: 0, last: null };
    add(dish.t, v.vote); dish.meals.add(m.meal); dish.who.add(v.who);
    if (m.it.photo) dish.photo = m.it.photo;
    if (!dish.last || m.date >= dish.last.date) dish.last = { date: m.date, item_id: m.it.id, reply: m.it.reply || "" };

    if (v.grade) {
      add(byGrade[v.grade] ||= T(), v.vote);
      (gradeWho[v.grade] ||= new Set()).add(v.who);
      const gd = (byGradeDish[v.grade] ||= {})[k] ||= { name: m.it.name, t: T() };
      add(gd.t, v.vote);
    }
    if (v.comment && v.hidden) hiddenComments.push({ cid: v.who, date: v.date, item_id: v.item_id, vote: v.vote, comment: v.comment, updated_at: v.updated_at, name: m.it.name, meal: m.meal });
    if (v.comment && !v.hidden) comments.push({ cid: v.who, date: v.date, item_id: v.item_id, vote: v.vote, comment: v.comment, updated_at: v.updated_at, name: m.it.name, meal: m.meal, ...(v.kr ? { kr: v.kr } : {}) });
  }
  for (const v of votes) { // flagged ones still lower confidence
    if (!v.flag) continue;
    const m = meta[v.date + "|" + v.item_id];
    const d = m && byDish[m.it.name.trim().toLowerCase()];
    if (d) d.flagged++;
  }
  // newest comments first
  comments.sort((a, b) => b.date.localeCompare(a.date) || b.updated_at.localeCompare(a.updated_at));
  hiddenComments.sort((a, b) => b.date.localeCompare(a.date) || b.updated_at.localeCompare(a.updated_at));

  // one row per dish
  const dishes = Object.values(byDish).map(d => ({
    key: d.key, name: d.name, t: d.t, meals: [...d.meals], photo: d.photo, last: d.last,
    raters: d.who.size, confidence: confidence(d.who.size), flagged: d.flagged,
  }));
  const { loved, needs } = rankDishes(dishes);

  // per grade numbers, only for big enough groups
  const grades = Object.keys(byGrade).sort((a, b) => (parseInt(a, 10) || 99) - (parseInt(b, 10) || 99)).map(g => {
    const students = gradeWho[g].size;
    if (students < MIN_GROUP) return { grade: g, students, ok: false };
    const list = Object.values(byGradeDish[g]).filter(d => d.t.total >= 3);
    const best = [...list].sort((a, b) => goodScore(b.t) - goodScore(a.t) || b.t.total - a.t.total)[0];
    const worst = [...list].sort((a, b) => badScore(b.t) - badScore(a.t) || b.t.total - a.t.total)[0];
    return {
      grade: g, students, ok: true, t: byGrade[g],
      best: best && pctGood(best.t) >= 50 ? { name: best.name, pct: pctGood(best.t), n: best.t.total } : null,
      worst: worst && pctBad(worst.t) >= 30 ? { name: worst.name, pct: pctBad(worst.t), n: worst.t.total } : null,
    };
  });

  // food thrown away
  const poundsByDate = {};
  let pounds = 0;
  for (const w of waste) { poundsByDate[w.date] = w.pounds; pounds += w.pounds; }

  return {
    total, byDate, byMeal, byCuisine, dishes, loved, needs, comments, hiddenComments, grades,
    students: who.size,
    participation: enrollment > 0 ? Math.min(100, Math.round((100 * who.size) / enrollment)) : null,
    flagged,
    waste: { pounds: Math.round(pounds * 10) / 10, days: waste.length, byDate: poundsByDate },
    today,
  };
}
