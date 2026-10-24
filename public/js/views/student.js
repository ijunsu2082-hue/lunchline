// The student (and parent) app: left rail, banner carousel, day chips, a grid of
// dish cards with round Good / Mid / Bad buttons, and a detail sheet per dish.
import { L, $, $$, esc, cap, plural, listJoin, LS, D, shortDay, zoned, studentHome, RATE_DAYS, reEsc, reducedMotion, foodTile } from "../util.js";
import { state, school, profile, ALLERGENS, MEALS, RATINGS, COMMENT_MAX, dayItems } from "../state.js";
import { api, enqueue, ApiError } from "../api.js";
import { icon, rateIcon, mark } from "../icons.js";
import { t, LANGS, chooseLang, setLang } from "../i18n.js";
import { render, toast, registerActions, errorBox, skeleton, currentTab, go, openSheet, closeSheet, sheetEl, askConfirm, hooks } from "../ui.js";
import { leaveToWelcome, setMode } from "../session.js";
import { loadIdeas } from "./ideas.js";

// ---------- allergy + preference matching ----------
const terms = s => String(s || "").toLowerCase().split(/[,;/\n]+/).map(x => x.trim()).filter(x => x.length >= 2);
const textHas = (hay, term) => new RegExp(`(^|[^a-z])${reEsc(term)}`, "i").test(hay || "");

export function allergyHits(item, p) {
  const contains = [], may = [];
  for (const a of p.allergies || []) {
    if (item.allergens.includes(a)) contains.push(t("allergen." + a));
    else if (item.may.includes(a)) may.push(t("allergen." + a));
  }
  const hayC = [item.name, item.desc, item.ingredients, item.allergens_other].join(" ");
  for (const term of terms(p.allergyOther)) {
    if (textHas(hayC, term)) contains.push(cap(term));
    else if (textHas(item.may_other, term)) may.push(cap(term));
  }
  return { contains, may };
}
function pickedFor(item, p, hits) {
  if (hits.contains.length || hits.may.length) return false;
  if (item.cuisine && (p.cuisines || []).includes(item.cuisine)) return true;
  return terms(p.cuisineOther).some(x => textHas([item.name, item.desc, item.cuisine_other].join(" "), x));
}
export const cuisineLabel = it => (it.cuisine === "other" ? it.cuisine_other || "" : it.cuisine ? t("cuisine." + it.cuisine) : "");

const readOnly = () => state.mode === "parent";
export const rateable = date => date <= state.today && date >= D.add(state.today, -(RATE_DAYS - 1));
const rateUntil = date => D.add(date, RATE_DAYS - 1);
const mealName = m => t("meal." + (MEALS.includes(m) ? m : "lunch"));

// ---------- data ----------
function initStudentWeek() {
  const d = studentHome(state.today);
  state.week = D.monday(d);
  state.day = d;
  state.meal = null;
}

export async function loadWeek(mon) {
  const key = "w" + mon;
  if (state.loading.has(key)) return;
  state.loading.add(key);
  const s = school(), to = D.add(mon, 4);
  let reload = false;
  try {
    const wantVotes = state.mode === "student";
    const [m, v] = await Promise.allSettled([
      api("GET", `menu?school=${s.id}&from=${mon}&to=${to}`),
      wantVotes ? api("GET", `votes?school=${s.id}&from=${mon}&to=${to}`, undefined, { student: s.id }) : Promise.resolve({ votes: [] }),
    ]);
    if (m.status === "rejected") throw m.reason;
    if (!["student", "parent"].includes(state.mode) || school().id !== s.id) return;
    state.weeks[mon] = { days: m.value.days };
    if (v.status === "fulfilled") v.value.votes.forEach(r => { state.mine[r.date + "|" + r.item_id] = r; });
    if (m.value.today !== state.today) {
      state.today = m.value.today; // the server's clock (in the school's time zone) decides what "today" is
      if (!state.touched) { const before = state.week; initStudentWeek(); reload = state.week !== before; }
    }
  } catch (e) {
    if (e.status === 404 && /school/i.test(e.message)) { state.loading.delete(key); schoolGone(); return; }
    state.weeks[mon] = { error: e.message };
  } finally {
    state.loading.delete(key);
  }
  if (reload) { loadWeek(state.week); return; }
  if (["student", "parent"].includes(state.mode) && !state.ob && currentTab() === "menu" && state.week === mon) render();
}

function schoolGone() {
  if (state.mode === "parent") { LS.del("ll_parent"); state.parent = null; leaveToWelcome(); return; }
  LS.del("ll_student"); state.student = null;
  if (state.admin) { setMode("admin"); toast("That school no longer exists.", true); }
  else leaveToWelcome();
}

function defaultMeal(day) {
  if (!day) return "lunch";
  let m = "lunch";
  if (state.day === state.today) {
    const z = zoned(school().tz);
    if (z.hour * 60 + z.minute < 9 * 60 + 30) m = "breakfast";
  }
  if (!(day[m] || []).length) m = MEALS.find(k => (day[k] || []).length) || "lunch";
  return m;
}

// ---------- shell: rail + stage ----------
export function studentShell(content) {
  const tab = currentTab(), s = school();
  const meal = state.meal || "lunch";
  const parent = readOnly();
  const item = (cls, attrs, label, ic, on) =>
    `<a class="rail-i ${cls}${on ? " on" : ""}" ${attrs}${on ? ' aria-current="page"' : ""}><span class="rail-t">${label}</span>${ic || ""}</a>`;
  const rail = `<nav class="rail" aria-label="${esc(t("nav.sections"))}">
    <a class="rail-mark" href="#menu" aria-label="LunchLine">${mark(30)}</a>
    <div class="rail-list">
      ${MEALS.map(m => item("", `href="#menu" data-act="rail-meal" data-meal="${m}"`, esc(t("nav." + m)), "", tab === "menu" && meal === m)).join("\n      ")}
      ${parent ? "" : item("", `href="#ideas"`, esc(t("nav.ideas")), "", tab === "ideas")}
    </div>
    ${parent
      ? `<button class="rail-me" data-act="parent-leave" aria-label="${esc(t("me.leave", { school: s.name }))}">${icon("logout")}</button>`
      : `<a class="rail-me${tab === "me" ? " on" : ""}" href="#me" aria-label="${esc(t("nav.me"))}"${tab === "me" ? ' aria-current="page"' : ""}>${icon("user")}</a>`}
  </nav>`;
  const other = LANGS.find(([k]) => k !== (document.documentElement.lang || "en")) || LANGS[0];
  const top = `<header class="st-top">
    <div class="st-id"><p class="st-k">${esc(parent ? t("parent.badge") : t("st.hello"))}</p><p class="st-school" title="${esc(s.name)}">${esc(s.name)}</p></div>
    <button class="chip-btn" data-act="lang" data-lang="${other[0]}" lang="${other[0]}" aria-label="${esc(other[1])}">${icon("globe")}<span>${other[0].toUpperCase()}</span></button>
  </header>`;
  return `<div class="app student">${rail}<div class="stage">${top}<div class="stage-in">${content}</div></div></div>`;
}

// ---------- menu ----------
function weekLabel(mon) {
  const cur = D.monday(state.today), end = D.add(mon, 4);
  const same = D.fmt(mon, { month: "short" }) === D.fmt(end, { month: "short" });
  const range = `${D.fmt(mon, { month: "short", day: "numeric" })} – ${D.fmt(end, same ? { day: "numeric" } : { month: "short", day: "numeric" })}`;
  const name = mon === cur ? t("week.this") : mon === D.add(cur, 7) ? t("week.next") : mon === D.add(cur, -7) ? t("week.last") : "";
  return name ? `<strong>${esc(name)}</strong><span>${range}</span>` : `<strong>${range}</strong>`;
}

export function dayChips(mon, sel, days, prefix = "s-") {
  return `<div class="week-bar">
    <button class="icon-btn" data-act="${prefix}week" data-dir="-1" aria-label="${esc(t("week.prev"))}">${icon("chevL")}</button>
    <p class="week-label" aria-live="polite">${weekLabel(mon)}</p>
    <button class="icon-btn" data-act="${prefix}week" data-dir="1" aria-label="${esc(t("week.nextA"))}">${icon("chevR")}</button>
  </div>
  <div class="days" role="group" aria-label="${esc(t("week.choose"))}">
    ${D.weekdays(mon).map(d => {
      const n = days && days[d] ? dayItems(days[d]).length : 0;
      const isT = d === state.today, canRate = prefix === "s-" && !readOnly() && n > 0 && rateable(d);
      return `<button class="day${isT ? " is-today" : ""}${canRate ? " can-rate" : ""}" data-act="${prefix}day" data-date="${d}" aria-pressed="${d === sel}"
        aria-label="${esc(D.fmt(d, { weekday: "long", month: "long", day: "numeric" }))}${isT ? ", " + esc(t("week.today")) : ""}${days ? `, ${n}` : ""}">
        <span class="day-w">${esc(isT ? t("week.today") : D.fmt(d, { weekday: "short" }))}</span><span class="day-n">${D.fmt(d, { day: "numeric" })}</span>
        <span class="day-dot${n ? "" : " off"}"></span></button>`;
    }).join("")}
  </div>`;
}

function lastRateableDay() {
  for (let i = 0; i < RATE_DAYS; i++) {
    const d = D.add(state.today, -i), wk = state.weeks[D.monday(d)];
    const day = wk && wk.days && wk.days[d];
    if (dayItems(day).length) return d;
  }
  return null;
}

// ----- banner carousel -----
function rateBanner(day, date, items) {
  if (!items.length || readOnly()) return "";
  const first = items.find(i => i.photo) || items[0];
  const photo = first.photo ? `<img class="bn-img" src="${esc(first.photo)}" alt="" decoding="async">` : "";
  if (rateable(date)) {
    const done = items.filter(it => state.mine[date + "|" + it.id]).length, all = done === items.length;
    return `<article class="banner b-rate" id="bn-rate">
      <div class="bn-text"><p class="bn-big">${esc(t(all ? "bn.thanks" : "bn.rate"))}</p>
        <p class="bn-title">${esc(date === state.today ? t("bn.todaysMeal", { meal: L.lang === "en" ? mealName(state.meal || "lunch").toLowerCase() : mealName(state.meal || "lunch") }) : t("menu.dayMenu", { day: D.fmt(date, { weekday: "long" }) }))}</p>
        <p class="bn-sub">${esc(all ? t("bn.canChange", { day: shortDay(rateUntil(date)) }) : t("bn.progress", { done, total: items.length }))}</p>
        <span class="bn-bar" aria-hidden="true"><span style="width:${(100 * done) / items.length}%"></span></span></div>
      ${photo}</article>`;
  }
  const target = lastRateableDay();
  if (date > state.today) {
    return `<article class="banner b-soon" id="bn-rate"><div class="bn-text"><p class="bn-big">${esc(t("bn.soon"))}</p><p class="bn-title">${esc(D.fmt(date, { weekday: "long" }))}</p><p class="bn-sub">${esc(t("bn.soonSub"))}</p></div>${photo}</article>`;
  }
  return `<article class="banner b-soon" id="bn-rate"><div class="bn-text"><p class="bn-big">${esc(t("bn.closed"))}</p><p class="bn-sub">${esc(t("bn.closedSub", { n: RATE_DAYS }))}</p>${target && target !== date ? `<button class="btn on-brand sm" data-act="s-goto" data-date="${target}">${esc(t("bn.rateOther"))}${icon("arrowR")}</button>` : ""}</div>${photo}</article>`;
}

function replyBanner() {
  let best = null;
  for (const wk of Object.values(state.weeks)) {
    for (const day of Object.values(wk.days || {})) {
      for (const it of dayItems(day)) {
        if (it.reply && (!best || day.date > best.date)) best = { date: day.date, it };
      }
    }
  }
  if (!best) return "";
  return `<article class="banner b-reply"><div class="bn-text"><p class="bn-big">${esc(t("bn.heard"))}</p><p class="bn-title">${esc(best.it.name)}</p><p class="bn-sub">“${esc(best.it.reply)}”</p></div>${best.it.photo ? `<img class="bn-img" src="${esc(best.it.photo)}" alt="" decoding="async">` : `<span class="bn-ico">${icon("megaphone")}</span>`}</article>`;
}

function ideaBanner() {
  const top = Array.isArray(state.ideas) && state.ideas[0];
  if (!top || readOnly()) return "";
  return `<a class="banner b-idea" href="#ideas"><div class="bn-text"><p class="bn-big">${esc(t("bn.idea"))}</p><p class="bn-title">${esc(top.text)}</p><p class="bn-sub">${esc(t("bn.ideaSub", { n: top.count }))}</p></div><span class="bn-ico">${icon("lightbulb")}</span></a>`;
}

function allergyBanner(items) {
  const p = profile();
  if (!(p.allergies || []).length && !terms(p.allergyOther).length) return "";
  const n = items.filter(i => { const h = allergyHits(i, p); return h.contains.length || h.may.length; }).length;
  return `<article class="banner b-allergy"><div class="bn-text"><p class="bn-big">${esc(t("bn.allergy"))}</p><p class="bn-title">${esc(n ? t("bn.allergyN", { n }) : t("bn.allergyNone"))}</p><p class="bn-sub">${esc(t("bn.allergySub"))}</p></div><span class="bn-ico">${icon(n ? "alert" : "shield")}</span></article>`;
}

function carousel(day, date) {
  const items = dayItems(day);
  const meal = state.meal && day ? day[state.meal] || [] : items;
  const parts = [rateBanner(day, date, meal), replyBanner(), ideaBanner(), allergyBanner(day ? (state.meal ? day[state.meal] || [] : items) : [])].filter(Boolean);
  if (!parts.length) return "";
  return `<section class="carousel" aria-label="${esc(t("bn.label"))}">
    <div class="banners" id="banners" tabindex="0">${parts.join("")}</div>
    ${parts.length > 1 ? `<div class="dots" aria-hidden="true">${parts.map((_, i) => `<span class="${i === 0 ? "on" : ""}"></span>`).join("")}</div>` : ""}
  </section>`;
}

// Swap in fresh banners without re-rendering the page (keeps the cards, and their animation, intact).
hooks.ideasLoaded = () => {
  const old = $(".carousel");
  if (!old || state.mode === "admin") return;
  const wk = state.weeks[state.week], day = wk && wk.days && wk.days[state.day];
  const html = carousel(day, state.day);
  if (!html) return;
  const tpl = document.createElement("template"); tpl.innerHTML = html.trim();
  old.replaceWith(tpl.content.firstElementChild);
  bindCarousel();
};

export function bindCarousel() {
  const el = $("#banners");
  if (!el) return;
  const dots = $$(".dots span");
  el.addEventListener("scroll", () => {
    const w = el.firstElementChild?.getBoundingClientRect().width || 1;
    const i = Math.round(el.scrollLeft / (w + 12));
    dots.forEach((d, k) => d.classList.toggle("on", k === i));
  }, { passive: true });
}

export function viewMenu() {
  const p = profile();
  if (!state.week) initStudentWeek();
  const wk = state.weeks[state.week];
  const date = state.day;
  const isToday = date === state.today;
  const title = isToday ? t("menu.today") : t("menu.dayMenu", { day: D.fmt(date, { weekday: "long" }) });
  let body;
  if (!wk) { loadWeek(state.week); body = skeleton(4, "grid"); }
  else if (wk.error) body = errorBox(wk.error, "retry-week");
  else {
    const day = wk.days[date];
    if (!state.meal) state.meal = defaultMeal(day);
    const items = day ? day[state.meal] || [] : [];
    const flagged = [...(p.allergies || []).map(a => t("allergen." + a)), ...terms(p.allergyOther).map(cap)];
    if (!Array.isArray(state.ideas) && !state.loading.has("ideas") && !readOnly()) loadIdeas();
    body = `${carousel(day, date)}
      <div class="meal-head"><h2 class="meal-t">${esc(mealName(state.meal))}</h2><span class="meal-n">${esc(plural(items.length, t("menu.dish"), t("menu.dishes")))}</span></div>
      ${items.length ? `<div class="dish-grid">${items.map(it => dishCard(it, date)).join("")}</div>`
        : `<div class="empty"><p>${esc(day ? t("menu.none", { meal: mealName(state.meal).toLowerCase(), day: D.fmt(date, { weekday: "long" }) }) : t("menu.notPosted", { day: D.fmt(date, { weekday: "long" }) }))}</p></div>`}
      <div class="notice">${icon("info")}<p><strong>${esc(t("notice.guide"))}</strong>${flagged.length ? " " + esc(t("notice.flag", { list: listJoin(flagged) })) : ""}</p></div>`;
  }
  return `<header class="page-head"><div class="page-head-main"><p class="eyebrow">${esc(D.fmt(date, { weekday: "long", month: "long", day: "numeric" }))}</p><h1>${esc(title)}</h1></div></header>
    ${dayChips(state.week, date, wk && wk.days)}
    ${body}`;
}

// ---------- dish card ----------
function dishFlags(item) {
  const p = profile(), hits = allergyHits(item, p);
  const warn = hits.contains.length > 0, caution = !warn && hits.may.length > 0;
  return { hits, warn, caution, picked: pickedFor(item, p, hits) };
}

function askedFor(item) {
  if (!Array.isArray(state.ideas)) return null;
  return state.ideas.find(i => i.dish && i.dish.item_id === item.id && i.dish.date === state.day) || null;
}

function dishCard(item, date) {
  const f = dishFlags(item), p = profile();
  const id = item.id;
  const asked = askedFor(item);
  const sub = [item.calories ? t("dish.cal", { n: item.calories }) : "", ...item.diet.map(k => t("diet." + k))].filter(Boolean).join(" · ") || item.desc || cuisineLabel(item);
  const ribbon = f.warn ? `<span class="dc-flag danger">${icon("alert")}${esc(t("dish.hasShort", { a: listJoin(f.hits.contains).toLowerCase() }))}</span>`
    : f.caution ? `<span class="dc-flag caution">${icon("alert")}${esc(t("dish.mayShort"))}</span>` : "";
  const badge = asked ? `<span class="dc-badge">${icon("lightbulb")}${esc(asked.voted ? t("dish.asked") : t("dish.askedBy", { n: asked.count }))}</span>`
    : f.picked ? `<span class="dc-badge">${icon("heart")}${esc(item.cuisine && (p.cuisines || []).includes(item.cuisine) ? t("dish.youLike", { c: cuisineLabel(item) }) : t("dish.picked"))}</span>` : "";
  return `<article class="dc${f.warn ? " is-warn" : f.caution ? " is-caution" : ""}" id="dish-${id}" aria-labelledby="dn-${id}">
    <button type="button" class="dc-open" data-act="dish-open" data-id="${id}">
      <span class="dc-photo">${item.photo ? `<img src="${esc(item.photo)}" alt="" loading="lazy" decoding="async">` : foodTile(item.name)}${ribbon}${badge}</span>
      <span class="dc-body"><span class="dc-name" id="dn-${id}">${esc(item.name)}</span><span class="dc-sub">${esc(sub)}</span></span>
    </button>
    <div class="dc-foot" id="foot-${id}">${footBlock(item, date)}</div>
  </article>`;
}

function footBlock(item, date) {
  const id = item.id, rec = state.mine[date + "|" + id];
  if (readOnly()) return `<span class="dc-note">${icon("eye")}${esc(t("parent.viewOnly"))}</span>`;
  if (date > state.today) return `<span class="dc-note">${icon("clock")}${esc(t("rate.opens", { day: D.fmt(date, { weekday: "short" }) }))}</span>`;
  if (!rateable(date)) {
    return rec ? `<span class="dc-note">${icon(rateIcon(rec.vote))}${esc(t("rate.youRatedShort", { r: t("rate." + rec.vote) }))}</span>` : `<span class="dc-note">${icon("lock")}${esc(t("rate.closedShort"))}</span>`;
  }
  const v = rec?.vote;
  return `<div class="rb-row" role="group" aria-label="${esc(t("rate.for", { name: item.name }))}">
    ${RATINGS.map(k => `<button type="button" class="rb r-${k}${v === k ? " on" : ""}" data-act="rate" data-id="${id}" data-vote="${k}" aria-pressed="${v === k}" aria-label="${esc(t("rate." + k))}">${icon(rateIcon(k))}</button>`).join("")}
  </div>`;
}

// ---------- dish sheet ----------
function sheetRate(item, date) {
  const id = item.id, rec = state.mine[date + "|" + id];
  if (readOnly()) return "";
  if (date > state.today) return `<p class="rate-note">${icon("clock")}${esc(t("rate.after", { day: shortDay(date) }))}</p>`;
  if (!rateable(date)) {
    return rec ? `<p class="rate-note">${icon(rateIcon(rec.vote))}${esc(t("rate.youRated", { r: "" }))}<strong class="v-${rec.vote}">${esc(t("rate." + rec.vote))}</strong></p>` : `<p class="rate-note">${icon("lock")}${esc(t("rate.closed"))}</p>`;
  }
  const v = rec?.vote;
  return `<p class="rate-q" id="rq-${id}">${esc(v ? t("rate.change") : t("rate.q"))}</p>
    <div class="rate-btns" role="group" aria-labelledby="rq-${id}">
      ${RATINGS.map(k => `<button class="rate-btn r-${k}" data-act="rate" data-id="${id}" data-vote="${k}" aria-pressed="${v === k}">${icon(rateIcon(k))}<span>${esc(t("rate." + k))}</span></button>`).join("")}
    </div>
    ${v ? commentBlock(id, rec) : ""}`;
}

function commentBlock(id, rec) {
  if (state.openComment.has(id)) {
    const val = state.cDraft[id] ?? rec.comment ?? "";
    return `<div class="comment">
      <label class="label" for="c-${id}">${esc(rec.vote === "good" ? t("dish.cLabelGood") : t("dish.cLabel"))} <span class="muted">${esc(t("dish.optional"))}</span></label>
      <textarea class="input" id="c-${id}" data-comment="${id}" maxlength="${COMMENT_MAX}" rows="3" placeholder="${esc(rec.vote === "good" ? t("dish.cPhGood") : t("dish.cPh"))}">${esc(val)}</textarea>
      <div class="comment-foot"><span class="count" id="cc-${id}">${val.length}/${COMMENT_MAX}</span>
        <button class="btn ghost sm" data-act="c-cancel" data-id="${id}">${esc(t("dish.notNow"))}</button>
        <button class="btn primary sm" data-act="c-send" data-id="${id}">${esc(t("dish.send"))}</button></div>
    </div>`;
  }
  if (rec.comment) return `<div class="sent"><p>${icon("message")}<span>“${esc(rec.comment)}”</span></p><button class="link" data-act="c-open" data-id="${id}">${esc(t("common.edit"))}</button></div>`;
  return `<button class="link add-comment" data-act="c-open" data-id="${id}">${icon("message")}${esc(t("dish.addComment"))}</button>`;
}

function findItem(id) {
  for (const wk of Object.values(state.weeks)) {
    const day = wk.days && wk.days[state.day];
    const it = dayItems(day).find(i => i.id === id);
    if (it) return it;
  }
  return null;
}

const NUTRIENTS = [["protein", "g"], ["fat", "g"], ["sat_fat", "g"], ["carbs", "g"], ["fiber", "g"], ["sodium", "mg"]];
function nutritionPanel(item) {
  const has = NUTRIENTS.filter(([k]) => item[k] != null);
  if (!has.length && item.calories == null) return "";
  const cell = (label, v, unit) => `<div><dt>${esc(label)}</dt><dd>${v}<small>${unit}</small></dd></div>`;
  return `<section class="nutri" aria-label="${esc(t("dish.nutrition"))}"><h3 class="mini-label">${esc(t("dish.nutrition"))}</h3>
    <dl class="nutri-grid">${item.calories != null ? cell(t("nut.calories"), item.calories, "") : ""}${has.map(([k, u]) => cell(t("nut." + k), item[k], " " + u)).join("")}</dl>
    <p class="fine">${icon("info")}${esc(t("dish.nutritionNote"))}</p></section>`;
}

function sheetHTML(item) {
  const p = profile(), f = dishFlags(item), date = state.day, id = item.id;
  const mine = new Set(p.allergies || []), other = terms(p.allergyOther);
  const chip = (label, hit) => `<li class="chip${hit ? " hit" : ""}">${hit ? icon("alert") : ""}${esc(label)}</li>`;
  const containsChips = [
    ...item.allergens.map(a => chip(t("allergen." + a), mine.has(a))),
    ...terms(item.allergens_other).map(x => chip(cap(x), other.some(o => textHas(x, o)))),
  ];
  const mayList = item.may.map(a => t("allergen." + a));
  const cl = cuisineLabel(item);
  const asked = askedFor(item);
  return `<div class="ds">
    <div class="ds-photo">${item.photo ? `<img src="${esc(item.photo)}" alt="${esc(item.name)}" decoding="async">` : foodTile(item.name)}
      <button type="button" class="ds-x" data-act="sheet-close" aria-label="${esc(t("common.close"))}">${icon("x")}</button></div>
    <div class="ds-body">
      <p class="ds-meta">${[mealName(date && findMeal(item)), item.calories ? t("dish.cal", { n: item.calories }) : "", ...item.diet.map(k => t("diet." + k))].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join("")}</p>
      <h2 class="ds-name" id="sheet-title">${esc(item.name)}</h2>
      ${item.desc ? `<p class="ds-desc">${esc(item.desc)}</p>` : ""}
      ${asked ? `<div class="alert info">${icon("lightbulb")}<p>${esc(t("dish.askedBy", { n: asked.count }))}</p></div>` : ""}
      ${item.reply ? `<div class="reply">${icon("megaphone")}<div><p class="reply-k">${esc(t("dish.reply"))}</p><p>${esc(item.reply)}</p></div></div>` : ""}
      ${f.warn ? `<div class="alert danger">${icon("alert")}<p><strong>${esc(t("dish.has", { a: listJoin(f.hits.contains).toLowerCase() }))}</strong> ${esc(t("dish.allergic"))}${f.hits.may.length ? " " + esc(t("dish.mayAlso", { a: listJoin(f.hits.may).toLowerCase() })) : ""}</p></div>` : ""}
      ${f.caution ? `<div class="alert caution">${icon("alert")}<p><strong>${esc(t("dish.mayContain", { a: listJoin(f.hits.may).toLowerCase() }))}</strong> ${esc(t("dish.askStaff"))}</p></div>` : ""}
      ${readOnly() ? "" : `<div class="rate" id="sh-rate-${id}">${sheetRate(item, date)}</div>`}
      <div class="contains"><span class="mini-label">${esc(t("dish.contains"))}</span>${containsChips.length ? `<ul class="chips">${containsChips.join("")}</ul>` : `<span class="none">${esc(item.calories == null && /ask nutrition/i.test(item.may_other || "") ? t("dish.unknown") : t("dish.none"))}</span>`}</div>
      ${nutritionPanel(item)}
      <dl class="facts">
        <div><dt>${esc(t("dish.ingredients"))}</dt><dd>${item.ingredients ? esc(item.ingredients) : esc(t("dish.notListed"))}</dd></div>
        <div><dt>${esc(t("dish.mayLabel"))}</dt><dd>${mayList.length || item.may_other ? esc([listJoin(mayList), item.may_other].filter(Boolean).join(". ")) : esc(t("dish.noCross"))}</dd></div>
        ${cl ? `<div><dt>${esc(t("dish.cuisine"))}</dt><dd>${esc(cl)}</dd></div>` : ""}
      </dl>
      <p class="fine">${icon("info")}${esc(t("notice.guide"))}</p>
    </div></div>`;
}
const findMeal = item => { const day = Object.values(state.weeks).map(w => w.days?.[state.day]).find(Boolean); return (day && MEALS.find(m => (day[m] || []).some(i => i.id === item.id))) || "lunch"; };

function openDish(id) {
  const item = findItem(id);
  if (!item) return;
  state.dishOpen = id;
  openSheet(sheetHTML(item), { onClose: () => { state.dishOpen = null; } });
}

// ---------- rating ----------
function patchRate(id, focusSel) {
  const item = findItem(id);
  if (!item) return;
  const foot = $("#foot-" + id);
  if (foot) foot.innerHTML = footBlock(item, state.day);
  const box = $("#sh-rate-" + id);
  if (box) box.innerHTML = sheetRate(item, state.day);
  const wk = state.weeks[state.week], day = wk && wk.days && wk.days[state.day];
  const bn = $("#bn-rate");
  if (bn && day) {
    const items = (state.meal && day[state.meal]) || dayItems(day);
    const html = rateBanner(day, state.day, items);
    if (html) bn.outerHTML = html;
  }
  if (focusSel) (box || foot)?.querySelector(focusSel)?.focus();
}

const QUEUE_KEY = "ll_queue";
function queueRating(row) {
  const q = LS.get(QUEUE_KEY, []).filter(r => !(r.school === row.school && r.date === row.date && r.item_id === row.item_id));
  q.push(row); LS.set(QUEUE_KEY, q);
}
export async function flushQueue() {
  const q = LS.get(QUEUE_KEY, []);
  if (!q.length || (typeof navigator !== "undefined" && navigator.onLine === false)) return;
  const left = [];
  let sent = 0;
  for (const r of q) {
    try { await api("POST", "votes", r, { student: r.school }); sent++; }
    catch (e) { if (e.status === 0) left.push(r); /* a refused rating (window closed, dish gone) is dropped */ }
  }
  LS.set(QUEUE_KEY, left);
  if (sent) toast(t("offline.synced", { n: sent }));
}

async function rate(id, vote) {
  const date = state.day;
  if (!rateable(date) || readOnly()) return;
  const key = date + "|" + id, prev = state.mine[key];
  if (prev?.vote === vote) return;
  state.mine[key] = { ...(prev || {}), item_id: id, date, vote, comment: prev?.comment || "" };
  patchRate(id, `[data-vote="${vote}"]`);
  const btn = document.querySelector(`#foot-${id} .rb.r-${vote}`);
  if (btn && !reducedMotion()) { btn.classList.add("pop"); setTimeout(() => btn.classList.remove("pop"), 400); }
  const payload = { school: school().id, date, item_id: id, vote, comment: state.mine[key]?.comment || "" };
  try {
    const saved = await enqueue(id, () => api("POST", "votes", payload, { student: school().id }));
    if (state.mine[key]?.vote === vote) state.mine[key] = { ...state.mine[key], ...saved, comment: state.mine[key].comment };
    toast(prev ? t("rate.updated") : t("rate.sent"), false, prev ? null : { act: "dish-comment", label: t("dish.addCommentShort"), data: `data-id="${id}"` });
  } catch (e) {
    if (e.status === 0) {
      queueRating(payload);
      toast(t("offline.queued"));
      return;
    }
    if (state.mine[key]?.vote === vote) {
      if (prev) state.mine[key] = prev; else delete state.mine[key];
      patchRate(id);
    }
    toast(e.message, true);
    if (e.status === 403 || e.status === 404) { state.weeks = {}; state.touched = false; state.week = null; render(); }
  }
}

async function sendComment(id) {
  const key = state.day + "|" + id, rec = state.mine[key];
  if (!rec) return;
  const text = (state.cDraft[id] ?? rec.comment ?? "").trim().slice(0, COMMENT_MAX);
  const btn = $(`[data-act="c-send"][data-id="${id}"]`);
  if (btn) { btn.disabled = true; btn.textContent = t("common.sending"); }
  try {
    const saved = await enqueue(id, () => api("POST", "votes", {
      school: school().id, date: state.day, item_id: id, vote: state.mine[key].vote, comment: text,
    }, { student: school().id }));
    state.mine[key] = { ...state.mine[key], comment: saved.comment };
    state.openComment.delete(id); delete state.cDraft[id];
    patchRate(id, text ? '[data-act="c-open"]' : `[data-vote="${state.mine[key].vote}"]`);
    toast(text ? t("dish.commentSent") : t("dish.commentRemoved"));
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = t("dish.send"); }
    toast(e.message, true);
  }
}

// ---------- clicks ----------
registerActions({
  lang(el) { chooseLang(el.dataset.lang); setLang(el.dataset.lang); render(); },
  "rail-meal"(el, e) {
    e.preventDefault();
    state.meal = el.dataset.meal; state.openComment.clear();
    if (currentTab() === "menu") render(); else go("menu");
    window.scrollTo(0, 0);
  },
  "s-week"(el) {
    state.week = D.add(state.week, 7 * +el.dataset.dir);
    state.day = D.weekdays(state.week).includes(state.today) ? state.today : state.week;
    state.meal = null; state.touched = true; state.openComment.clear();
    render(); document.querySelector(`[data-act="s-week"][data-dir="${el.dataset.dir}"]`)?.focus();
  },
  "s-day"(el) {
    state.day = el.dataset.date; state.meal = null; state.touched = true; state.openComment.clear();
    render(); document.querySelector(`[data-act="s-day"][data-date="${state.day}"]`)?.focus();
  },
  "s-goto"(el) {
    state.day = el.dataset.date; state.week = D.monday(state.day); state.meal = null; state.touched = true; state.openComment.clear();
    render(); window.scrollTo(0, 0);
  },
  "retry-week"() { delete state.weeks[state.week]; render(); },
  "dish-open"(el) { openDish(el.dataset.id); },
  "dish-comment"(el) {
    const id = el.dataset.id;
    state.openComment.add(id);
    openDish(id);
    $(`#c-${id}`)?.focus();
  },
  "sheet-close"() { closeSheet(); },
  rate(el) { rate(el.dataset.id, el.dataset.vote); },
  "c-open"(el) { state.openComment.add(el.dataset.id); patchRate(el.dataset.id, "textarea"); },
  "c-cancel"(el) { state.openComment.delete(el.dataset.id); delete state.cDraft[el.dataset.id]; patchRate(el.dataset.id, `[data-act="c-open"]`); },
  "c-send"(el) { sendComment(el.dataset.id); },
  async "parent-leave"() {
    if (!(await askConfirm({ title: t("me.leaveTitle", { school: school().name }), body: t("parent.leaveBody"), ok: t("me.leaveOk") }))) return;
    LS.del("ll_parent"); state.parent = null; leaveToWelcome();
  },
});

export function onCommentInput(t2) {
  state.cDraft[t2.dataset.comment] = t2.value;
  const c = $("#cc-" + t2.dataset.comment);
  if (c) c.textContent = `${t2.value.length}/${COMMENT_MAX}`;
}

export function refreshDishSheet() {
  if (state.dishOpen && sheetEl().open) {
    const item = findItem(state.dishOpen);
    if (item) sheetEl().querySelector(".ds-body") && (sheetEl().innerHTML = sheetHTML(item));
  }
}
export { ApiError };
