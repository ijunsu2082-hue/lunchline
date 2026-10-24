// Onboarding and sign-in: a student joining a school (scan, then one quick
// optional screen), a parent opening the menu, and staff signing in or creating
// a school by email link.
import { $, esc, normCode, LS, D, zoned } from "../util.js";
import { state, ALLERGENS, GRADE_ORDER } from "../state.js";
import { api, ensureToken } from "../api.js";
import { icon, mark } from "../icons.js";
import { t, LANGS } from "../i18n.js";
import { applyTheme, PRESET_GROUPS, colorName, isHex } from "../theme.js";
import { render, toast, registerActions, focusTitle } from "../ui.js";
import { startFlow, obExit, setMode, leaveToWelcome, sampleDays } from "../session.js";
import { welcomeHTML } from "./welcome.js";

// ---------- shells ----------
const blobs = '<svg class="fl-blobs" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M-20 210c60-70 120-30 170-80s40-110 120-120 130 60 150 20v250H-20z" fill="rgba(255,255,255,.05)"/><path d="M240 320c10-70 70-90 120-70s60 70 60 70z" fill="rgba(255,255,255,.07)"/></svg>';

// Students and families can switch language right on the join screens.
function langSlot(ob) {
  if (ob.flow === "signin" || ob.flow === "create") return '<span class="icon-btn ghost-space"></span>';
  const cur = document.documentElement.lang || "en";
  const other = LANGS.find(([k]) => k !== cur) || LANGS[0];
  return `<button type="button" class="chip-btn" data-act="lang" data-lang="${other[0]}" lang="${other[0]}" aria-label="${other[1]}">${icon("globe")}<span>${other[0].toUpperCase()}</span></button>`;
}

function topBar(ob, noBack) {
  return `<div class="fl-top">${noBack
    ? '<span class="icon-btn ghost-space"></span>'
    : `<button type="button" class="icon-btn on-dark" data-act="ob-back" aria-label="${esc(t("common.back"))}">${icon("chevL")}</button>`}
    <span class="fl-brand">${mark(26)}<span>LunchLine</span></span>${langSlot(ob)}</div>`;
}

// A dark leather-colored top with a stitched panel, and a cream card for the form.
function shell({ ob, title, lede, hero, body, foot, noBack, tabs }) {
  return `<div class="fl${tabs ? " has-tabs" : ""}">
    ${blobs}
    ${topBar(ob, noBack)}
    <div class="fl-hero"><div class="stitch">${hero || ""}</div></div>
    <form class="fl-card" data-form="ob" novalidate>
      ${tabs || ""}
      <div class="fl-body">
        <h1 class="fl-title">${title}</h1>
        ${lede ? `<p class="fl-lede">${lede}</p>` : ""}
        ${body}
        <p class="err" id="ob-err" role="alert">${esc(ob.err)}</p>
      </div>
      ${foot ? `<div class="fl-foot">${foot}</div>` : ""}
    </form>
  </div>`;
}

const cta = (label, ready, busy) => `<button class="btn primary lg block" type="submit" id="ob-cta"${ready && !busy ? "" : " disabled"}>${busy ? esc(t("common.oneMoment")) : esc(label) + icon("arrowR")}</button>`;

const heroSchool = d => d.school
  ? `<p class="stitch-k">${esc(t("setup.welcomeTo"))}</p><p class="stitch-name">${esc(d.school.name)}</p>`
  : `<div class="stitch-logo">${mark(54)}</div><p class="stitch-name">LunchLine</p><p class="stitch-k">${esc(t("join.tagline"))}</p>`;

// ---------- chips ----------
function allergyChips(d) {
  return `<div class="chips-pick" role="group" aria-label="${esc(t("setup.allergies"))}">
    ${ALLERGENS.map(k => `<button type="button" class="pick" data-act="ob-opt" data-kind="allergies" data-key="${k}" aria-pressed="${d.allergies.includes(k)}">${icon("check")}${esc(t("allergen." + k))}</button>`).join("")}
    <button type="button" class="pick" data-act="ob-other" data-kind="allergies" aria-pressed="${d.allergyOtherOn}" aria-expanded="${d.allergyOtherOn}" aria-controls="other-allergies">${icon(d.allergyOtherOn ? "check" : "plus")}${esc(t("common.other"))}</button>
  </div>
  <div class="other-field" id="other-allergies"${d.allergyOtherOn ? "" : " hidden"}>
    <label class="label" for="in-other-allergies">${esc(t("setup.otherAllergies"))}</label>
    <input class="input" id="in-other-allergies" data-bind="allergyOther" value="${esc(d.allergyOther)}" maxlength="80" placeholder="${esc(t("setup.otherPh"))}" autocomplete="off">
  </div>`;
}

function gradeChips(d) {
  const grades = (d.school?.grades?.length ? d.school.grades : ["9", "10", "11", "12"]);
  return `<div class="chips-pick grades" role="group" aria-label="${esc(t("setup.grade"))}">
    ${grades.map(g => `<button type="button" class="pick g" data-act="ob-grade" data-grade="${g}" aria-pressed="${d.grade === g}">${esc(g)}</button>`).join("")}
    <button type="button" class="pick g wide" data-act="ob-grade" data-grade="other" aria-pressed="${d.grade === "other"}">${esc(t("setup.gradeOther"))}</button>
  </div>`;
}

function cuisineChips(d) {
  return `<div class="chips-pick" role="group">
    ${["american", "italian", "mexican", "korean", "chinese", "japanese", "indian", "mediterranean", "healthy"].map(k => `<button type="button" class="pick" data-act="ob-opt" data-kind="cuisines" data-key="${k}" aria-pressed="${d.cuisines.includes(k)}">${icon("check")}${esc(t("cuisine." + k))}</button>`).join("")}
  </div>`;
}

function resultsHTML(d) {
  if (d.q.trim().length < 2) return "";
  if (d.results === null) return `<p class="help">${esc(t("common.searching"))}</p>`;
  if (!d.results.length) return `<p class="help">${esc(t("join.noResults", { q: d.q.trim() }))}</p>`;
  return `<ul class="result-list">${d.results.map((s, i) => `<li><button type="button" class="result" data-act="ob-pick" data-i="${i}"><span class="result-t">${esc(s.name)}</span>${icon("chevR")}</button></li>`).join("")}</ul>`;
}

// ---------- steps ----------
const STEPS = {
  school(d, ob) {
    const parent = ob.flow === "parent";
    if (d.findBy === "name") {
      return {
        title: esc(t("join.findTitle")), lede: esc(t("join.findLede")),
        body: `<label class="label" for="in-q">${esc(t("join.schoolName"))}</label>
          <div class="search">${icon("search")}<input class="input" id="in-q" type="search" data-bind="q" value="${esc(d.q)}" placeholder="${esc(t("join.namePh"))}" autocomplete="off" maxlength="60"></div>
          <div id="results" class="results" aria-live="polite">${resultsHTML(d)}</div>
          <button type="button" class="link center" data-act="ob-findby" data-by="code">${esc(t("join.haveCode"))}</button>`,
        foot: "",
      };
    }
    return {
      title: esc(t(parent ? "join.parentTitle" : "join.title")), lede: esc(t(parent ? "join.parentLede" : "join.lede")),
      body: `<label class="label" for="in-code">${esc(t("join.code"))}</label>
        <input class="input code-input" id="in-code" data-bind="code" value="${esc(d.code)}" maxlength="12" placeholder="ABC123" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="ob-err">
        <button type="button" class="link center" data-act="ob-findby" data-by="name">${icon("search")}${esc(t("join.byName"))}</button>`,
      cta: t("join.find"), ready: normCode(d.code).length === 6,
    };
  },
  setup(d, ob) {
    const edit = ob.flow === "edit";
    return {
      title: esc(t("setup.title")), lede: esc(t("setup.lede")),
      body: `<h2 class="fl-h2">${esc(t("setup.grade"))}</h2><p class="help">${esc(t("setup.grade.why"))}</p>${gradeChips(d)}
        <h2 class="fl-h2">${esc(t("setup.allergies"))}</h2><p class="help">${esc(t("setup.allergies.why"))}</p>${allergyChips(d)}`,
      cta: edit ? t("common.save") : t("setup.go"), ready: true,
      foot2: edit ? "" : `<button type="button" class="link center" data-act="ob-skip">${esc(t("setup.skip"))}</button>`,
    };
  },
  grade(d) {
    return { title: esc(t("setup.grade")), lede: esc(t("setup.grade.why")), body: gradeChips(d), cta: t("common.save"), ready: true };
  },
  allergies(d) {
    return { title: esc(t("setup.allergies")), lede: esc(t("setup.allergies.why")), body: allergyChips(d), cta: t("common.save"), ready: true };
  },
  food(d) {
    return { title: esc(t("me.food")), lede: esc(t("me.food.why")), body: cuisineChips(d), cta: t("common.save"), ready: true };
  },
  email(d) {
    if (d.sent) return sentStep(d);
    return {
      title: "Staff sign in", lede: "Enter your school email and we'll send you a sign-in link. No password to remember.",
      body: `<label class="label" for="in-email">School email</label>
        <input class="input lg" id="in-email" type="email" inputmode="email" data-bind="email" value="${esc(d.email)}" maxlength="120" placeholder="you@school.edu" autocomplete="email" autocapitalize="off" spellcheck="false" aria-describedby="ob-err">
        <p class="help">${icon("shield")}Only people added to a school can get in. Students never need this.</p>
        <details class="master"><summary>Have a master code?</summary>
          <label class="label" for="in-master">Master code</label>
          <div class="master-row"><input class="input" id="in-master" type="password" autocomplete="off" maxlength="80" aria-describedby="ob-err"><button type="button" class="btn secondary" data-act="master-staff">Open</button></div>
        </details>`,
      cta: "Email me a link", ready: /.+@.+\..+/.test(d.email.trim()),
    };
  },
  create(d) {
    if (d.sent) return sentStep(d);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";
    return {
      title: "Set up your school", lede: "Confirm your email and you're in: a join code and QR poster are one tap away.",
      body: `<label class="label" for="in-sn">School name</label>
        <input class="input lg" id="in-sn" data-bind="schoolName" value="${esc(d.schoolName)}" maxlength="60" placeholder="e.g. Lincoln High School" autocomplete="organization">
        <label class="label" for="in-email">Your email</label>
        <input class="input lg" id="in-email" type="email" inputmode="email" data-bind="email" value="${esc(d.email)}" maxlength="120" placeholder="you@school.edu" autocomplete="email" autocapitalize="off" spellcheck="false" aria-describedby="ob-err">
        <label class="check">
          <input type="checkbox" class="sr-only" data-bind-check="sample"${d.sample ? " checked" : ""}>
          <span class="check-box">${icon("check")}</span>
          <span class="check-text"><strong>Start with a sample menu</strong><span>Four weeks of breakfast, snack and lunch with photos, so you can try everything right away. Edit or delete any dish.</span></span>
        </label>
        <p class="help">${icon("clock")}Time zone: ${esc(tz.replace(/_/g, " "))}. You can change grades and more afterwards.</p>`,
      cta: "Email me a link", ready: d.schoolName.trim().length >= 2 && /.+@.+\..+/.test(d.email.trim()),
    };
  },
};

// The colors schools reach for most; the full set lives in School settings.
const QUICK_COLORS = PRESET_GROUPS.flatMap(([, l]) => l).filter(([n]) => ["Scarlet", "Cardinal", "Maroon", "Orange", "Gold", "Kelly green", "Forest", "Hunter", "Teal", "Sky", "Royal", "Navy", "Purple", "Pink", "Black"].includes(n));

function sentStep(d) {
  const demo = !!d.devLink;
  return {
    noBack: false, hideTabs: true,
    title: demo ? "Your sign-in link" : "Check your email",
    lede: demo
      ? `This server isn't connected to an email service, so instead of emailing <strong>${esc(d.email.trim())}</strong> we're showing the link here. It works once and expires in 15 minutes.`
      : `We sent a sign-in link to <strong>${esc(d.email.trim())}</strong>. It works once and expires in 15 minutes. Open it on this device.`,
    body: demo
      ? `<div class="dev-note"><p><strong>Demo mode.</strong> Anyone who can reach this page could sign in as any staff email, so only use demo mode for testing or showing LunchLine off.</p><a class="btn primary lg block" href="${esc(d.devLink)}">Open my sign-in link${icon("arrowR")}</a></div>`
      : `<div class="sent-card">${icon("mail")}<p>Nothing yet? Check spam, or <button type="button" class="link" data-act="ob-resend">send it again</button>.</p></div>`,
    foot: "",
  };
}

// ---------- render ----------
export function renderOb() {
  const ob = state.ob, step = ob.steps[ob.i];
  if (step === "welcome") return welcomeHTML();
  const S = STEPS[step](ob.d, ob);
  const staffFlow = ob.flow === "signin" || ob.flow === "create";
  const foot = S.foot !== undefined ? S.foot : cta(S.cta, S.ready, ob.busy) + (S.foot2 || "");
  const tabs = staffFlow && !S.hideTabs
    ? `<div class="fl-tabs" role="tablist" aria-label="Staff"><button type="button" role="tab" data-act="staff-tab" data-tab="signin" aria-selected="${ob.flow === "signin"}">Sign in</button><button type="button" role="tab" data-act="staff-tab" data-tab="create" aria-selected="${ob.flow === "create"}">New school</button></div>` : "";
  const hero = staffFlow
    ? `<div class="stitch-logo">${mark(54)}</div><p class="stitch-name">LunchLine</p><p class="stitch-k">For cafeteria staff</p>`
    : heroSchool(ob.d);
  return shell({ ob, title: S.title, lede: S.lede, hero, body: S.body, foot, noBack: S.noBack, tabs });
}

export function refreshCta() {
  const ob = state.ob, btn = $("#ob-cta");
  if (!ob || !btn || ob.busy) return;
  const S = STEPS[ob.steps[ob.i]](ob.d, ob);
  btn.disabled = !S.ready;
}
export function obError(msg) {
  if (!state.ob) return;
  state.ob.err = msg;
  const el = $("#ob-err");
  if (el) el.textContent = msg;
}
function obBusy(on) {
  state.ob.busy = on;
  const btn = $("#ob-cta");
  if (!btn) return;
  if (on) { btn.disabled = true; btn.textContent = t("common.oneMoment"); } else render();
}
function obNext() {
  const ob = state.ob;
  ob.err = "";
  if (ob.i < ob.steps.length - 1) {
    ob.i++;
    render(true);
    const f = $("#main .fl-body input:not([type=checkbox])");
    if (f && !f.closest("[hidden]") && matchMedia("(hover: hover)").matches) f.focus();
  } else obFinish();
}

export async function obSubmit() {
  const ob = state.ob, d = ob.d, step = ob.steps[ob.i];
  if (ob.busy) return;
  if (!STEPS[step](d, ob).ready) return;

  if (step === "school") {
    obBusy(true); obError("");
    try {
      d.school = (await api("GET", "schools?code=" + encodeURIComponent(normCode(d.code)))).school;
      applyTheme(d.school.theme?.color);
      ob.busy = false;
      if (ob.flow === "student") ensureToken(d.school.id).catch(() => {}); // solve the join puzzle while they pick their grade
      obNext();
    } catch (e) { ob.busy = false; render(); obError(e.message); }
    return;
  }
  if (step === "email" || step === "create") {
    obBusy(true); obError("");
    try {
      const create = step === "create";
      const out = await api("POST", "auth/request", create
        ? { email: d.email.trim(), mode: "create", name: d.schoolName.trim(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone, sample: d.sample, color: d.color }
        : { email: d.email.trim(), mode: "login" });
      if (out.dev_note) { // demo/dev mode only: tell them plainly instead of waiting for an email that won't come
        ob.busy = false; render(); obError(`${out.dev_note} Use the “New school” tab to create one with this email.`); return;
      }
      d.sent = true; d.devLink = out.dev_link || "";
      ob.busy = false; render(true);
    } catch (e) { ob.busy = false; render(); obError(e.message); }
    return;
  }
  obNext();
}

// ---------- finishing ----------
export async function syncGrade() {
  const st = state.student;
  if (!st || !st.school || st.gradeSynced === (st.grade || "")) return;
  try {
    await api("POST", "profile", { school: st.school.id, grade: st.grade || "" }, { student: st.school.id });
    st.gradeSynced = st.grade || "";
    LS.set("ll_student", st);
  } catch { /* retried next time the app opens */ }
}

function profileFrom(d, base = {}) {
  return {
    ...base,
    school: d.school || base.school,
    grade: d.grade || "",
    allergies: [...d.allergies],
    allergyOther: d.allergyOtherOn ? d.allergyOther.trim() : "",
    cuisines: [...d.cuisines],
    cuisineOther: d.cuisineOtherOn ? d.cuisineOther.trim() : "",
  };
}

export function obFinish() {
  const { flow, d } = state.ob;
  if (flow === "parent") {
    state.parent = { school: d.school, allergies: [], allergyOther: "" };
    LS.set("ll_parent", state.parent);
    setMode("parent");
    return;
  }
  if (flow === "edit") {
    const merged = profileFrom(d, state.student);
    merged.grade = d.grade || "";
    state.student = merged;
    LS.set("ll_student", merged);
    state.ob = null; render(true); toast(t("common.saved"));
    syncGrade();
    return;
  }
  state.student = profileFrom(d, { gradeSynced: "" });
  LS.set("ll_student", state.student);
  setMode("student");
  toast(t("join.joined", { school: d.school.name }));
  syncGrade();
}

// ---------- staff sign-in ----------
function pickSchool(schools, created) {
  const want = created?.id || LS.get("ll_admin_school");
  return schools.find(s => s.school.id === want) || schools[0];
}

export async function enterAdmin(out, via = "email") {
  const chosen = pickSchool(out.schools, out.created);
  state.admin = { via: out.via || via, email: out.email || "", schools: out.schools, school: chosen.school, role: chosen.role };
  LS.set("ll_admin_school", chosen.school.id);
  setMode("admin");
}

export async function consumeLoginLink(token, demo = false) {
  try {
    const out = demo ? await api("POST", "auth/master", { code: token }) : await api("POST", "auth/verify", { token });
    await enterAdmin(out);
    if (out.created && out.sample) {
      const start = D.monday(zoned(out.created.tz).date);
      try { await api("PUT", "menu", { school: out.created.id, days: sampleDays(start, 4) }); }
      catch { toast("Your school is ready, but the sample menu didn't load. Add it from the Menu tab.", true); }
    }
    toast(out.created ? `${out.created.name} is ready` : `Signed in to ${state.admin.school.name}`);
    return true;
  } catch (e) {
    startFlow("signin");
    obError(e.message);
    return false;
  }
}

// ---------- clicks ----------
registerActions({
  async "master-staff"(el) {
    const code = $("#in-master")?.value.trim();
    if (!code) { obError("Enter the master code."); return; }
    el.disabled = true;
    try { await consumeLoginLink(code, true); } finally { el.disabled = false; }
  },
  role(el) {
    const r = el.dataset.role;
    if (r === "student") startFlow("student");
    else if (r === "parent") startFlow("parent");
    else if (r === "create") startFlow("create");
    else startFlow("signin");
  },
  "ob-back"() { const ob = state.ob; if (ob.i > 0) { ob.i--; ob.err = ""; render(true); } else obExit(); },
  "ob-findby"(el) {
    const ob = state.ob;
    ob.d.findBy = el.dataset.by; ob.err = ""; render();
    $(el.dataset.by === "name" ? "#in-q" : "#in-code")?.focus();
    if (el.dataset.by === "name" && ob.d.q) searchSchools();
  },
  "ob-pick"(el) {
    const ob = state.ob;
    ob.d.school = ob.d.results[+el.dataset.i];
    applyTheme(ob.d.school.theme?.color);
    if (ob.flow === "student") ensureToken(ob.d.school.id).catch(() => {});
    obNext();
  },
  "ob-opt"(el) {
    const d = state.ob.d;
    const list = el.dataset.kind === "allergies" ? d.allergies : d.cuisines;
    const k = el.dataset.key, i = list.indexOf(k);
    if (i >= 0) list.splice(i, 1); else list.push(k);
    el.setAttribute("aria-pressed", String(i < 0));
  },
  "ob-grade"(el) {
    const d = state.ob.d, g = el.dataset.grade;
    d.grade = d.grade === g ? "" : g;
    document.querySelectorAll('[data-act="ob-grade"]').forEach(b => b.setAttribute("aria-pressed", String(b.dataset.grade === d.grade)));
  },
  "ob-other"(el) {
    const d = state.ob.d;
    d.allergyOtherOn = !d.allergyOtherOn;
    el.setAttribute("aria-pressed", String(d.allergyOtherOn)); el.setAttribute("aria-expanded", String(d.allergyOtherOn));
    el.querySelector(".i").outerHTML = icon(d.allergyOtherOn ? "check" : "plus");
    const box = $("#other-allergies");
    box.hidden = !d.allergyOtherOn;
    if (d.allergyOtherOn) $("#in-other-allergies").focus({ preventScroll: false });
  },
  "ob-color"(el) {
    const d = state.ob.d, hex = el.dataset.color || el.value;
    if (!isHex(hex)) return;
    d.color = hex.toUpperCase();
    applyTheme(d.color);
    document.querySelectorAll('.create-swatches [data-act="ob-color"]').forEach(b => b.setAttribute("aria-pressed", String(b.dataset.color.toLowerCase() === hex.toLowerCase())));
    const note = $("#color-name"); if (note) note.textContent = `${colorName(d.color)}. Students see the app in this color, and you can change it any time.`;
  },
  "ob-skip"() { const d = state.ob.d; d.grade = ""; d.allergies = []; d.allergyOtherOn = false; d.allergyOther = ""; obFinish(); },
  "staff-tab"(el) {
    const ob = state.ob;
    if (ob.flow === el.dataset.tab) return;
    ob.flow = el.dataset.tab; ob.steps = [el.dataset.tab === "create" ? "create" : "email"]; ob.i = 0; ob.err = ""; ob.d.sent = false;
    render();
    $("[data-act=staff-tab][aria-selected=true]")?.focus();
  },
  async "ob-resend"() {
    const ob = state.ob, d = ob.d;
    try {
      const create = ob.flow === "create";
      const out = await api("POST", "auth/request", create
        ? { email: d.email.trim(), mode: "create", name: d.schoolName.trim(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone, sample: d.sample, color: d.color }
        : { email: d.email.trim(), mode: "login" });
      d.devLink = out.dev_link || "";
      toast("Sent again. Check your inbox."); render();
    } catch (e) { toast(e.message, true); }
  },
});

let searchTimer, searchSeq = 0;
export function searchSchools() {
  const d = state.ob.d, q = d.q.trim();
  clearTimeout(searchTimer);
  d.results = null;
  const seq = ++searchSeq;
  const box = $("#results");
  if (box) box.innerHTML = resultsHTML(d);
  if (q.length < 2) return;
  searchTimer = setTimeout(async () => {
    let results;
    try { results = (await api("GET", "schools?q=" + encodeURIComponent(q))).schools; }
    catch (e) { results = []; toast(e.message, true); }
    if (seq !== searchSeq || !state.ob) return;
    d.results = results;
    const b = $("#results");
    if (b) b.innerHTML = resultsHTML(d);
  }, 250);
}

export { leaveToWelcome, focusTitle, GRADE_ORDER };
