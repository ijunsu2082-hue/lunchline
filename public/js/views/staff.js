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
function rangeDates() {
  const to = state.today;
  if (state.range === "7") return { from: D.add(to, -6), to };
  if (state.range === "30") return { from: D.add(to, -29), to };
  const floor = D.add(to, -399);
  let from = D.monday(state.admin.school.created_at.slice(0, 10));
  if (from < floor) from = floor;
  if (from > to) from = to;
  return { from, to };
}

export async function loadInsights() {
  if (state.loading.has("ins")) return;
  state.loading.add("ins");
  const range = state.range, s = state.admin.school;
  if (!state.today) state.today = (await api("GET", `menu?school=${s.id}&from=2026-01-01&to=2026-01-01`).catch(() => ({ today: null }))).today || D.add(new Date().toISOString().slice(0, 10), 0);
  let result;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { from, to } = rangeDates();
    try {
      const data = await api("GET", `insights?school=${s.id}&from=${from}&to=${to}`);
      if (data.today !== to && attempt === 0) { state.today = data.today; continue; }
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

function dailyChart(st, from, to) {
  const span = D.span(from, to), zero = () => ({ good: 0, mid: 0, bad: 0, total: 0 });
  let cols = [];
  if (span <= 31) {
    for (let i = 0; i < span; i++) {
      const d = D.add(from, i);
      if (D.isWeekend(d) && !st.byDate[d]) continue;
      cols.push({ key: d, t: st.byDate[d] || zero(), x: span <= 7 ? D.fmt(d, { weekday: "short" }) : D.fmt(d, { day: "numeric" }), long: shortDay(d) });
    }
  } else {
    const weeks = {};
    for (const [d, v] of Object.entries(st.byDate)) {
      const acc = weeks[D.monday(d)] ||= zero();
      ["good", "mid", "bad", "total"].forEach(k => { acc[k] += v[k]; });
    }
    for (let w = D.monday(from); w <= to; w = D.add(w, 7)) cols.push({ key: w, t: weeks[w] || zero(), x: D.fmt(w, { month: "numeric", day: "numeric" }), long: `Week of ${shortDay(w)}` });
    if (cols.length > 26) cols = cols.slice(-26);
  }
  const max = Math.max(1, ...cols.map(c => c.t.total));
  return `<div class="cols" style="--n:${cols.length}">${cols.map(c => `<div class="col" role="img" aria-label="${esc(c.long)}: ${c.t.total ? `${c.t.good} good, ${c.t.mid} mid, ${c.t.bad} bad` : "no ratings"}">
    <span class="col-v">${c.t.total || ""}</span>
    <div class="col-track"><div class="col-bar" style="height:${c.t.total ? Math.max(4, (100 * c.t.total) / max) : 0}%">${["bad", "mid", "good"].map(k => (c.t[k] ? `<span class="s-${k}" style="flex:${c.t[k]}"></span>` : "")).join("")}</div></div>
    <span class="col-x${c.key === state.today ? " now" : ""}">${esc(c.x)}</span></div>`).join("")}</div>`;
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
  const s = state.admin.school, ins = state.insights;
  const ranges = [["7", "7 days"], ["30", "30 days"], ["all", "All time"]];
  const top = `${head("Insights", "Here's what students are saying", "These are the ratings and comments from your students. We set aside anything that looks like a script or a bot, so you can trust the numbers.",
    `<button class="icon-btn outlined" data-act="export-ins" aria-label="Download ratings as a spreadsheet" title="Download CSV">${icon("copy")}</button><button class="icon-btn outlined" data-act="refresh-ins" aria-label="Refresh">${icon("refresh")}</button>`)}
    <div class="seg narrow" role="group" aria-label="Time range">${ranges.map(([k, l]) => `<button data-act="range" data-range="${k}" aria-pressed="${state.range === k}">${l}</button>`).join("")}</div>`;
  if (!ins || ins.range !== state.range) { loadInsights(); return top + skeleton(4, "bento"); }
  if (ins.error) return top + errorBox(ins.error, "refresh-ins");
  const st = ins.data.stats, ideas = ins.data.ideas, wasteLog = ins.data.waste_log;
  if (!st.total.total) {
    return `${top}<div class="empty big">
      <p><strong>${state.range === "all" ? "Nobody has rated anything yet." : "There are no ratings in this time range."}</strong><br>Once you put the QR poster up where students line up, ratings will start showing here. It only takes them one scan and one tap.</p>
      <div class="row-btns center"><button class="btn primary" data-act="poster-open" data-kind="letter">${icon("qr")}Print the QR poster</button>
      <button class="btn secondary" data-act="copy" data-text="${esc(location.origin + "/?join=" + s.code)}" data-label="Invite link">${icon("link")}Copy invite link</button></div>
      <p class="big-code">${esc(s.code)}</p></div>
      ${ideas.length ? ideasCard(ideas) : ""}${wasteTile(st, wasteLog)}`;
  }
  const dishes = st.dishes, cuisines = Object.entries(st.byCuisine).sort((a, b) => pct(b[1]) - pct(a[1]) || b[1].total - a[1].total);
  const long = D.span(ins.from, ins.to) > 31;
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

      ${wasteTile(st, wasteLog)}

      <section class="tile wide"><div class="card-head"><h2>Ratings by ${long ? "week" : "day"}</h2>${legend}</div>${dailyChart(st, ins.from, ins.to)}</section>

      <section class="tile half"><div class="card-head"><h2>Make more of these</h2><span class="muted small">Most liked</span></div>${rankList(st.loved, "good")}</section>
      <section class="tile half"><div class="card-head"><h2>Fix or drop these</h2><span class="muted small">Most disliked</span></div>${rankList(st.needs, "bad")}</section>

      ${gradeTile(st)}

      <section class="tile half"><div class="card-head"><h2>Breakfast, snack and lunch</h2></div>
        <ul class="hbars">${MEALS.map(m => { const tt = st.byMeal[m] || { good: 0, mid: 0, bad: 0, total: 0 }; return `<li><div class="hbar-top"><span>${mealName(m)}</span><span>${tt.total ? `<strong>${pct(tt)}%</strong> liked · ${tt.total}` : "No ratings"}</span></div>${stackBar(tt, mealName(m))}</li>`; }).join("")}</ul></section>
      <section class="tile half"><div class="card-head"><h2>Favorite cuisines</h2></div>
        <ul class="hbars">${cuisines.map(([c, tt]) => `<li><div class="hbar-top"><span>${esc(cuisineName(c))}</span><span><strong>${pct(tt)}%</strong> liked · ${tt.total}</span></div>${stackBar(tt, c)}</li>`).join("")}</ul></section>

      <section class="tile wide"><div class="card-head"><h2>What students said</h2><span class="muted small">${plural(st.comments.length, "comment")}</span></div>
        ${st.comments.length ? `<ul class="feed">${st.comments.slice(0, 40).map(c => `<li>
          <span class="pill v-${c.vote}">${icon(rateIcon(c.vote))}${t("rate." + c.vote)}</span>
          <div class="feed-main"><p class="feed-q">“${esc(c.comment)}”</p><p class="feed-m"><strong>${esc(c.name)}</strong> · ${mealName(c.meal)} · ${shortDay(c.date)}</p></div>
          <div class="feed-act"><button class="btn ghost xs" data-act="reply-dish" data-date="${c.date}" data-id="${c.item_id}" data-name="${esc(c.name)}" data-reply="" data-to="${esc(c.comment)}">${icon("megaphone")}Reply</button>
          <button class="btn ghost xs" data-act="hide-comment" data-date="${c.date}" data-id="${c.item_id}" data-cid="${c.cid}">${icon("eyeOff")}Hide</button></div>
        </li>`).join("")}</ul>` : '<p class="muted small">No written comments in this period.</p>'}</section>

      ${ideas.length ? `<div class="tile wide flush">${ideasCard(ideas)}</div>` : ""}

      <section class="tile wide"><div class="card-head"><h2>Every dish</h2><span class="muted small">${plural(dishes.length, "dish", "dishes")}</span></div>
        <ul class="hbars">${[...dishes].sort((a, b) => b.t.total - a.t.total || pct(b.t) - pct(a.t)).map(d =>
          `<li><div class="hbar-top"><span>${esc(d.name)} <span class="muted">· ${d.meals.map(mealName).join(" & ")}</span> ${conf(d)}</span><span><strong>${pct(d.t)}%</strong> liked · ${d.t.total}</span></div>${stackBar(d.t, d.name)}</li>`).join("")}</ul></section>
    </div>`;
}

function wasteTile(st, log) {
  const max = Math.max(1, ...Object.values(st.waste.byDate), ...log.map(l => l.pounds));
  const recent = [...log].reverse();
  return `<section class="tile waste">
    <p class="tile-k">${icon("leaf")}Food thrown away</p>
    <p class="tile-big">${st.waste.days ? `${st.waste.pounds}<small> lb</small>` : "—"}</p>
    <p class="tile-s">${st.waste.days ? `across ${plural(st.waste.days, "logged day")}${st.waste.days ? ` · about ${Math.round((st.waste.pounds / st.waste.days) * 10) / 10} lb a day` : ""}` : "Weigh the trash once a day to see if ratings match what's wasted."}</p>
    ${recent.length ? `<div class="spark" role="img" aria-label="Pounds thrown away, last ${recent.length} logged days">${recent.map(l => `<span style="height:${Math.max(8, (100 * l.pounds) / max)}%" title="${shortDay(l.date)}: ${l.pounds} lb"></span>`).join("")}</div>` : ""}
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
  return `<section class="tile wide"><div class="card-head"><h2>${icon("grad")}By grade</h2><span class="muted small">Shown for groups of 5 or more students</span></div>
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
  range(el) { state.range = el.dataset.range; render(); document.querySelector(`[data-act="range"][data-range="${state.range}"]`)?.focus(); },
  "export-ins"() {
    const st = state.insights && state.insights.stats;
    if (!st || !st.dishes) { toast("Nothing to export yet", true); return; }
    const cell = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Dish", "Meals", "Good", "Mid", "Bad", "Ratings", "Percent good"], ...st.dishes.map(d => [d.name, d.meals.join(" & "), d.t.good, d.t.mid, d.t.bad, d.t.total, pct(d.t)])];
    const url = URL.createObjectURL(new Blob([rows.map(r => r.map(cell).join(",")).join("
")], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${school().name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-ratings-${state.range || "7d"}.csv` });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast("Spreadsheet downloaded");
  },
  "refresh-ins"() { state.insights = null; render(); document.querySelector('[data-act="refresh-ins"]')?.focus(); },
  "reply-dish"(el) {
    const to = el.dataset.to || "";
    openSheet(`<form class="sheet-form" data-form="reply-dish" data-date="${el.dataset.date}" data-id="${el.dataset.id}" data-to="${esc(to)}">
      <h2 id="sheet-title">Reply on “${esc(el.dataset.name)}”</h2>
      ${to ? `<blockquote class="replying">${icon("megaphone")}<span><small>Replying to</small>“${esc(to)}”</span></blockquote>` : ""}
      <p class="muted">Students see your note on the dish${to ? ", with the comment it answers" : ""}. Say what you're changing.</p>
      <label class="label" for="reply-in">Your note</label>
      <input class="input" id="reply-in" maxlength="${REPLY_MAX}" value="${esc(el.dataset.reply)}" placeholder="e.g. The oven was down. Fixed for Thursday.">
      <div class="modal-btns"><button type="button" class="btn secondary" data-act="sheet-close">Cancel</button><button class="btn primary" type="submit">Post reply</button></div>
    </form>`);
    $("#reply-in")?.focus();
  },
  async "hide-comment"(el) {
    try {
      await api("POST", "votes/hide", { school: school().id, date: el.dataset.date, item_id: el.dataset.id, cid: el.dataset.cid });
      state.insights = null; render(); toast("Comment hidden. The rating still counts.");
    } catch (e) { toast(e.message, true); }
  },
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
  if (f.dataset.form === "reply-dish") {
    const text = $("#reply-in").value.trim();
    closeSheet();
    try {
      await api("POST", "replies", { school: school().id, date: f.dataset.date, item_id: f.dataset.id, text, ...(f.dataset.to ? { to: f.dataset.to } : {}) });
      state.insights = null; state.aWeeks = {}; render(); toast(text ? "Reply posted" : "Reply removed");
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
