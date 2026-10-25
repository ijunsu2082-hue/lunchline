// The weekly kitchen report: aggregate numbers and a short plain-text summary.

import { addDays } from "./util.mjs";
import { pctGood, pctBad } from "./insights.mjs";

// Boil the week's stats down to what the report stores and shows.
export function reportData(school, stats, prev, topIdeas = []) {
  const trim = d => ({ name: d.name, pct: 0, n: d.t.total });
  const loved = stats.loved.filter(d => d.t.total >= 3).slice(0, 3).map(d => ({ ...trim(d), pct: pctGood(d.t) }));
  const needs = stats.needs.filter(d => d.t.total >= 3).slice(0, 3).map(d => ({ ...trim(d), pct: pctBad(d.t) }));
  const prevPct = prev && prev.total.total ? pctGood(prev.total) : null;
  const bullets = [];
  if (prevPct !== null && stats.total.total) {
    const diff = pctGood(stats.total) - prevPct;
    bullets.push(diff === 0 ? "Same Good rate as last week." : `${Math.abs(diff)} points ${diff > 0 ? "higher" : "lower"} Good rate than last week.`);
  }
  if (stats.participation !== null) bullets.push(`${stats.participation}% of students rated at least once this week.`);
  if (stats.waste.days) bullets.push(`${stats.waste.pounds} lb of food thrown away across ${stats.waste.days} logged day${stats.waste.days === 1 ? "" : "s"}.`);
  if (stats.flagged) bullets.push(`${stats.flagged} suspicious rating${stats.flagged === 1 ? "" : "s"} were set aside.`);
  if (topIdeas[0]) bullets.push(`Top student suggestion: “${topIdeas[0].text}” (${topIdeas[0].count} votes).`);
  return {
    school: school.name,
    good_pct: pctGood(stats.total), ratings: stats.total.total, students: stats.students,
    prev_good_pct: prevPct, loved, needs, bullets,
    ideas: topIdeas.slice(0, 5).map(i => ({ text: i.text, votes: i.count, status: i.status })),
    waste_pounds: stats.waste.days ? stats.waste.pounds : null,
  };
}

export function weeklySummary(d) {
  if (!d.ratings) return "No ratings came in this week. Put the QR poster where students line up, and remind them it takes one tap.";
  const parts = [`${d.good_pct}% of ${d.ratings} ratings were Good, from ${d.students} student${d.students === 1 ? "" : "s"}.`];
  if (d.loved[0]) parts.push(`${d.loved.map(x => x.name).join(", ")} ${d.loved.length === 1 ? "was" : "were"} the favorite${d.loved.length === 1 ? "" : "s"}.`);
  if (d.needs[0]) parts.push(`${d.needs.map(x => x.name).join(", ")} had the most Bad ratings, so those are the ones to fix or swap.`);
  return parts.join(" ");
}

export const weekWindow = today => ({ from: addDays(today, -6), to: today, prevFrom: addDays(today, -13), prevTo: addDays(today, -7) });
