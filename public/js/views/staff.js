// The staff app: sidebar shell and the Insights dashboard.
import { $, esc, plural, listJoin, LS, D, shortDay, pct, foodTile } from "../util.js";
import { state, school, MEALS, RATINGS, REPLY_MAX } from "../state.js";
import { api } from "../api.js";
import { icon, rateIcon, mark } from "../icons.js";
import { t, setLang } from "../i18n.js";
import { render, toast, registerActions, head, errorBox, skeleton, currentTab, TABS, openSheet, closeSheet } from "../ui.js";
import { setMode, leaveToWelcome } from "../session.js";
import { ideasCard } from "./ideas.js";

const cuisineName = k => (k ? (t("cuisine." + k) !== "cuisine." + k ? t("cuisine." + k) : k.charAt(0).toUpperCase() + k.slice(1)) : "No cuisine set");
const mealName = m => m.charAt(0).toUpperCase() + m.slice(1);

// ---------- shell ----------
export function staffShell(content) {
  const s = state.admin.school, tab = currentTab(), a = state.admin;
  const nav = TABS.admin.map(([k, l, ic]) => `<a href="#${k}" class="side-i${k === tab ? " on" : ""}"${k === tab ? ' aria-current="page"' : ""}>${icon(ic)}<span>${l}</span></a>`).join("");
  return `<div class="app staff">
    <aside class="side" aria-label="Staff navigation">
      <div class="side-brand">${mark(34)}<div><p class="side-name" title="${esc(s.name)}">${esc(s.name)}</p><p class="side-role">${esc(a.role)}</p></div></div>
      <nav class="side-nav">${nav}</nav>
      <div class="side-foot">
        ${a.schools.length > 1 ? `<label class="sr-only" for="switch-school">Switch school</label><select class="input sm" id="switch-school" data-switch-school>${a.schools.map(x => `<option value="${x.school.id}"${x.school.id === s.id ? " selected" : ""}>${esc(x.school.name)}</option>`).join("")}</select>` : ""}
        <button class="side-btn" data-act="as-student">${icon("user")}<span>Student view</span></button>
        <button class="side-btn" data-act="signout">${icon("logout")}<span>Sign out</span></button>
        ${a.email ? `<p class="side-mail" title="${esc(a.email)}">${esc(a.email)}</p>` : ""}
      </div>
    </aside>
    <div class="stage wide"><div class="stage-in">${content}</div></div>
  </div>`;
}

// ---------- data ----------
const rangeKey = () => (state.range === "custom" ? `custom:${state.customFrom}:${state.customTo}` : state.range);
function rangeDates() {
  const to = state.today;
  if (state.range === "7") return { from: D.add(to, -6), to };
  if (state.range === "30") return { from: D.add(to, -29), to };
  if (state.range === "custom") {
    let end = state.customTo || to, start = state.customFrom || D.add(end, -29);
    if (end > to) end = to;
    if (start > end) start = end;
    if (start < D.add(end, -399)) start = D.add(end, -399);
    return { from: start, to: end };
  }
  const floor = D.add(to, -399);
  let from = D.monday(state.admin.school.created_at.slice(0, 10));
  if (from < floor) from = floor;
  if (from > to) from = to;
  return { from, to };
}

// Charts group by day, week or month. "auto" picks whichever fits the time frame.
const GROUPS = [["day", "Day"], ["week", "Week"], ["month", "Month"]];
const pickGroup = (span, want = "auto") => {
  const g = want === "auto" ? (span <= 31 ? "day" : span <= 150 ? "week" : "month") : want;
  return g === "day" && span > 62 ? "week" : g;
};
const groupSeg = (act, current) => `<div class="seg mini" role="group" aria-label="Group by">${GROUPS.map(([k, l]) => `<button data-act="${act}" data-group="${k}" aria-pressed="${current === k}">${l}</button>`).join("")}</div>`;
function buckets(from, to, group, map, zero, add) {
  const key = d => (group === "day" ? d : group === "week" ? D.monday(d) : d.slice(0, 7));
  const bag = {};
  for (const [d, v] of Object.entries(map)) { const k = key(d); bag[k] = add(bag[k] === undefined ? zero() : bag[k], v); }
  const out = [], span = D.span(from, to);
  if (group === "day") {
    for (let i = 0; i < span; i++) { const d = D.add(from, i); if (D.isWeekend(d) && bag[d] === undefined) continue; out.push([d, bag[d] === undefined ? zero() : bag[d]]); }
  } else if (group === "week") {
    for (let w = D.monday(from); w <= to; w = D.add(w, 7)) out.push([w, bag[w] === undefined ? zero() : bag[w]]);
  } else {
    let m = from.slice(0, 7);
    const last = to.slice(0, 7);
    while (m <= last) {
      out.push([m, bag[m] === undefined ? zero() : bag[m]]);
      const [y, mo] = m.split("-").map(Number);
      m = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
    }
  }
  return out.slice(-36);
}
const bucketLabel = (k, group, span) => (group === "day" ? (span <= 7 ? D.fmt(k, { weekday: "short" }) : D.fmt(k, { day: "numeric" })) : group === "week" ? D.fmt(k, { month: "numeric", day: "numeric" }) : D.fmt(k + "-01", { month: "short" }));
const bucketLong = (k, group) => (group === "day" ? shortDay(k) : group === "week" ? `Week of ${shortDay(k)}` : D.fmt(k + "-01", { month: "long", year: "numeric" }));
const isNow = (k, group) => (group === "day" ? k === state.today : group === "week" ? k === D.monday(state.today) : k === state.today.slice(0, 7));

// Long lists fold away, so a month of comments doesn't mean a mile of scrolling.
const folded = k => !!(state.fold && state.fold[k]);
const moreOpen = k => !!(state.more && state.more[k]);
const foldBtn = k => `<button class="fold-btn${folded(k) ? " is-folded" : ""}" data-act="fold" data-key="${k}" aria-expanded="${!folded(k)}" aria-label="${folded(k) ? "Expand" : "Collapse"} this section">${icon("chevD")}</button>`;
const moreBtn = (k, total, shown) => (total > shown ? `<button class="link more-btn" data-act="more" data-key="${k}" aria-expanded="${moreOpen(k)}">${moreOpen(k) ? "Show fewer" : `Show all ${total}`}</button>` : "");

export async function loadInsights() {
  if (state.loading.has("ins")) return;
  state.loading.add("ins");
  const range = rangeKey(), s = state.admin.school;
  if (!state.today) state.today = (await api("GET", `menu?school=${s.id}&from=2026-01-01&to=2026-01-01`).catch(() => ({ today: null }))).today || D.add(new Date().toISOString().slice(0, 10), 0);
  let result;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { from, to } = rangeDates();
    try {
      const data = await api("GET", `insights?school=${s.id}&from=${from}&to=${to}`);
      if (data.today !== state.today && attempt === 0) { state.today = data.today; continue; }
      result = { range, from, to, data };
    } catch (e) {
      if (e.status === 401 || e.status === 403 || (e.status === 404 && /school/i.test(e.message))) {
        state.loading.delete("ins");
        if (state.mode === "admin") adminGone();
        return;
      }
      result = { range, error: e.message };
    }
    break;
  }
  state.loading.delete("ins");
  if (state.mode !== "admin") return;
  state.insights = result;
  if (!result.error) state.lastIns = result; // shown while the next load runs, so edits refresh without a flash
  if (!state.ob && currentTab() === "insights") render();
}

export function adminGone() {
  LS.del("ll_admin"); LS.del("ll_admin_school"); state.admin = null;
  toast("You were signed out. Sign in again with your email and password.", true);
  if (state.student) setMode("student"); else leaveToWelcome();
}

// ---------- small chart pieces ----------
const stackBar = (t2, label) => `<div class="stack${t2.total ? "" : " is-empty"}" role="img" aria-label="${esc(label ? label + ": " : "")}${t2.good} good, ${t2.mid} mid, ${t2.bad} bad">${
  ["good", "mid", "bad"].map(k => (t2[k] ? `<span class="s-${k}" style="width:${(100 * t2[k]) / t2.total}%"></span>` : "")).join("")}</div>`;
const legend = `<ul class="legend" aria-hidden="true"><li><span class="s-good"></span>Good</li><li><span class="s-mid"></span>Mid</li><li><span class="s-bad"></span>Bad</li></ul>`;
const ring = (p, label, sub = "") => `<div class="ring" style="--p:${Math.max(0, Math.min(100, p))}" role="img" aria-label="${esc(label)}"><div class="ring-in"><strong>${Math.round(p)}%</strong>${sub ? `<span>${esc(sub)}</span>` : ""}</div></div>`;
const conf = d => `<span class="conf c-${d.confidence}" title="${d.raters} different phones rated this">${d.confidence === "high" ? "Solid" : d.confidence === "medium" ? "Fair" : "Early"} · ${d.raters}</span>`;

function dailyChart(st, from, to, group) {
  const span = D.span(from, to);
  const zero = () => ({ good: 0, mid: 0, bad: 0, total: 0 });
  const add = (acc, v) => { ["good", "mid", "bad", "total"].forEach(k => { acc[k] += v[k]; }); return acc; };
  const cols = buckets(from, to, group, st.byDate, zero, add).map(([k, t]) => ({ key: k, t, x: bucketLabel(k, group, span), long: bucketLong(k, group) }));
  const max = Math.max(1, ...cols.map(c => c.t.total));
  return `<div class="cols" style="--n:${cols.length}">${cols.map(c => `<div class="col" role="img" aria-label="${esc(c.long)}: ${c.t.total ? `${c.t.good} good, ${c.t.mid} mid, ${c.t.bad} bad` : "no ratings"}">
    <span class="col-v">${c.t.total || ""}</span>
    <div class="col-track"><div class="col-bar" style="height:${c.t.total ? Math.max(4, (100 * c.t.total) / max) : 0}%">${["bad", "mid", "good"].map(k => (c.t[k] ? `<span class="s-${k}" style="flex:${c.t[k]}"></span>` : "")).join("")}</div></div>
    <span class="col-x${isNow(c.key, group) ? " now" : ""}">${esc(c.x)}</span></div>`).join("")}</div>`;
}

function rankList(list, kind) {
  if (!list.length) return `<p class="muted small">Not enough rated dishes yet.</p>`;
  return `<ol class="rank">${list.map((d, i) => {
    const p = kind === "bad" ? Math.round((100 * d.t.bad) / d.t.total) : pct(d.t);
    return `<li>
      <span class="rank-n">${i + 1}</span>
      ${d.photo ? `<img class="rank-img" src="${esc(d.photo)}" alt="" loading="lazy">` : `${foodTile(d.name, "rank-img ph")}`}
      <div class="rank-main"><p class="rank-t">${esc(d.name)} ${conf(d)}</p>${stackBar(d.t, d.name)}
        ${d.last?.reply ? `<p class="rank-reply">${icon("megaphone")}${esc(d.last.reply)}</p>` : ""}</div>
      <div class="rank-side"><p class="rank-p ${kind === "bad" ? "v-bad" : "v-good"}"><strong>${p}%</strong><span>${kind === "bad" ? "disliked" : "liked"} · ${d.t.total}</span></p>
        ${d.last ? `<button class="btn ghost xs" data-act="reply-dish" data-date="${d.last.date}" data-id="${d.last.item_id}" data-name="${esc(d.name)}" data-reply="${esc(d.last.reply || "")}">${icon("megaphone")}${d.last.reply ? "Edit reply" : "Reply"}</button>` : ""}</div>
    </li>`;
  }).join("")}</ol>`;
}

// ---------- the dashboard ----------
export function viewInsights() {
  const s = state.admin.school;
  state.fold ||= {}; state.more ||= {};
  const key = rangeKey();
  const fresh = state.insights && state.insights.range === key ? state.insights : null;
  const ins = fresh || (state.lastIns && state.lastIns.range === key ? state.lastIns : null);
  const ranges = [["7", "7 days"], ["30", "30 days"], ["all", "All time"], ["custom", "Custom"]];
  const cr = rangeDates();
  const top = `${head("Insights", "Here's what students are saying", "These are the ratings and comments from your students. We set aside anything that looks like a script or a bot, so you can trust the numbers.",
    `<button class="icon-btn outlined" data-act="export-ins" aria-label="Download ratings as a spreadsheet" title="Download CSV">${icon("copy")}</button><button class="icon-btn outlined" data-act="refresh-ins" aria-label="Refresh">${icon("refresh")}</button>`)}
    <div class="seg narrow" role="group" aria-label="Time range">${ranges.map(([k, l]) => `<button data-act="range" data-range="${k}" aria-pressed="${state.range === k}">${l}</button>`).join("")}</div>
    ${state.range === "custom" ? `<form class="custom-range" data-form="custom-range"><label>From <input class="input sm" type="date" id="cr-from" value="${cr.from}" max="${state.today}" required></label><label>To <input class="input sm" type="date" id="cr-to" value="${cr.to}" max="${state.today}" required></label><button class="btn secondary sm" type="submit">Apply</button></form>` : ""}
    ${s.sim_data ? `<p class="sim-note">${icon("info")}These ratings, comments and ideas are simulated, to show how a month of activity looks.</p>` : ""}`;
  if (!fresh) loadInsights();
  if (!ins) return top + skeleton(4, "bento");
  if (ins.error) return top + errorBox(ins.error, "refresh-ins");
  const st = ins.data.stats, ideas = ins.data.ideas, wasteLog = ins.data.waste_log;
  if (!st.total.total) {
    return `${top}<div class="empty big">
      <p><strong>${state.range === "all" ? "Nobody has rated anything yet." : "There are no ratings in this time range."}</strong><br>Once you put the QR poster up where students line up, ratings will start showing here. It only takes them one scan and one tap.</p>
      <div class="row-btns center"><button class="btn primary" data-act="poster-open" data-kind="letter">${icon("qr")}Print the QR poster</button>
      <button class="btn secondary" data-act="copy" data-text="${esc(location.origin + "/?join=" + s.code)}" data-label="Invite link">${icon("link")}Copy invite link</button></div>
      <p class="big-code">${esc(s.code)}</p></div>
      ${ideas.length ? ideasCard(ideas) : ""}${wasteTile(st, wasteLog, ins)}`;
  }
  const dishes = st.dishes, cuisines = Object.entries(st.byCuisine).sort((a, b) => pct(b[1]) - pct(a[1]) || b[1].total - a[1].total);
  const span = D.span(ins.from, ins.to), group = pickGroup(span, state.group || "auto");
  const days = Object.keys(st.byDate).length;
  const enroll = ins.data.school.enrollment;
  return `${top}
    <div class="bento">
      <section class="tile hero" aria-label="Summary">
        ${ring(pct(st.total), `${pct(st.total)} percent of ratings were Good`, "Good")}
        <div class="hero-text"><p class="hero-k">Overall</p><p class="hero-lead"><strong>${pct(st.total)}%</strong> of ratings were Good</p>
          ${stackBar(st.total, "All ratings")}
          <p class="hero-s">${st.total.good} good · ${st.total.mid} mid · ${st.total.bad} bad · ${plural(st.total.total, "rating")} over ${plural(days, "day")}</p></div>
      </section>

      <section class="tile part">
        <p class="tile-k">${icon("users")}Students rating</p>
        <p class="tile-big">${st.students}</p>
        ${st.participation !== null
          ? `<div class="meter" role="img" aria-label="${st.participation} percent of students"><span style="width:${st.participation}%"></span></div><p class="tile-s">${st.participation}% of ${enroll.toLocaleString()} students</p>`
          : `<p class="tile-s">different phones. <a class="link" href="#school">Add your enrollment</a> to see participation.</p>`}
        ${st.flagged ? `<p class="tile-flag">${icon("shield")}${plural(st.flagged, "rating")} set aside as suspicious</p>` : `<p class="tile-ok">${icon("shield")}No suspicious ratings</p>`}
      </section>

      ${wasteTile(st, wasteLog, ins)}

      <section class="tile wide"><div class="card-head"><h2>Ratings by ${group}</h2><div class="head-tools">${legend}${groupSeg("group", group)}${foldBtn("chart")}</div></div>${folded("chart") ? "" : dailyChart(st, ins.from, ins.to, group)}</section>

      <section class="tile half"><div class="card-head"><h2>Make more of these</h2><span class="muted small">Most liked</span></div>${rankList(st.loved, "good")}</section>
      <section class="tile half"><div class="card-head"><h2>Fix or drop these</h2><span class="muted small">Most disliked</span></div>${rankList(st.needs, "bad")}</section>

      ${gradeTile(st)}

      <section class="tile half"><div class="card-head"><h2>Breakfast, snack and lunch</h2><div class="head-tools">${foldBtn("meals")}</div></div>
        ${folded("meals") ? "" : `<ul class="hbars">${MEALS.map(m => { const tt = st.byMeal[m] || { good: 0, mid: 0, bad: 0, total: 0 }; return `<li><div class="hbar-top"><span>${mealName(m)}</span><span>${tt.total ? `<strong>${pct(tt)}%</strong> liked · ${tt.total}` : "No ratings"}</span></div>${stackBar(tt, mealName(m))}</li>`; }).join("")}</ul>`}</section>
      <section class="tile half"><div class="card-head"><h2>Favorite cuisines</h2><div class="head-tools">${foldBtn("cuisines")}</div></div>
        ${folded("cuisines") ? "" : `<ul class="hbars">${cuisines.map(([c, tt]) => `<li><div class="hbar-top"><span>${esc(cuisineName(c))}</span><span><strong>${pct(tt)}%</strong> liked · ${tt.total}</span></div>${stackBar(tt, c)}</li>`).join("")}</ul>`}</section>

      <section class="tile wide"><div class="card-head"><h2>What students said</h2><div class="head-tools"><span class="muted small">${plural(st.comments.length, "comment")}</span>${foldBtn("comments")}</div></div>
        ${folded("comments") ? "" : `${st.comments.length ? `<ul class="feed">${st.comments.slice(0, moreOpen("comments") ? 100 : 6).map(c => `<li>
          <span class="pill v-${c.vote}">${icon(rateIcon(c.vote))}${t("rate." + c.vote)}</span>
          <div class="feed-main"><p class="feed-q">“${esc(c.comment)}”</p><p class="feed-m"><strong>${esc(c.name)}</strong> · ${mealName(c.meal)} · ${shortDay(c.date)}</p>
            ${c.kr ? `<p class="feed-r">${icon("megaphone")}<span><strong>You replied${c.kr.public ? " to everyone" : " privately"}:</strong> ${esc(c.kr.text)}</span></p>` : ""}</div>
          <div class="feed-act"><button class="btn ghost xs" data-act="reply-dish" data-date="${c.date}" data-id="${c.item_id}" data-name="${esc(c.name)}" data-reply="${esc(c.kr ? c.kr.text : "")}" data-to="${esc(c.comment)}" data-cid="${c.cid}" data-public="${c.kr ? !!c.kr.public : true}">${icon("megaphone")}${c.kr ? "Edit reply" : "Reply"}</button>
          <button class="btn ghost xs" data-act="hide-comment" data-date="${c.date}" data-id="${c.item_id}" data-cid="${c.cid}">${icon("eyeOff")}Hide</button></div>
        </li>`).join("")}</ul>${moreBtn("comments", Math.min(st.comments.length, 100), 6)}` : '<p class="muted small">No written comments in this period.</p>'}
        ${(st.hiddenComments || []).length ? `<div class="hidden-comments"><button class="link" data-act="toggle-hidden" aria-expanded="${!!state.showHidden}">${state.showHidden ? "Hide" : "Show"} ${plural(st.hiddenComments.length, "hidden comment")}</button>
          ${state.showHidden ? `<ul class="feed muted-feed">${st.hiddenComments.map(c => `<li>
            <span class="pill v-${c.vote}">${icon(rateIcon(c.vote))}${t("rate." + c.vote)}</span>
            <div class="feed-main"><p class="feed-q">“${esc(c.comment)}”</p><p class="feed-m"><strong>${esc(c.name)}</strong> · ${mealName(c.meal)} · ${shortDay(c.date)}</p></div>
            <div class="feed-act"><button class="btn ghost xs" data-act="unhide-comment" data-date="${c.date}" data-id="${c.item_id}" data-cid="${c.cid}">${icon("eye")}Unhide</button></div>
          </li>`).join("")}</ul>` : ""}</div>` : ""}`}</section>

      ${ideas.length ? `<div class="tile wide flush">${ideasCard(ideas)}</div>` : ""}

      <section class="tile wide"><div class="card-head"><h2>Every dish</h2><div class="head-tools"><span class="muted small">${plural(dishes.length, "dish", "dishes")}</span>${foldBtn("dishes")}</div></div>
        ${folded("dishes") ? "" : `<ul class="hbars">${[...dishes].sort((a, b) => b.t.total - a.t.total || pct(b.t) - pct(a.t)).slice(0, moreOpen("dishes") ? 500 : 10).map(d =>
          `<li><div class="hbar-top"><span>${esc(d.name)} <span class="muted">· ${d.meals.map(mealName).join(" & ")}</span> ${conf(d)}</span><span><strong>${pct(d.t)}%</strong> liked · ${d.t.total}</span></div>${stackBar(d.t, d.name)}</li>`).join("")}</ul>${moreBtn("dishes", dishes.length, 10)}`}</section>
    </div>`;
}

function wasteTile(st, log, ins) {
  const span = D.span(ins.from, ins.to), group = pickGroup(span, state.wgroup || "auto");
  const cols = buckets(ins.from, ins.to, group, st.waste.byDate, () => 0, (a, v) => a + v).filter(([, v], i, all) => v > 0 || (i > 0 && i < all.length - 1));
  const max = Math.max(1, ...cols.map(([, v]) => v));
  const round = n => Math.round(n * 10) / 10;
  return `<section class="tile waste">
    <p class="tile-k">${icon("leaf")}Food thrown away</p>
    <p class="tile-big">${st.waste.days ? `${st.waste.pounds}<small> lb</small>` : "—"}</p>
    <p class="tile-s">${st.waste.days ? `across ${plural(st.waste.days, "logged day")}${st.waste.days ? ` · about ${Math.round((st.waste.pounds / st.waste.days) * 10) / 10} lb a day` : ""}` : "Weigh the trash once a day to see if ratings match what's wasted."}</p>
    ${cols.length ? `<div class="spark-box">${groupSeg("wgroup", group)}<div class="spark" role="img" aria-label="Pounds thrown away by ${group}">${cols.map(([k, v]) => `<span style="height:${Math.max(v ? 8 : 3, (100 * v) / max)}%" title="${esc(bucketLong(k, group))}: ${round(v)} lb"></span>`).join("")}</div></div>` : ""}
    <form class="waste-form" data-form="waste">
      <label class="sr-only" for="waste-lb">Pounds thrown away today</label>
      <input class="input sm" id="waste-lb" type="number" inputmode="decimal" min="0" max="5000" step="0.1" placeholder="Pounds today" required>
      <button class="btn secondary sm" type="submit">Log</button>
    </form>
  </section>`;
}

function gradeTile(st) {
  if (!st.grades.length) {
    return `<section class="tile wide"><div class="card-head"><h2>${icon("grad")}By grade</h2></div><p class="muted small">When students pick their grade, you'll see what each grade likes and struggles with here. Students choose it in one tap and can skip it.</p></section>`;
  }
  const ok = st.grades.filter(g => g.ok), small = st.grades.filter(g => !g.ok);
  if (folded("grades")) return `<section class="tile wide"><div class="card-head"><h2>${icon("grad")}By grade</h2><div class="head-tools">${foldBtn("grades")}</div></div></section>`;
  return `<section class="tile wide"><div class="card-head"><h2>${icon("grad")}By grade</h2><div class="head-tools"><span class="muted small">Shown for groups of 5 or more students</span>${foldBtn("grades")}</div></div>
    ${ok.length ? `<ul class="grade-list">${ok.map(g => `<li>
      <div class="gr-h"><span class="gr-n">${g.grade === "other" ? "Other" : "Grade " + esc(g.grade)}</span><span class="gr-s">${plural(g.students, "student")} · <strong>${pct(g.t)}%</strong> Good</span></div>
      ${stackBar(g.t, "Grade " + g.grade)}
      <p class="gr-d">${g.best ? `<span class="v-good">${icon("thumbUp")}Likes ${esc(g.best.name)} (${g.best.pct}%)</span>` : ""}${g.worst ? `<span class="v-bad">${icon("thumbDown")}Struggles with ${esc(g.worst.name)} (${g.worst.pct}% disliked)</span>` : ""}</p>
    </li>`).join("")}</ul>` : `<p class="muted small">No grade has 5 students yet, so nothing is shown. This protects students from being singled out.</p>`}
    ${small.length ? `<p class="fine left">${icon("lock")}${small.map(g => g.grade === "other" ? "Other" : "Grade " + g.grade).join(", ")} ${small.length === 1 ? "is" : "are"} hidden until at least 5 students are in the group.</p>` : ""}
  </section>`;
}

// ---------- clicks ----------
registerActions({
  range(el) {
    state.range = el.dataset.range;
    if (state.range === "custom" && !state.customTo) { state.customTo = state.today; state.customFrom = D.add(state.today, -29); }
    render(); document.querySelector(`[data-act="range"][data-range="${state.range}"]`)?.focus();
  },
  group(el) { state.group = el.dataset.group; render(); document.querySelector(`[data-act="group"][data-group="${state.group}"]`)?.focus(); },
  wgroup(el) { state.wgroup = el.dataset.group; render(); document.querySelector(`[data-act="wgroup"][data-group="${state.wgroup}"]`)?.focus(); },
  fold(el) { state.fold ||= {}; state.fold[el.dataset.key] = !state.fold[el.dataset.key]; render(); document.querySelector(`[data-act="fold"][data-key="${el.dataset.key}"]`)?.focus(); },
  more(el) { state.more ||= {}; state.more[el.dataset.key] = !state.more[el.dataset.key]; render(); document.querySelector(`[data-act="more"][data-key="${el.dataset.key}"]`)?.focus(); },
  "export-ins"() {
    const st = state.insights && state.insights.stats;
    if (!st || !st.dishes) { toast("Nothing to export yet", true); return; }
    const cell = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Dish", "Meals", "Good", "Mid", "Bad", "Ratings", "Percent good"], ...st.dishes.map(d => [d.name, d.meals.join(" & "), d.t.good, d.t.mid, d.t.bad, d.t.total, pct(d.t)])];
    const url = URL.createObjectURL(new Blob([rows.map(r => r.map(cell).join(",")).join("\n")], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${school().name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-ratings-${state.range || "7d"}.csv` });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast("Spreadsheet downloaded");
  },
  "refresh-ins"() { state.insights = null; render(); document.querySelector('[data-act="refresh-ins"]')?.focus(); },
  "reply-dish"(el) {
    const to = el.dataset.to || "", cid = el.dataset.cid || "", pub = el.dataset.public !== "false";
    openSheet(`<form class="sheet-form" data-form="reply-dish" data-date="${el.dataset.date}" data-id="${el.dataset.id}" data-to="${esc(to)}" data-cid="${esc(cid)}">
      <h2 id="sheet-title">Reply on “${esc(el.dataset.name)}”</h2>
      ${to ? `<blockquote class="replying">${icon("megaphone")}<span><small>Replying to</small>“${esc(to)}”</span></blockquote>` : ""}
      ${cid ? `<fieldset class="reply-vis"><legend>Who sees your reply?</legend>
        <label class="radio"><input type="radio" name="reply-vis" value="public"${pub ? " checked" : ""}><span><strong>Everyone</strong>Shown on the dish, with the comment it answers. Their name is never shown.</span></label>
        <label class="radio"><input type="radio" name="reply-vis" value="private"${pub ? "" : " checked"}><span><strong>Only the student who wrote it</strong>They see it next to their own comment.</span></label>
      </fieldset>` : `<p class="muted">Students see your note on the dish. Say what you're changing.</p>`}
      <label class="label" for="reply-in">Your note</label>
      <input class="input" id="reply-in" maxlength="${REPLY_MAX}" value="${esc(el.dataset.reply)}" placeholder="e.g. The oven was down. Fixed for Thursday.">
      <div class="modal-btns"><button type="button" class="btn secondary" data-act="sheet-close">Cancel</button><button class="btn primary" type="submit">Post reply</button></div>
    </form>`);
    $("#reply-in")?.focus();
  },
  async "hide-comment"(el) {
    try {
      await api("POST", "votes/hide", { school: school().id, date: el.dataset.date, item_id: el.dataset.id, cid: el.dataset.cid });
      state.insights = null; render(); toast("Comment hidden. You can unhide it under the comments.");
    } catch (e) { toast(e.message, true); }
  },
  async "unhide-comment"(el) {
    try {
      await api("POST", "votes/hide", { school: school().id, date: el.dataset.date, item_id: el.dataset.id, cid: el.dataset.cid, hidden: false });
      state.insights = null; render(); toast("Comment is showing again.");
    } catch (e) { toast(e.message, true); }
  },
  "toggle-hidden"() { state.showHidden = !state.showHidden; render(); },
  async "as-student"() {
    const { startFlow } = await import("../session.js");
    if (state.student?.school.id === state.admin.school.id) setMode("student");
    else {
      const s = state.admin.school;
      // View it as a student would: a device token and the grade / allergy screen.
      const { ensureToken } = await import("../api.js");
      ensureToken(s.id).catch(() => {});
      startFlow("student", { school: s }, { steps: ["setup"], exit: "app" });
    }
  },
});

export async function submitStaffForm(f) {
  if (f.dataset.form === "custom-range") {
    const from = $("#cr-from").value, to = $("#cr-to").value;
    if (!from || !to) return;
    state.customFrom = from <= to ? from : to; state.customTo = from <= to ? to : from;
    state.insights = null; render();
    return;
  }
  if (f.dataset.form === "reply-dish") {
    const text = $("#reply-in").value.trim();
    const priv = !!f.dataset.cid && f.querySelector('input[name="reply-vis"]:checked')?.value === "private";
    closeSheet();
    try {
      await api("POST", "replies", { school: school().id, date: f.dataset.date, item_id: f.dataset.id, text, ...(f.dataset.cid ? { cid: f.dataset.cid, public: !priv } : f.dataset.to ? { to: f.dataset.to } : {}) });
      state.insights = null; state.aWeeks = {}; render(); toast(!text ? "Reply removed" : priv ? "Reply sent to that student" : "Reply posted");
    } catch (e) { toast(e.message, true); }
  }
  if (f.dataset.form === "waste") {
    const lb = Number($("#waste-lb").value);
    try {
      await api("PUT", "waste", { school: school().id, date: state.today, pounds: lb });
      state.insights = null; render(); toast(`Logged ${lb} lb for today`);
    } catch (e) { toast(e.message, true); }
  }
}
