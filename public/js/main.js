// LunchLine: boot, routing, rendering and the one click / input handler.
import { $, esc, normCode, LS, zoned } from "./util.js";
import { state, school, isStaff } from "./state.js";
import { api } from "./api.js";
import { icon } from "./icons.js";
import { t, setLang, preferredLang } from "./i18n.js";
import { applyTheme, resetTheme } from "./theme.js";
import {
  setRenderer, render, currentTab, bindSheet, getAction, focusTitle, toast, TABS, sheetEl,
} from "./ui.js";
import { startFlow, setMode, leaveToWelcome } from "./session.js";
import {
  renderOb, obSubmit, refreshCta, obError, searchSchools, syncGrade, enterAdmin, openLoginLink,
} from "./views/flows.js";
import { startWelcomeMotion, toggleDemoPause } from "./views/welcome.js";
import { studentShell, viewMenu, bindCarousel, onCommentInput, flushQueue, loadWeek } from "./views/student.js";
import { viewIdeasStudent, viewIdeasAdmin, onIdeaInput, submitIdeaForm } from "./views/ideas.js";
import { viewMe } from "./views/me.js";
import { staffShell, viewInsights, submitStaffForm } from "./views/staff.js";
import { viewKitchen, saveEditor, uploadPhoto, onEditorInput } from "./views/menu-editor.js";
import { viewSchool, onColorInput, submitSettingsForm } from "./views/settings.js";
import { viewReports } from "./views/reports.js";
import { submitPresetForm } from "./views/presets.js";
import "./views/qr.js";

const main = $("#main");

const VIEWS = {
  student: { menu: viewMenu, ideas: viewIdeasStudent, me: viewMe },
  parent: { menu: viewMenu },
  admin: { insights: viewInsights, kitchen: viewKitchen, ideas: viewIdeasAdmin, reports: viewReports, school: viewSchool },
};

// ---------- render ----------
function render_(focus) {
  try { renderNow(focus); }
  catch (e) {
    // Never leave a frozen page: say what happened and offer a way out.
    console.error(e);
    document.body.classList.remove("is-ob");
    main.className = "";
    main.innerHTML = `<div class="crash"><h1>Something went wrong</h1><p>Sorry about that. Your ratings and settings are safe.</p>
      <div class="row-btns center"><button class="btn primary" data-act="crash-reload">Reload</button><button class="btn secondary" data-act="crash-reset">Start over</button></div></div>`;
  }
}

let wasSkeleton = false;
function renderNow(focus) {
  const swipe = state.swipeDir; state.swipeDir = 0;
  // the render after a loading skeleton is the one where the real cards arrive: animate them in
  const listAnim = !!state.animate || (!focus && wasSkeleton); state.animate = false;
  // Staff screens are English; students and parents get their language.
  setLang(state.mode === "admin" ? "en" : preferredLang());
  document.body.classList.toggle("is-ob", !!state.ob);
  document.body.dataset.mode = state.ob ? "flow" : state.mode || "welcome";

  if (state.ob) {
    main.className = "";
    main.innerHTML = renderOb();
    if (state.ob.steps[state.ob.i] === "welcome") startWelcomeMotion();
    if (focus) { focusTitle(); window.scrollTo(0, 0); }
    return;
  }
  if (!state.mode) return;

  const tab = currentTab();
  if (state.mode === "admin") {
    const s = state.admin.school;
    applyTheme(tab === "school" && state.draftColor ? state.draftColor : s.theme?.color);
  }
  if (!state.today) state.today = zoned(school().tz).date; // until the server's clock says otherwise
  const keepY = focus ? 0 : window.scrollY; // an edit refreshes the page in place; only navigating jumps to the top
  const body = VIEWS[state.mode][tab]();
  wasSkeleton = body.includes('aria-busy="true"');
  main.className = state.mode === "admin" ? "wide" : "";
  main.innerHTML = state.mode === "admin" ? staffShell(body) : studentShell(body);
  // Motion: a new page rises in; a changed list (meal, day, range) refreshes just its cards;
  // a swipe slides the page the way your thumb moved.
  const inner = main.querySelector(".stage-in");
  if (inner) {
    if (swipe) { inner.style.setProperty("--dir", String(swipe)); inner.classList.add("swipe-in", "list-in"); }
    else if (focus) inner.classList.add("nav-in");
    else if (listAnim) inner.classList.add("list-in");
  }
  if (state.mode !== "admin") bindCarousel();
  if (focus) { focusTitle(); window.scrollTo(0, 0); }
  else if (keepY) window.scrollTo(0, keepY);
}
setRenderer(render_);

// ---------- clicks ----------
const ANIMATED = new Set(["rail-meal", "s-day", "s-week", "a-day", "a-week", "a-meal", "range", "idea-view", "lang", "s-goto"]);
document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el || el.disabled) return;
  const a = el.dataset.act;
  if (a === "demo-pause") {
    const p = toggleDemoPause();
    el.setAttribute("aria-pressed", String(p));
    el.querySelector(".i").outerHTML = icon(p ? "play" : "pause");
    return;
  }
  if (a === "crash-reload") { location.reload(); return; }
  if (a === "crash-reset") { try { localStorage.clear(); } catch { /* ignore */ } location.href = "/"; return; }
  if (ANIMATED.has(a)) state.animate = true;
  const fn = getAction(a);
  if (fn) fn(el, e);
});

document.addEventListener("submit", e => {
  const f = e.target.closest("[data-form]");
  if (!f) return;
  e.preventDefault();
  const kind = f.dataset.form;
  if (kind === "ob") obSubmit();
  else if (kind === "editor") saveEditor();
  else if (kind === "idea" || kind === "idea-menu" || kind === "idea-reply") submitIdeaForm(f);
  else if (kind === "reply-dish" || kind === "waste" || kind === "custom-range") submitStaffForm(f);
  else if (kind === "preset-save" || kind === "preset-load") submitPresetForm(f);
  else if (kind === "school-grades" || kind === "invite") submitSettingsForm(f);
});

document.addEventListener("input", e => {
  const el = e.target;
  if (el.dataset.bind && state.ob) {
    const d = state.ob.d;
    if (el.dataset.bind === "code") {
      const v = normCode(el.value).slice(0, 6);
      if (el.value !== v) el.value = v;
      d.code = v;
    } else d[el.dataset.bind] = el.value;
    if (state.ob.err) obError("");
    if (el.dataset.bind === "q") searchSchools();
    refreshCta();
  } else if (el.dataset.comment) onCommentInput(el);
  else if (el.dataset.ed && state.edit) onEditorInput(el);
  else if (el.matches("[data-idea-input]")) onIdeaInput(el);
  else if (el.matches("[data-color-input],[data-color-hex]")) onColorInput(el);
  else if (el.dataset.actColor) getAction(el.dataset.actColor)?.(el);
});

document.addEventListener("change", e => {
  const el = e.target;
  if (el.dataset.bindCheck && state.ob) state.ob.d[el.dataset.bindCheck] = el.checked;
  if (el.dataset.ed === "cuisine" && state.edit) onEditorInput(el);
  if (el.matches("[data-photo-input]") && el.files && el.files[0]) uploadPhoto(el.files[0]);
  if (el.matches("[data-switch-school]")) {
    const pick = state.admin.schools.find(x => x.school.id === el.value);
    if (pick) { state.admin.school = pick.school; state.admin.role = pick.role; LS.set("ll_admin_school", pick.school.id); setMode("admin"); }
  }
});

// Swipe left / right to move between Breakfast, Snack, Lunch, Ideas and Me.
// Ignored on the banner carousel, the day chips, form fields and when a sheet is open.
let touch = null;
document.addEventListener("touchstart", e => {
  if (!["student", "parent"].includes(state.mode) || state.ob || e.touches.length !== 1) { touch = null; return; }
  if (e.target.closest(".banners, .days, input, textarea, select, dialog, .rail")) { touch = null; return; }
  const t0 = e.touches[0];
  touch = { x: t0.clientX, y: t0.clientY, at: Date.now() };
}, { passive: true });
document.addEventListener("touchend", e => {
  if (!touch || $("#sheet")?.open) return;
  const t1 = e.changedTouches[0], dx = t1.clientX - touch.x, dy = t1.clientY - touch.y, dt = Date.now() - touch.at;
  touch = null;
  if (Math.abs(dx) < 70 || Math.abs(dy) > 50 || Math.abs(dx) < Math.abs(dy) * 2 || dt > 700) return;
  const items = [...document.querySelectorAll(".rail-i, .rail-me")].filter(n => n.tagName === "A");
  const at = items.findIndex(n => n.classList.contains("on"));
  const next = items[at + (dx < 0 ? 1 : -1)];
  if (at < 0 || !next) return;
  state.swipeDir = dx < 0 ? 1 : -1;
  next.click();
}, { passive: true });

window.addEventListener("hashchange", () => { if (!state.ob && state.mode) render(true); });
window.addEventListener("online", () => { flushQueue(); syncGrade(); });
bindSheet();

// ---------- start ----------
async function start() {
  // Register first: people who arrive by scanning a QR code take an early-return path below.
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  setLang(preferredLang());
  const params = new URLSearchParams(location.search);
  const login = params.get("login");
  const join = normCode(params.get("join"));
  const parent = normCode(params.get("parent"));
  if (location.search) history.replaceState(null, "", location.pathname + location.hash);

  // a sign-in or invite link from the inbox
  if (login) { await openLoginLink(login); return; }

  // an existing staff session (cookie) or an old staff key
  let mode = LS.get("ll_mode");
  if (mode === "admin" || LS.get("ll_admin")) {
    try {
      const me = await api("GET", "auth/me");
      state.admin = { via: me.via, email: me.email, schools: me.schools, school: null, role: null };
      const want = LS.get("ll_admin_school");
      const pick = me.schools.find(x => x.school.id === want) || me.schools[0];
      if (pick) { state.admin.school = pick.school; state.admin.role = pick.role; }
      else state.admin = null;
    } catch { state.admin = null; if (mode === "admin") mode = null; }
  }
  if (mode === "admin" && !state.admin) mode = null;
  if (mode === "student" && !state.student) mode = null;
  if (mode === "parent" && !state.parent) mode = null;
  if (!mode) mode = state.student ? "student" : state.admin ? "admin" : state.parent ? "parent" : null;
  state.mode = mode;
  const s = mode === "admin" ? state.admin?.school : mode === "parent" ? state.parent?.school : state.student?.school;
  if (s) applyTheme(s.theme?.color); else resetTheme();

  // a QR code scanned by a student, or a family link
  if (join.length === 6 && state.student?.school.code !== join) {
    startFlow("student", { code: join }, { exit: mode ? "app" : "welcome" });
    obSubmit();
    return;
  }
  if (parent.length === 6 && state.parent?.school.code !== parent) {
    startFlow("parent", { code: parent }, { exit: mode ? "app" : "welcome" });
    obSubmit();
    return;
  }
  if (!mode) { startFlow("welcome"); return; }
  render(true);
  if (mode === "student") { flushQueue(); syncGrade(); }
}
start();

// handy in the console while developing
window.__ll = { state, render };
