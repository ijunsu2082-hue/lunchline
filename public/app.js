(() => {
  "use strict";

  // ---------- vocabulary ----------
  const ALLERGENS = { peanuts: "Peanuts", tree_nuts: "Tree nuts", dairy: "Dairy", eggs: "Eggs", gluten: "Gluten", soy: "Soy", fish: "Fish", shellfish: "Shellfish", sesame: "Sesame" };
  const CUISINES = {
    american: ["American", "Burgers, fries, tenders"],
    italian: ["Italian", "Pizza, pasta, lasagna"],
    mexican: ["Mexican", "Tacos, burritos, nachos"],
    korean: ["Korean", "Bibimbap, bulgogi, kimbap"],
    chinese: ["Chinese", "Orange chicken, lo mein"],
    japanese: ["Japanese", "Teriyaki, sushi, ramen"],
    indian: ["Indian", "Curry, naan, biryani"],
    mediterranean: ["Mediterranean", "Gyros, hummus, falafel"],
    healthy: ["Fresh & healthy", "Salads, bowls, fruit"],
  };
  const DIETS = { vegetarian: "Vegetarian", vegan: "Vegan", halal: "Halal", spicy: "Spicy" };
  const MEALS = { breakfast: "Breakfast/Snacks", lunch: "Lunch" };
  const RATINGS = { good: { label: "Good", icon: "thumbUp" }, mid: { label: "Mid", icon: "thumbMid" }, bad: { label: "Bad", icon: "thumbDown" } };
  const COMMENT_MAX = 280;
  const IDEA_MAX = 120;

  const THUMB = '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>';
  const ICONS = {
    thumbUp: THUMB,
    thumbMid: `<g transform="rotate(-90 12 12)">${THUMB}</g>`,
    thumbDown: '<path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    arrowR: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    chef: '<path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"/><path d="M6 17h12"/>',
    utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    sparkles: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0l1.58 6.14a2 2 0 0 0 1.44 1.44l6.14 1.58a.5.5 0 0 1 0 .96l-6.14 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/>',
    chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    school: '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    key: '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
    eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    arrowUp: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  };
  const icon = (n, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[n]}</svg>`;
  const mark = (s = 28) => `<svg class="mark" width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect width="64" height="64" rx="18" fill="#FF5A1F"/><g fill="#fff"><rect x="19" y="11" width="5" height="20" rx="2.5"/><rect x="29.5" y="11" width="5" height="20" rx="2.5"/><rect x="40" y="11" width="5" height="20" rx="2.5"/><path d="M19 27h26v2a11 11 0 0 1-11 11h-4a11 11 0 0 1-11-11z"/><rect x="29" y="36" width="6" height="18" rx="3"/></g><circle cx="47" cy="46" r="9" fill="#0B0B0D"/><path d="M43 46.5l2.6 2.6 5-5.2" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // ---------- small helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;
  const listJoin = a => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const normCode = s => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const fmtKey = k => normCode(k).replace(/(.{4})(?=.)/g, "$1-");
  const pct = t => (t.total ? Math.round((100 * t.good) / t.total) : 0);
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const LS = {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };

  const D = {
    add(d, n) { const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); },
    dow: d => new Date(d + "T00:00:00Z").getUTCDay(),
    monday(d) { const w = D.dow(d); return D.add(d, w === 0 ? -6 : 1 - w); },
    fmt: (d, o) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", ...o }),
    weekdays: mon => [0, 1, 2, 3, 4].map(i => D.add(mon, i)),
    isWeekend: d => D.dow(d) === 0 || D.dow(d) === 6,
    span: (a, b) => Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 864e5) + 1,
  };
  const shortDay = d => D.fmt(d, { weekday: "short", month: "short", day: "numeric" });

  function zoned(tz) {
    try {
      const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
      const g = t => p.find(x => x.type === t).value;
      return { date: `${g("year")}-${g("month")}-${g("day")}`, hour: +g("hour") % 24, minute: +g("minute") };
    } catch {
      const n = new Date();
      return { date: `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`, hour: n.getHours(), minute: n.getMinutes() };
    }
  }
  // Organizers plan ahead: on a weekend, open the coming week.
  const homeDay = today => (D.isWeekend(today) ? D.add(D.monday(today), 7) : today);
  // Students rate what they ate: on a weekend, open this week's Friday.
  const studentHome = today => (D.isWeekend(today) ? D.add(D.monday(today), 4) : today);
  const RATE_DAYS = 7; // a dish can be rated on the day it's served and the 6 days after (matches the server)

  function timeAgo(iso) {
    const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    const d = Math.floor(s / 86400);
    return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function newId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, "0")).join("");
  }

  // ---------- API ----------
  class ApiError extends Error { constructor(msg, status) { super(msg); this.status = status; } }
  async function api(method, path, data, opts = {}) {
    const headers = {};
    let body;
    if (opts.key || opts.admin) headers["X-Admin-Key"] = opts.key || state.admin.key;
    if (opts.raw) { body = opts.raw; headers["Content-Type"] = opts.type; }
    else if (data !== undefined) { body = JSON.stringify(data); headers["Content-Type"] = "application/json"; }
    let res;
    try { res = await fetch("/api/" + path, { method, headers, body, cache: "no-store" }); }
    catch { throw new ApiError("Can't reach LunchLine. Check your connection and try again.", 0); }
    let out = null;
    try { out = await res.json(); } catch {}
    if (!res.ok) throw new ApiError(out?.error || `Something went wrong (${res.status}). Try again.`, res.status);
    return out;
  }
  // Requests for the same dish run one after another, so the last tap always wins.
  const queues = {};
  function enqueue(id, fn) {
    const p = (queues[id] || Promise.resolve()).then(fn, fn);
    queues[id] = p.catch(() => {});
    return p;
  }

  // ---------- state ----------
  const state = {
    voter: LS.get("ll_voter"),
    student: LS.get("ll_student"),
    admin: LS.get("ll_admin"),
    mode: null,
    ob: null,
    today: null,
    // student
    week: null, day: null, meal: null, touched: false,
    weeks: {}, mine: {}, openComment: new Set(), cDraft: {}, ideas: null,
    // organizer
    aWeek: null, aDay: null, aMeal: "lunch", aWeeks: {}, range: "7", insights: null, edit: null,
    loading: new Set(),
  };
  if (typeof state.voter !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(state.voter)) { state.voter = newId(); LS.set("ll_voter", state.voter); }
  LS.del("ll_profile"); LS.del("ll_votes"); // from the single-school prototype

  const main = $("#main"), bar = $("#bar"), tabsEl = $("#tabs"), toastEl = $("#toast"), sheet = $("#sheet");

  const TABS = {
    student: [["menu", "Menu", "utensils"], ["ideas", "Suggest", "sparkles"], ["me", "Me", "user"]],
    admin: [["insights", "Insights", "chart"], ["kitchen", "Menu", "calendar"], ["ideas", "Suggestions", "sparkles"], ["school", "School", "school"]],
  };
  const currentTab = () => {
    const h = location.hash.slice(1), tabs = TABS[state.mode];
    return tabs.some(t => t[0] === h) ? h : tabs[0][0];
  };
  function go(tab) {
    if (location.hash === "#" + tab) render(true);
    else location.hash = tab;
  }
  function resetData() {
    Object.assign(state, { week: null, day: null, meal: null, touched: false, weeks: {}, mine: {}, ideas: null, aWeek: null, aDay: null, aWeeks: {}, insights: null, today: null });
    state.openComment.clear(); state.cDraft = {};
  }
  function setMode(mode) {
    state.mode = mode; state.ob = null;
    LS.set("ll_mode", mode);
    resetData();
    go(TABS[mode][0][0]);
  }
  function leaveToWelcome() {
    state.mode = null; LS.del("ll_mode"); resetData();
    startFlow("welcome");
  }
  const school = () => (state.mode === "admin" ? state.admin.school : state.student.school);

  // ---------- toast ----------
  let toastTimer;
  function toast(msg, isError) {
    toastEl.textContent = msg;
    toastEl.className = "toast show" + (isError ? " error" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.className = "toast"; }, isError ? 4200 : 2600);
  }

  async function copy(text, label) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const t = document.createElement("textarea");
      t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch {}
      t.remove();
    }
    toast(`${label} copied`);
  }
  const inviteLink = code => `${location.origin}/?join=${code}`;

  // ---------- allergy + preference matching ----------
  const terms = s => String(s || "").toLowerCase().split(/[,;/\n]+/).map(t => t.trim()).filter(t => t.length >= 2);
  const textHas = (hay, term) => new RegExp(`(^|[^a-z])${reEsc(term)}`, "i").test(hay || "");

  function allergyHits(item, st) {
    const contains = [], may = [];
    for (const a of st.allergies) {
      if (item.allergens.includes(a)) contains.push(ALLERGENS[a]);
      else if (item.may.includes(a)) may.push(ALLERGENS[a]);
    }
    const hayC = [item.name, item.desc, item.ingredients, item.allergens_other].join(" ");
    for (const t of terms(st.allergyOther)) {
      if (textHas(hayC, t)) contains.push(cap(t));
      else if (textHas(item.may_other, t)) may.push(cap(t));
    }
    return { contains, may };
  }
  function pickedFor(item, st, hits) {
    if (hits.contains.length || hits.may.length) return false;
    if (item.cuisine && st.cuisines.includes(item.cuisine)) return true;
    const hay = [item.name, item.desc, item.cuisine_other].join(" ");
    return terms(st.cuisineOther).some(t => textHas(hay, t));
  }
  const cuisineLabel = it => (it.cuisine === "other" ? it.cuisine_other || "Other" : CUISINES[it.cuisine]?.[0] || "");

  // ================= RENDER =================
  function render(focus) {
    document.body.classList.toggle("is-ob", !!state.ob);
    if (state.ob) {
      bar.innerHTML = ""; tabsEl.innerHTML = "";
      main.className = "";
      main.innerHTML = renderOb();
      if (focus) { focusTitle(); window.scrollTo(0, 0); }
      return;
    }
    if (!state.today) state.today = zoned(school().tz).date;
    const tab = currentTab();
    renderBar();
    tabsEl.innerHTML = TABS[state.mode].map(([k, l, ic]) =>
      `<a href="#${k}" class="tab"${k === tab ? ' aria-current="page"' : ""}>${icon(ic)}<span>${l}</span></a>`).join("");
    main.className = state.mode === "admin" ? "wide" : "";
    main.innerHTML = VIEWS[state.mode][tab]();
    if (focus) { focusTitle(); window.scrollTo(0, 0); }
  }
  function focusTitle() {
    const h = main.querySelector("h1");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }
  function renderBar() {
    const s = school();
    bar.innerHTML = `<div class="bar-in">
      <a class="brand" href="#${TABS[state.mode][0][0]}" aria-label="LunchLine home">${mark(30)}<span class="brand-name">LunchLine</span></a>
      <span class="bar-sep" aria-hidden="true"></span>
      <span class="bar-school" title="${esc(s.name)}">${esc(s.name)}</span>
      ${state.mode === "admin" ? '<span class="role-tag">Organizer</span>' : ""}
      <button class="bar-out" data-act="${state.mode === "admin" ? "signout" : "leave"}">${icon("logout")}<span>Sign out</span></button>
    </div>`;
  }
  const head = (eyebrow, title, sub, side = "") => `<header class="page-head">
      <div class="page-head-main">${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ""}<h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ""}</div>${side}
    </header>`;
  const errorBox = (msg, act) => `<div class="empty"><span class="empty-ic">${icon("alert")}</span><p>${esc(msg)}</p><button class="btn secondary" data-act="${act}">${icon("refresh")}Try again</button></div>`;
  const skeleton = n => `<div class="skel-list" aria-busy="true" aria-label="Loading">${'<div class="skel"></div>'.repeat(n)}</div>`;

  // ================= ONBOARDING =================
  const FLOWS = { welcome: ["welcome"], student: ["school", "name", "allergies", "food"], organizer: ["create", "ready"], signin: ["key"] };

  function startFlow(flow, data = {}, opts = {}) {
    const st = state.student;
    state.ob = {
      flow, i: 0, busy: false, err: "",
      steps: opts.steps || FLOWS[flow],
      exit: opts.exit || "welcome",
      d: {
        findBy: "code", code: "", q: "", results: null, school: null, name: "",
        allergies: [], allergyOther: "", allergyOtherOn: false, cuisines: [], cuisineOther: "", cuisineOtherOn: false,
        schoolName: "", sample: true, key: "", created: null,
        ...(flow === "edit" && st ? { ...st, allergyOtherOn: !!st.allergyOther, cuisineOtherOn: !!st.cuisineOther, allergies: [...st.allergies], cuisines: [...st.cuisines] } : {}),
        ...data,
      },
    };
    render(true);
  }
  function obExit() {
    if (state.ob.exit === "app" && state.mode) { state.ob = null; render(true); }
    else startFlow("welcome");
  }

  function optGrid(kind, entries, selected, otherOn, otherVal, otherLabel, otherPlaceholder) {
    return `<div class="opts${kind === "cuisines" ? " opts-list" : ""}" role="group" aria-label="${kind === "allergies" ? "Allergies" : "Food you like"}">
      ${entries.map(([k, label, ex]) => `<button type="button" class="opt" data-act="ob-opt" data-kind="${kind}" data-key="${k}" aria-pressed="${selected.includes(k)}">
        <span class="opt-text"><span class="opt-t">${label}</span>${ex ? `<span class="opt-ex">${ex}</span>` : ""}</span><span class="opt-check">${icon("check")}</span></button>`).join("")}
      <button type="button" class="opt opt-other" data-act="ob-other" data-kind="${kind}" aria-pressed="${otherOn}" aria-expanded="${otherOn}" aria-controls="other-${kind}">
        <span class="opt-text"><span class="opt-t">Other</span><span class="opt-ex">Type your own</span></span><span class="opt-check">${icon(otherOn ? "check" : "plus")}</span></button>
    </div>
    <div class="other-field" id="other-${kind}"${otherOn ? "" : " hidden"}>
      <label class="label" for="in-other-${kind}">${otherLabel}</label>
      <input class="input" id="in-other-${kind}" data-bind="${kind === "allergies" ? "allergyOther" : "cuisineOther"}" value="${esc(otherVal)}" maxlength="80" placeholder="${otherPlaceholder}" autocomplete="off">
      <p class="help">Separate with commas.</p>
    </div>`;
  }

  function schoolChip(d) {
    return d.school ? `<div class="joining">${icon("school")}<span>Joining <strong>${esc(d.school.name)}</strong></span></div>` : "";
  }

  const STEPS = {
    school(d) {
      if (d.findBy === "name") {
        return {
          title: "Find your school",
          lede: "Search by name, then tap your school.",
          body: `<label class="label" for="in-q">School name</label>
            <div class="search">${icon("search")}<input class="input" id="in-q" type="search" data-bind="q" value="${esc(d.q)}" placeholder="e.g. Lincoln High" autocomplete="off" maxlength="60"></div>
            <div id="results" class="results" aria-live="polite">${resultsHTML(d)}</div>
            <button type="button" class="link center" data-act="ob-findby" data-by="code">I have a school code</button>`,
          foot: "",
        };
      }
      return {
        title: "Join your school",
        lede: "Enter the 6-character code from your cafeteria or teacher.",
        body: `<label class="label" for="in-code">School code</label>
          <input class="input code-input" id="in-code" data-bind="code" value="${esc(d.code)}" maxlength="12" placeholder="ABC123" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="ob-err">
          <button type="button" class="link center" data-act="ob-findby" data-by="name">${icon("search")}No code? Find your school by name</button>`,
        cta: "Find my school", ready: normCode(d.code).length === 6,
      };
    },
    name(d) {
      return {
        title: "What should we call you?",
        lede: "A first name or nickname is fine. It stays on this device, and your ratings are anonymous.",
        body: `${schoolChip(d)}<label class="label" for="in-name">Your name</label>
          <input class="input lg" id="in-name" data-bind="name" value="${esc(d.name)}" maxlength="24" placeholder="e.g. Sam" autocomplete="given-name" enterkeyhint="next">`,
        cta: state.ob.flow === "edit" ? "Save" : "Continue", ready: d.name.trim().length > 0,
      };
    },
    allergies(d) {
      const none = !d.allergies.length && !(d.allergyOtherOn && d.allergyOther.trim());
      return {
        title: "Do you have any food allergies?",
        lede: "We'll flag dishes that contain them, or might, in red. Tap all that apply.",
        body: optGrid("allergies", Object.entries(ALLERGENS), d.allergies, d.allergyOtherOn, d.allergyOther, "Other allergies", "e.g. kiwi, mustard, coconut"),
        cta: state.ob.flow === "edit" ? "Save" : none ? "I don't have allergies" : "Continue", ready: true,
      };
    },
    food(d) {
      const none = !d.cuisines.length && !(d.cuisineOtherOn && d.cuisineOther.trim());
      return {
        title: "What food do you like?",
        lede: "We'll mark dishes you'll probably love with “Picked for you”.",
        body: optGrid("cuisines", Object.entries(CUISINES).map(([k, [l, ex]]) => [k, l, ex]), d.cuisines, d.cuisineOtherOn, d.cuisineOther, "Other food you like", "e.g. Vietnamese, BBQ, soup"),
        cta: state.ob.flow === "edit" ? "Save" : none ? "Skip for now" : "Show me the menu", ready: true,
      };
    },
    create(d) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";
      return {
        title: "Set up your school",
        lede: "You'll get a join code for students and a private admin key for staff.",
        body: `<label class="label" for="in-sn">School name</label>
          <input class="input lg" id="in-sn" data-bind="schoolName" value="${esc(d.schoolName)}" maxlength="60" placeholder="e.g. Lincoln High School" autocomplete="organization">
          <label class="check">
            <input type="checkbox" class="sr-only" data-bind-check="sample"${d.sample ? " checked" : ""}>
            <span class="check-box">${icon("check")}</span>
            <span class="check-text"><strong>Start with a sample menu</strong><span>Four weeks of breakfast/snacks and lunch, so you can try everything right away. Edit or delete any dish.</span></span>
          </label>
          <p class="help">${icon("clock")}Time zone: ${esc(tz.replace(/_/g, " "))}. Students can rate a dish for ${RATE_DAYS} days after it's served.</p>`,
        cta: "Create school", ready: d.schoolName.trim().length >= 2,
      };
    },
    ready(d) {
      const { school: s, adminKey } = d.created;
      return {
        noBack: true,
        title: `${esc(s.name)} is ready`,
        lede: "Share the join code with students. Keep the admin key private.",
        body: `<div class="code-card">
            <p class="label">Student join code</p>
            <p class="big-code">${esc(s.code)}</p>
            <div class="row-btns">
              <button type="button" class="btn secondary" data-act="copy" data-text="${esc(s.code)}" data-label="Join code">${icon("copy")}Copy code</button>
              <button type="button" class="btn secondary" data-act="copy" data-text="${esc(inviteLink(s.code))}" data-label="Invite link">${icon("link")}Copy invite link</button>
            </div>
          </div>
          <div class="key-card">
            <p class="label">${icon("key")}Your admin key</p>
            <p class="key">${esc(fmtKey(adminKey))}</p>
            <p class="help">Save this somewhere safe. It's how you manage ${esc(s.name)} from another device, and anyone with it can edit your menu.</p>
            <button type="button" class="btn secondary" data-act="copy" data-text="${esc(fmtKey(adminKey))}" data-label="Admin key">${icon("copy")}Copy admin key</button>
          </div>`,
        cta: "Open my dashboard", ready: true,
      };
    },
    key(d) {
      return {
        title: "Sign in as an organizer",
        lede: "Enter the admin key you got when you set up your school.",
        body: `<label class="label" for="in-key">Admin key</label>
          <input class="input lg mono" id="in-key" data-bind="key" value="${esc(d.key)}" maxlength="20" placeholder="XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="ob-err">
          <p class="help">Lost it? Ask whoever set up your school.</p>`,
        cta: "Sign in", ready: normCode(d.key).length >= 12,
      };
    },
  };

  function resultsHTML(d) {
    if (d.q.trim().length < 2) return "";
    if (d.results === null) return '<p class="help">Searching…</p>';
    if (!d.results.length) return `<p class="help">No schools match “${esc(d.q.trim())}”. Check the spelling, or ask for your school code.</p>`;
    return `<ul class="result-list">${d.results.map((s, i) => `<li><button type="button" class="result" data-act="ob-pick" data-i="${i}">
      <span class="result-ic">${icon("school")}</span><span class="result-t">${esc(s.name)}</span>${icon("chevR")}</button></li>`).join("")}</ul>`;
  }

  function welcomeHTML() {
    return `<div class="welcome">
      <div class="welcome-top">
        <div class="brand big">${mark(40)}<span class="brand-name">LunchLine</span></div>
        <h1 class="display">Better school lunch starts with you.</h1>
        <p class="lede">See what's in every dish, rate what you ate in one tap, and tell your cafeteria what to cook next.</p>
      </div>
      <div class="preview" aria-hidden="true">
        <div class="pv-card">
          <div class="pv-row"><span class="pv-name">Beef Bulgogi Bowl</span><span class="pv-pct">92% liked</span></div>
          <div class="stack"><span class="s-good" style="width:84%"></span><span class="s-mid" style="width:10%"></span><span class="s-bad" style="width:6%"></span></div>
          <ul class="chips"><li class="chip">Soy</li><li class="chip hit">${icon("alert")}Sesame</li><li class="chip">Gluten</li></ul>
        </div>
      </div>
      <div class="roles">
        <button class="role" data-act="role" data-role="student">
          <span class="role-ic">${icon("user")}</span>
          <span class="role-text"><strong>I'm a student</strong><span>Join with your school code and rate your lunch</span></span>${icon("chevR")}
        </button>
        <button class="role" data-act="role" data-role="organizer">
          <span class="role-ic">${icon("chef")}</span>
          <span class="role-text"><strong>I work at a school</strong><span>Post menus, add photos, and see what students think</span></span>${icon("chevR")}
        </button>
      </div>
      <p class="fine">Already set up your school? <button class="link" data-act="role" data-role="signin">Sign in with your admin key</button></p>
    </div>`;
  }

  function renderOb() {
    const ob = state.ob, step = ob.steps[ob.i];
    if (step === "welcome") return welcomeHTML();
    const S = STEPS[step](ob.d);
    const showProg = ob.steps.length > 1;
    const foot = S.foot !== undefined ? S.foot
      : `<button class="btn primary lg" type="submit" id="ob-cta"${S.ready && !ob.busy ? "" : " disabled"}>${ob.busy ? "One moment…" : esc(S.cta) + icon("arrowR")}</button>`;
    return `<div class="ob">
      <div class="ob-top">
        ${S.noBack ? '<span class="icon-btn ghost-space"></span>' : `<button type="button" class="icon-btn" data-act="ob-back" aria-label="Back">${icon("chevL")}</button>`}
        ${showProg ? `<div class="prog" aria-hidden="true">${ob.steps.map((_, j) => `<span class="${j <= ob.i ? "on" : ""}"></span>`).join("")}</div>` : '<span class="prog"></span>'}
        <span class="icon-btn ghost-space"></span>
      </div>
      <form class="ob-form" data-form="ob" novalidate>
        <div class="ob-body">
          ${showProg ? `<p class="eyebrow">Step ${ob.i + 1} of ${ob.steps.length}</p>` : ""}
          <h1 class="ob-title">${S.title}</h1>
          ${S.lede ? `<p class="lede">${S.lede}</p>` : ""}
          ${S.body}
          <p class="err" id="ob-err" role="alert">${esc(ob.err)}</p>
        </div>
        ${foot ? `<div class="ob-foot">${foot}</div>` : ""}
      </form>
    </div>`;
  }

  function refreshCta() {
    const ob = state.ob, btn = $("#ob-cta");
    if (!ob || !btn || ob.busy) return;
    const S = STEPS[ob.steps[ob.i]](ob.d);
    btn.disabled = !S.ready;
    btn.innerHTML = esc(S.cta) + icon("arrowR");
  }
  function obError(msg) {
    if (!state.ob) return;
    state.ob.err = msg;
    const el = $("#ob-err");
    if (el) el.textContent = msg;
  }
  function obBusy(on) {
    state.ob.busy = on;
    const btn = $("#ob-cta");
    if (!btn) return;
    if (on) { btn.disabled = true; btn.textContent = "One moment…"; } else refreshCta();
  }
  function obNext() {
    const ob = state.ob;
    ob.err = "";
    if (ob.i < ob.steps.length - 1) {
      ob.i++;
      render(true);
      const f = main.querySelector(".ob-body input:not([type=checkbox])");
      if (f && !f.closest("[hidden]") && matchMedia("(hover: hover)").matches) f.focus();
    } else obFinish();
  }

  async function obSubmit() {
    const ob = state.ob, d = ob.d, step = ob.steps[ob.i];
    if (ob.busy) return;
    if (!STEPS[step](d).ready) return;
    if (step === "school") {
      obBusy(true); obError("");
      try {
        d.school = (await api("GET", "schools?code=" + encodeURIComponent(normCode(d.code)))).school;
        obBusy(false); obNext();
      } catch (e) { obBusy(false); obError(e.message); }
      return;
    }
    if (step === "create") {
      obBusy(true); obError("");
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res = await api("POST", "schools", { name: d.schoolName.trim(), tz });
        state.admin = { school: res.school, key: res.adminKey };
        LS.set("ll_admin", state.admin);
        if (d.sample) {
          const start = D.monday(zoned(res.school.tz).date);
          try { await api("PUT", "menu", { school: res.school.id, days: sampleDays(start, 4) }, { key: res.adminKey }); }
          catch { toast("School created, but the sample menu didn't load. You can add it from the Menu tab.", true); }
        }
        d.created = res;
        obBusy(false); obNext();
      } catch (e) { obBusy(false); obError(e.message); }
      return;
    }
    if (step === "key") {
      obBusy(true); obError("");
      const key = normCode(d.key);
      try {
        const out = await api("POST", "session", undefined, { key });
        state.admin = { school: out.school, key };
        LS.set("ll_admin", state.admin);
        setMode("admin");
        toast(`Signed in to ${out.school.name}`);
      } catch (e) { obBusy(false); obError(e.message); }
      return;
    }
    obNext();
  }

  function obFinish() {
    const { flow, d } = state.ob;
    if (flow === "organizer") { setMode("admin"); return; }
    const profile = {
      school: d.school || state.student?.school,
      name: d.name.trim(),
      allergies: d.allergies,
      allergyOther: d.allergyOtherOn ? d.allergyOther.trim() : "",
      cuisines: d.cuisines,
      cuisineOther: d.cuisineOtherOn ? d.cuisineOther.trim() : "",
    };
    state.student = profile;
    LS.set("ll_student", profile);
    if (flow === "edit") { state.ob = null; render(true); toast("Saved"); return; }
    setMode("student");
    toast(`Welcome to ${profile.school.name}!`);
  }

  let searchTimer, searchSeq = 0;
  function searchSchools() {
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

  function sampleDays(monday, weeks) {
    const days = [];
    for (let w = 0; w < weeks; w++) {
      (window.SAMPLE_WEEK || []).forEach((day, i) => {
        days.push({ date: D.add(monday, w * 7 + i), breakfast: day.breakfast.map(x => ({ ...x })), lunch: day.lunch.map(x => ({ ...x })) });
      });
    }
    return days;
  }

  // ================= STUDENT =================
  const rateable = date => date <= state.today && date >= D.add(state.today, -(RATE_DAYS - 1));
  const rateUntil = date => D.add(date, RATE_DAYS - 1);

  function initStudentWeek() {
    const d = studentHome(state.today);
    state.week = D.monday(d);
    state.day = d;
    state.meal = null;
  }

  async function loadWeek(mon) {
    const key = "w" + mon;
    if (state.loading.has(key)) return;
    state.loading.add(key);
    const s = state.student.school, to = D.add(mon, 4);
    let reload = false;
    try {
      const [m, v] = await Promise.all([
        api("GET", `menu?school=${s.id}&from=${mon}&to=${to}`),
        api("GET", `votes?school=${s.id}&voter=${encodeURIComponent(state.voter)}&from=${mon}&to=${to}`),
      ]);
      if (state.mode !== "student" || state.student?.school.id !== s.id) return;
      state.weeks[mon] = { days: m.days };
      v.votes.forEach(r => { state.mine[r.date + "|" + r.item_id] = r; });
      if (m.today !== state.today) {
        state.today = m.today; // the server's clock (in the school's time zone) decides what "today" is
        if (!state.touched) {
          const before = state.week;
          initStudentWeek();
          reload = state.week !== before;
        }
      }
    } catch (e) {
      if (e.status === 404 && /school/i.test(e.message)) { state.loading.delete(key); schoolGone(); return; }
      state.weeks[mon] = { error: e.message };
    } finally {
      state.loading.delete(key);
    }
    if (reload) { loadWeek(state.week); return; }
    if (state.mode === "student" && !state.ob && currentTab() === "menu" && state.week === mon) render();
  }

  function schoolGone() {
    LS.del("ll_student"); state.student = null;
    if (state.admin) { setMode("admin"); toast("That school no longer exists.", true); }
    else { leaveToWelcome(); startFlow("student"); obError("This school was removed by its organizer. Join with a new code."); }
  }

  function defaultMeal(day) {
    if (!day) return "lunch";
    let m = "lunch";
    if (state.day === state.today) {
      const z = zoned(state.student.school.tz);
      if (z.hour * 60 + z.minute < 10 * 60 + 30) m = "breakfast";
    }
    if (!day[m].length) m = m === "lunch" ? "breakfast" : "lunch";
    return day[m].length ? m : "lunch";
  }

  function weekLabel(mon) {
    const cur = D.monday(state.today), end = D.add(mon, 4);
    const same = D.fmt(mon, { month: "short" }) === D.fmt(end, { month: "short" });
    const range = `${D.fmt(mon, { month: "short", day: "numeric" })} – ${D.fmt(end, same ? { day: "numeric" } : { month: "short", day: "numeric" })}`;
    const name = mon === cur ? "This week" : mon === D.add(cur, 7) ? "Next week" : mon === D.add(cur, -7) ? "Last week" : "";
    return name ? `<strong>${name}</strong><span>${range}</span>` : `<strong>${range}</strong>`;
  }

  function weekStrip(mon, sel, days, prefix) {
    return `<div class="week">
      <div class="week-head">
        <button class="icon-btn" data-act="${prefix}week" data-dir="-1" aria-label="Previous week">${icon("chevL")}</button>
        <p class="week-label" aria-live="polite">${weekLabel(mon)}</p>
        <button class="icon-btn" data-act="${prefix}week" data-dir="1" aria-label="Next week">${icon("chevR")}</button>
      </div>
      <div class="days" role="group" aria-label="Choose a day">
        ${D.weekdays(mon).map(d => {
          const n = days && days[d] ? days[d].breakfast.length + days[d].lunch.length : 0;
          const isT = d === state.today, canRate = prefix === "s-" && n > 0 && rateable(d);
          return `<button class="day${isT ? " is-today" : ""}${canRate ? " can-rate" : ""}" data-act="${prefix}day" data-date="${d}" aria-pressed="${d === sel}"
            aria-label="${D.fmt(d, { weekday: "long", month: "long", day: "numeric" })}${isT ? ", today" : ""}${days ? `, ${plural(n, "dish", "dishes")}` : ""}${canRate ? ", you can rate" : ""}">
            <span class="day-w">${isT ? "Today" : D.fmt(d, { weekday: "short" })}</span><span class="day-n">${D.fmt(d, { day: "numeric" })}</span>
            <span class="day-dot${n ? "" : " off"}"></span></button>`;
        }).join("")}
      </div>
    </div>`;
  }

  function mealSeg(day, sel, act) {
    return `<div class="seg" role="group" aria-label="Meal">${Object.entries(MEALS).map(([k, l]) =>
      `<button data-act="${act}" data-meal="${k}" aria-pressed="${k === sel}">${l}<span class="seg-n">${day ? day[k].length : 0}</span></button>`).join("")}</div>`;
  }

  // The most recent day (within the rating window) that has food you could rate.
  function lastRateableDay() {
    for (let i = 0; i < RATE_DAYS; i++) {
      const d = D.add(state.today, -i), wk = state.weeks[D.monday(d)];
      const day = wk && wk.days && wk.days[d];
      if (day && day.breakfast.length + day.lunch.length) return d;
    }
    return null;
  }

  function rateBanner(day, date) {
    const items = day ? [...day.breakfast, ...day.lunch] : [];
    if (!items.length) return "";
    if (rateable(date)) {
      const done = items.filter(it => state.mine[date + "|" + it.id]).length;
      return `<div class="rate-banner open">
        <span class="rb-ic">${icon("thumbUp")}</span>
        <div class="rb-main"><p class="rb-t">${done === items.length ? "You rated everything. Thank you!" : "Rate what you ate"}</p>
          <p class="rb-s">${done === items.length ? `You can change a rating until ${shortDay(rateUntil(date))}.` : "Tap Good, Mid, or Bad under a dish."}</p></div>
        <span class="rb-count" aria-label="${done} of ${items.length} rated">${done}/${items.length}</span>
      </div>`;
    }
    const target = lastRateableDay();
    const jump = target && target !== date
      ? `<button class="btn primary sm" data-act="s-goto" data-date="${target}">Rate ${target === state.today ? "today's" : D.fmt(target, { weekday: "long" }) + "'s"} food${icon("arrowR")}</button>` : "";
    if (date > state.today) {
      return `<div class="rate-banner soon"><span class="rb-ic">${icon("clock")}</span>
        <div class="rb-main"><p class="rb-t">Coming up ${D.fmt(date, { weekday: "long" })}</p><p class="rb-s">You can rate these after they're served.</p>${jump}</div></div>`;
    }
    return `<div class="rate-banner closed"><span class="rb-ic">${icon("lock")}</span>
      <div class="rb-main"><p class="rb-t">Rating closed for this day</p><p class="rb-s">Food can be rated for ${RATE_DAYS} days after it's served.</p>${jump}</div></div>`;
  }

  function howItWorks() {
    if (LS.get("ll_tips_done")) return "";
    return `<section class="howto" aria-labelledby="howto-t">
      <div class="howto-head"><h2 id="howto-t">New here? It's 3 steps</h2><button class="btn secondary sm" data-act="tips-done">Got it</button></div>
      <ol>
        <li><span class="howto-ic">1</span>Pick a day to see its food</li>
        <li><span class="howto-ic">2</span>Rate what you ate</li>
        <li><span class="howto-ic">3</span>Suggest a dish you want</li>
      </ol>
    </section>`;
  }

  function viewMenu() {
    const st = state.student;
    if (!state.week) initStudentWeek();
    const wk = state.weeks[state.week];
    const date = state.day;
    const isToday = date === state.today;
    const title = isToday ? "Today's menu" : D.fmt(date, { weekday: "long" }) + "'s menu";
    const eyebrow = isToday ? D.fmt(date, { weekday: "long", month: "long", day: "numeric" })
      : `${D.fmt(date, { month: "long", day: "numeric" })}${D.isWeekend(state.today) && D.monday(date) === D.monday(state.today) ? ` · Today is ${D.fmt(state.today, { weekday: "long" })}, no school lunch` : ""}`;
    let body;
    if (!wk) { loadWeek(state.week); body = skeleton(3); }
    else if (wk.error) body = errorBox(wk.error, "retry-week");
    else {
      const day = wk.days[date];
      if (!state.meal) state.meal = defaultMeal(day);
      const items = day ? day[state.meal] : [];
      const flagged = [...st.allergies.map(a => ALLERGENS[a]), ...terms(st.allergyOther).map(cap)];
      body = `${rateBanner(day, date)}
        ${mealSeg(day, state.meal, "meal")}
        ${items.length ? `<div class="dishes">${items.map(it => dishCard(it, date)).join("")}</div>`
          : `<div class="empty"><span class="empty-ic">${icon("utensils")}</span><p>${day ? `No ${MEALS[state.meal].toLowerCase()} posted for ${D.fmt(date, { weekday: "long" })}.` : `The cafeteria hasn't posted a menu for ${D.fmt(date, { weekday: "long" })} yet.`}</p></div>`}
        <div class="notice">${icon("info")}<p><strong>Allergen info is a guide only.</strong> Always confirm with cafeteria staff before eating.${flagged.length ? ` We flag <strong>${esc(listJoin(flagged))}</strong> in red for you.` : ""}</p></div>`;
    }
    return `${head(eyebrow, title, "")}
      ${howItWorks()}
      ${weekStrip(state.week, date, wk && wk.days, "s-")}
      ${body}`;
  }

  function dishCard(item, date) {
    const st = state.student;
    const hits = allergyHits(item, st);
    const warn = hits.contains.length > 0, caution = !warn && hits.may.length > 0;
    const picked = pickedFor(item, st, hits);
    const badges = [];
    if (picked) badges.push(`<span class="badge brand">${icon("sparkles")}Picked for you</span>`);
    const cl = cuisineLabel(item);
    item.diet.forEach(k => badges.push(`<span class="badge${k === "spicy" ? " hot" : k === "vegan" || k === "vegetarian" ? " veg" : ""}">${DIETS[k]}</span>`));
    if (item.calories) badges.push(`<span class="badge plain">${item.calories} cal</span>`);

    const mine = new Set(st.allergies);
    const otherTerms = terms(st.allergyOther);
    const chip = (label, hit) => `<li class="chip${hit ? " hit" : ""}">${hit ? icon("alert") : ""}${esc(label)}</li>`;
    const containsChips = [
      ...item.allergens.map(a => chip(ALLERGENS[a], mine.has(a))),
      ...terms(item.allergens_other).map(t => chip(cap(t), otherTerms.some(o => textHas(t, o)))),
    ];
    const mayList = item.may.map(a => ALLERGENS[a]);
    const id = item.id;

    return `<article class="dish${warn ? " is-warn" : caution ? " is-caution" : ""}" id="dish-${id}" aria-labelledby="dn-${id}">
      ${item.photo ? `<div class="dish-photo"><img src="${esc(item.photo)}" alt="Photo of ${esc(item.name)}" loading="lazy" decoding="async"></div>` : ""}
      <div class="dish-body">
        ${badges.length ? `<div class="badges">${badges.join("")}</div>` : ""}
        <h3 class="dish-name" id="dn-${id}">${esc(item.name)}</h3>
        ${item.desc ? `<p class="dish-desc">${esc(item.desc)}</p>` : ""}
        ${warn ? `<div class="alert danger">${icon("alert")}<p><strong>Has ${esc(listJoin(hits.contains))}</strong>, which you're allergic to.${hits.may.length ? ` May also have ${esc(listJoin(hits.may))}.` : ""}</p></div>` : ""}
        ${caution ? `<div class="alert caution">${icon("alert")}<p><strong>May contain ${esc(listJoin(hits.may))}.</strong> Ask staff before eating.</p></div>` : ""}
        <div class="contains">
          <span class="mini-label">Contains</span>
          ${containsChips.length ? `<ul class="chips">${containsChips.join("")}</ul>` : '<span class="none">None of the 9 major allergens listed</span>'}
        </div>
        <details class="more">
          <summary><span>Ingredients &amp; allergy details</span>${icon("chevD")}</summary>
          <dl class="facts">
            <div><dt>Ingredients</dt><dd>${item.ingredients ? esc(item.ingredients) : "Not listed yet. Ask cafeteria staff."}</dd></div>
            <div><dt>Contains</dt><dd>${esc(listJoin([...item.allergens.map(a => ALLERGENS[a]), ...terms(item.allergens_other).map(cap)])) || "No major allergens listed"}</dd></div>
            <div><dt>May contain</dt><dd>${mayList.length || item.may_other ? esc([listJoin(mayList), item.may_other].filter(Boolean).join(". ")) : "No cross-contact warnings listed"}</dd></div>
            ${item.calories ? `<div><dt>Calories</dt><dd>About ${item.calories}</dd></div>` : ""}
            ${cl ? `<div><dt>Cuisine</dt><dd>${esc(cl)}</dd></div>` : ""}
            ${item.diet.length ? `<div><dt>Diet</dt><dd>${item.diet.map(k => DIETS[k]).join(", ")}</dd></div>` : ""}
          </dl>
        </details>
      </div>
      <div class="rate" id="rate-${id}">${rateBlock(item, date)}</div>
    </article>`;
  }

  function rateBlock(item, date) {
    const id = item.id, rec = state.mine[date + "|" + id];
    if (date > state.today) return `<p class="rate-note">${icon("clock")}Rate it after it's served on ${shortDay(date)}.</p>`;
    if (!rateable(date)) {
      return rec
        ? `<p class="rate-note">${icon(RATINGS[rec.vote].icon)}You rated this <strong class="v-${rec.vote}">${RATINGS[rec.vote].label}</strong>.</p>`
        : `<p class="rate-note">${icon("lock")}Rating closed for this dish.</p>`;
    }
    const v = rec?.vote;
    return `<p class="rate-q" id="rq-${id}">${v ? "Your rating. Tap another to change it." : "Ate this? Rate it:"}</p>
      <div class="rate-btns" role="group" aria-labelledby="rq-${id}">
        ${Object.entries(RATINGS).map(([k, r]) => `<button class="rate-btn r-${k}" data-act="rate" data-id="${id}" data-vote="${k}" aria-pressed="${v === k}">${icon(r.icon)}<span>${r.label}</span></button>`).join("")}
      </div>
      ${v ? commentBlock(id, rec) : ""}`;
  }

  function commentBlock(id, rec) {
    if (state.openComment.has(id)) {
      const val = state.cDraft[id] ?? rec.comment ?? "";
      return `<div class="comment">
        <label class="label" for="c-${id}">Tell the cafeteria why <span class="muted">(optional)</span></label>
        <textarea class="input" id="c-${id}" data-comment="${id}" maxlength="${COMMENT_MAX}" rows="3" placeholder="e.g. The fries were cold, but the sauce was great">${esc(val)}</textarea>
        <div class="comment-foot">
          <span class="count" id="cc-${id}">${val.length}/${COMMENT_MAX}</span>
          <button class="btn ghost sm" data-act="c-cancel" data-id="${id}">Not now</button>
          <button class="btn primary sm" data-act="c-send" data-id="${id}">Send</button>
        </div>
      </div>`;
    }
    if (rec.comment) {
      return `<div class="sent"><p>${icon("message")}<span>“${esc(rec.comment)}”</span></p><button class="link" data-act="c-open" data-id="${id}">Edit</button></div>`;
    }
    return `<button class="link add-comment" data-act="c-open" data-id="${id}">${icon("message")}Add a comment for the cafeteria</button>`;
  }

  function patchRate(id, focusSel) {
    const box = $("#rate-" + id);
    if (!box) return;
    const wk = state.weeks[state.week], day = wk && wk.days && wk.days[state.day];
    const item = day && [...day.breakfast, ...day.lunch].find(i => i.id === id);
    if (!item) return;
    box.innerHTML = rateBlock(item, state.day);
    const banner = $(".rate-banner");
    if (banner) banner.outerHTML = rateBanner(day, state.day);
    if (focusSel) box.querySelector(focusSel)?.focus();
  }

  async function rate(id, vote) {
    const date = state.day;
    if (!rateable(date)) return;
    const key = date + "|" + id, prev = state.mine[key];
    if (prev?.vote === vote) return;
    state.mine[key] = { ...(prev || {}), item_id: id, date, vote, comment: prev?.comment || "" };
    if (!prev) state.openComment.add(id);
    patchRate(id, `[data-vote="${vote}"]`);
    try {
      const saved = await enqueue(id, () => api("POST", "votes", {
        school: state.student.school.id, voter_id: state.voter, date, item_id: id, vote, comment: state.mine[key]?.comment || "",
      }));
      if (state.mine[key]?.vote === vote) state.mine[key] = { ...state.mine[key], ...saved, comment: state.mine[key].comment };
      toast(prev ? "Rating updated" : "Thanks! The cafeteria will see your rating.");
    } catch (e) {
      if (state.mine[key]?.vote === vote) {
        if (prev) state.mine[key] = prev; else { delete state.mine[key]; state.openComment.delete(id); }
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
    if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
    try {
      const saved = await enqueue(id, () => api("POST", "votes", {
        school: state.student.school.id, voter_id: state.voter, date: state.day, item_id: id, vote: state.mine[key].vote, comment: text,
      }));
      state.mine[key] = { ...state.mine[key], comment: saved.comment };
      state.openComment.delete(id); delete state.cDraft[id];
      patchRate(id, text ? '[data-act="c-open"]' : `[data-vote="${state.mine[key].vote}"]`);
      toast(text ? "Comment sent to the cafeteria" : "Comment removed");
    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = "Send"; }
      toast(e.message, true);
    }
  }

  // ----- suggestions (students' ideas for future dishes) -----
  async function loadIdeas() {
    if (state.loading.has("ideas")) return;
    state.loading.add("ideas");
    const s = school(), mode = state.mode;
    try {
      const voter = mode === "student" ? `&voter=${encodeURIComponent(state.voter)}` : "";
      const ideas = (await api("GET", `ideas?school=${s.id}${voter}`)).ideas;
      if (state.mode === mode) state.ideas = ideas;
    } catch (e) { if (state.mode === mode) state.ideas = { error: e.message }; }
    state.loading.delete("ideas");
    if (state.mode && !state.ob && currentTab() === "ideas") render();
  }

  function ideaList(admin) {
    const ideas = state.ideas;
    if (!ideas) { loadIdeas(); return skeleton(3); }
    if (ideas.error) return errorBox(ideas.error, "retry-ideas");
    if (!ideas.length) {
      return `<div class="empty"><span class="empty-ic">${icon("sparkles")}</span><p>${admin ? "No suggestions yet. Students can suggest dishes from their Suggest tab." : "No suggestions yet. Be the first!"}</p></div>`;
    }
    return `<ol class="ideas">${ideas.map((it, i) => `<li class="idea">
      <span class="idea-rank">${i + 1}</span>
      <div class="idea-main"><p class="idea-text">${esc(it.text)}</p><p class="idea-meta">${it.own ? "Your suggestion · " : ""}${timeAgo(it.created_at)}</p></div>
      ${admin
        ? `<span class="idea-count" aria-label="${plural(it.count, "vote")}">${icon("arrowUp")}${it.count}</span>
           <button class="icon-btn danger" data-act="idea-del" data-id="${it.id}" aria-label="Remove suggestion: ${esc(it.text)}">${icon("trash")}</button>`
        : `<button class="vote-btn" data-act="idea-vote" data-id="${it.id}" aria-pressed="${it.voted}" aria-label="Me too: ${esc(it.text)}. ${plural(it.count, "vote")}">${icon("arrowUp")}<span>${it.count}</span></button>`}
    </li>`).join("")}</ol>`;
  }

  function viewIdeasStudent() {
    return `${head("Suggest", "Suggest a dish", "What should the cafeteria make? Type it below. If someone already suggested it, tap ↑ to agree. The most popular ones go to the top.")}
      <form class="idea-form" data-form="idea">
        <label class="sr-only" for="idea-in">Your suggestion</label>
        <input class="input" id="idea-in" maxlength="${IDEA_MAX}" placeholder="e.g. Korean fried chicken on Fridays" autocomplete="off" enterkeyhint="send">
        <button class="btn primary" type="submit">${icon("plus")}Post</button>
      </form>
      ${ideaList(false)}`;
  }

  async function postIdea(input) {
    const text = input.value.trim();
    if (text.length < 2) { toast("Write a little more about the dish.", true); input.focus(); return; }
    const btn = input.form.querySelector("button");
    btn.disabled = true;
    try {
      const idea = await api("POST", "ideas", { school: state.student.school.id, voter_id: state.voter, text });
      if (Array.isArray(state.ideas)) { state.ideas.push(idea); sortIdeas(); }
      render();
      toast("Suggestion posted");
      $("#idea-in")?.focus();
    } catch (e) { btn.disabled = false; toast(e.message, true); }
  }
  const sortIdeas = () => { if (Array.isArray(state.ideas)) state.ideas.sort((a, b) => b.count - a.count || b.created_at.localeCompare(a.created_at)); };

  async function voteIdea(id) {
    const it = Array.isArray(state.ideas) && state.ideas.find(x => x.id === id);
    if (!it) return;
    const on = !it.voted, before = { voted: it.voted, count: it.count };
    it.voted = on; it.count += on ? 1 : -1;
    render();
    $(`[data-act="idea-vote"][data-id="${id}"]`)?.focus();
    try {
      const r = await enqueue("idea-" + id, () => api("POST", `ideas/${id}/vote`, { school: state.student.school.id, voter_id: state.voter, on }));
      if (it.voted === on) it.count = r.count;
    } catch (e) {
      if (it.voted === on) Object.assign(it, before);
      toast(e.message, true);
      if (e.status === 404) state.ideas = null;
    }
    sortIdeas();
    render();
    $(`[data-act="idea-vote"][data-id="${id}"]`)?.focus();
  }

  // ----- me -----
  function viewMe() {
    const st = state.student, s = st.school;
    const allergies = [...st.allergies.map(a => ALLERGENS[a]), ...terms(st.allergyOther).map(cap)];
    const foods = [...st.cuisines.map(c => CUISINES[c][0]), ...terms(st.cuisineOther).map(cap)];
    return `${head("Your profile", `Hi, ${esc(st.name)}`, "")}
      <div class="group">
        <div class="cell">
          <span class="cell-ic">${icon("school")}</span>
          <div class="cell-main"><p class="cell-t">${esc(s.name)}</p><p class="cell-s">School code <span class="mono">${esc(s.code)}</span></p></div>
          <button class="btn secondary sm" data-act="copy" data-text="${esc(inviteLink(s.code))}" data-label="Invite link">${icon("link")}Invite</button>
        </div>
        <button class="cell" data-act="edit" data-step="allergies">
          <span class="cell-ic danger">${icon("alert")}</span>
          <div class="cell-main"><p class="cell-t">Allergies</p><p class="cell-s">${allergies.length ? esc(listJoin(allergies)) : "None"}</p></div>${icon("chevR")}
        </button>
        <button class="cell" data-act="edit" data-step="food">
          <span class="cell-ic brand">${icon("sparkles")}</span>
          <div class="cell-main"><p class="cell-t">Food you like</p><p class="cell-s">${foods.length ? esc(listJoin(foods)) : "Not set"}</p></div>${icon("chevR")}
        </button>
        <button class="cell" data-act="edit" data-step="name">
          <span class="cell-ic">${icon("user")}</span>
          <div class="cell-main"><p class="cell-t">Name</p><p class="cell-s">${esc(st.name)}</p></div>${icon("chevR")}
        </button>
      </div>
      <p class="fine left">${icon("lock")}Your name and allergies are saved only on this device. Ratings and comments are sent without your name.</p>
      <div class="group">
        ${state.admin ? `<button class="cell" data-act="to-admin"><span class="cell-ic">${icon("chef")}</span><div class="cell-main"><p class="cell-t">Organizer view</p><p class="cell-s">${esc(state.admin.school.name)}</p></div>${icon("chevR")}</button>` : ""}
        <button class="cell" data-act="leave"><span class="cell-ic">${icon("logout")}</span><div class="cell-main"><p class="cell-t">Sign out</p><p class="cell-s">Leave ${esc(s.name)} on this device</p></div>${icon("chevR")}</button>
      </div>`;
  }

  // ================= ORGANIZER =================
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

  async function loadInsights() {
    if (state.loading.has("ins")) return;
    state.loading.add("ins");
    const range = state.range, s = state.admin.school;
    let result;
    for (let attempt = 0; attempt < 2; attempt++) {
      const { from, to } = rangeDates();
      try {
        const [data, ideas] = await Promise.all([
          api("GET", `insights?school=${s.id}&from=${from}&to=${to}`, undefined, { admin: true }),
          api("GET", `ideas?school=${s.id}`),
        ]);
        // If this device's clock disagrees with the server's, redo the range with the server's "today".
        if (data.today !== to && attempt === 0) { state.today = data.today; continue; }
        result = { range, from, to, data, ideas: ideas.ideas, stats: computeInsights(data) };
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

  function adminGone() {
    LS.del("ll_admin"); state.admin = null;
    toast("You were signed out: that school was deleted or the admin key no longer works.", true);
    if (state.student) setMode("student"); else leaveToWelcome();
  }

  function computeInsights(data) {
    const meta = {};
    for (const day of Object.values(data.days)) for (const meal of Object.keys(MEALS)) for (const it of day[meal]) meta[it.id] = { it, date: day.date, meal };
    const T = () => ({ good: 0, mid: 0, bad: 0, total: 0 });
    const add = (t, v) => { t[v]++; t.total++; };
    const total = T(), byDate = {}, byMeal = { breakfast: T(), lunch: T() }, byCuisine = {}, byDish = {}, who = new Set(), comments = [];
    for (const v of data.votes) {
      const m = meta[v.item_id];
      if (!m) continue; // dish was deleted from the menu
      add(total, v.vote); who.add(v.who);
      add(byDate[v.date] ||= T(), v.vote);
      add(byMeal[m.meal], v.vote);
      const c = cuisineLabel(m.it) || "No cuisine set";
      add(byCuisine[c] ||= T(), v.vote);
      const k = m.it.name.trim().toLowerCase();
      const dish = byDish[k] ||= { name: m.it.name, t: T(), meals: new Set(), photo: "" };
      add(dish.t, v.vote); dish.meals.add(m.meal);
      if (m.it.photo) dish.photo = m.it.photo;
      if (v.comment) comments.push({ ...v, name: m.it.name, meal: m.meal });
    }
    comments.sort((a, b) => b.date.localeCompare(a.date) || b.updated_at.localeCompare(a.updated_at));
    return { total, byDate, byMeal, byCuisine, dishes: Object.values(byDish), students: who.size, comments };
  }

  const stackBar = (t, label) => `<div class="stack${t.total ? "" : " empty"}" role="img" aria-label="${esc(label ? label + ": " : "")}${t.good} good, ${t.mid} mid, ${t.bad} bad">${
    ["good", "mid", "bad"].map(k => (t[k] ? `<span class="s-${k}" style="width:${(100 * t[k]) / t.total}%"></span>` : "")).join("")}</div>`;
  const legend = `<ul class="legend" aria-hidden="true"><li><span class="s-good"></span>Good</li><li><span class="s-mid"></span>Mid</li><li><span class="s-bad"></span>Bad</li></ul>`;

  function dailyChart(stats, from, to) {
    const span = D.span(from, to);
    const zero = () => ({ good: 0, mid: 0, bad: 0, total: 0 });
    let cols = [];
    if (span <= 31) {
      for (let i = 0; i < span; i++) {
        const d = D.add(from, i);
        if (D.isWeekend(d) && !stats.byDate[d]) continue;
        cols.push({ key: d, t: stats.byDate[d] || zero(), x: span <= 7 ? D.fmt(d, { weekday: "short" }) : D.fmt(d, { day: "numeric" }), long: shortDay(d) });
      }
    } else {
      const weeks = {};
      for (const [d, t] of Object.entries(stats.byDate)) {
        const acc = weeks[D.monday(d)] ||= zero();
        ["good", "mid", "bad", "total"].forEach(k => { acc[k] += t[k]; });
      }
      for (let w = D.monday(from); w <= to; w = D.add(w, 7)) {
        cols.push({ key: w, t: weeks[w] || zero(), x: D.fmt(w, { month: "numeric", day: "numeric" }), long: `Week of ${shortDay(w)}` });
      }
      if (cols.length > 26) cols = cols.slice(-26);
    }
    const max = Math.max(1, ...cols.map(c => c.t.total));
    return `<div class="cols" style="--n:${cols.length}">${cols.map(c => `<div class="col" role="img" aria-label="${esc(c.long)}: ${c.t.total ? `${c.t.good} good, ${c.t.mid} mid, ${c.t.bad} bad` : "no ratings"}">
        <span class="col-v">${c.t.total || ""}</span>
        <div class="col-track"><div class="col-bar" style="height:${c.t.total ? Math.max(4, (100 * c.t.total) / max) : 0}%">
          ${["bad", "mid", "good"].map(k => (c.t[k] ? `<span class="s-${k}" style="flex:${c.t[k]}"></span>` : "")).join("")}
        </div></div>
        <span class="col-x${c.key === state.today ? " now" : ""}">${esc(c.x)}</span></div>`).join("")}</div>`;
  }

  function rankList(list, kind) {
    if (!list.length) return `<p class="muted small">Not enough rated dishes yet.</p>`;
    return `<ol class="rank">${list.map((d, i) => {
      const p = kind === "bad" ? Math.round((100 * d.t.bad) / d.t.total) : pct(d.t);
      return `<li>
        <span class="rank-n">${i + 1}</span>
        ${d.photo ? `<img class="rank-img" src="${esc(d.photo)}" alt="" loading="lazy">` : ""}
        <div class="rank-main"><p class="rank-t">${esc(d.name)}</p>${stackBar(d.t, d.name)}</div>
        <p class="rank-p ${kind === "bad" ? "v-bad" : "v-good"}"><strong>${p}%</strong><span>${kind === "bad" ? "disliked" : "liked"} · ${d.t.total}</span></p>
      </li>`;
    }).join("")}</ol>`;
  }

  function viewInsights() {
    const s = state.admin.school, ins = state.insights;
    const ranges = [["7", "7 days"], ["30", "30 days"], ["all", "All time"]];
    const top = `${head(esc(s.name), "Insights", "What students think of the food, from their ratings and comments.",
      `<button class="icon-btn outlined" data-act="refresh-ins" aria-label="Refresh">${icon("refresh")}</button>`)}
      <div class="seg narrow" role="group" aria-label="Time range">${ranges.map(([k, l]) => `<button data-act="range" data-range="${k}" aria-pressed="${state.range === k}">${l}</button>`).join("")}</div>`;
    if (!ins || ins.range !== state.range) { loadInsights(); return top + skeleton(4); }
    if (ins.error) return top + errorBox(ins.error, "refresh-ins");
    const st = ins.stats;
    if (!st.total.total) {
      return `${top}<div class="empty big"><span class="empty-ic">${icon("chart")}</span>
        <p><strong>No ratings ${state.range === "all" ? "yet" : "in this period"}.</strong><br>Share your join code so students can start rating their food.</p>
        <p class="big-code">${esc(s.code)}</p>
        <div class="row-btns center"><button class="btn secondary" data-act="copy" data-text="${esc(s.code)}" data-label="Join code">${icon("copy")}Copy code</button>
        <button class="btn secondary" data-act="copy" data-text="${esc(inviteLink(s.code))}" data-label="Invite link">${icon("link")}Copy invite link</button></div></div>
        ${ins.ideas.length ? ideasCard(ins.ideas) : ""}`;
    }
    const dishes = st.dishes;
    // Rank with a small prior so 3-for-3 doesn't outrank 12-for-13; the shown % stays the real one.
    const goodScore = t => (t.good + 1) / (t.total + 2), badScore = t => (t.bad + 1) / (t.total + 2);
    const byGood = [...dishes].sort((a, b) => goodScore(b.t) - goodScore(a.t) || b.t.total - a.t.total);
    const k = Math.min(5, Math.ceil(dishes.length / 2));
    const loved = byGood.slice(0, k);
    const lovedSet = new Set(loved);
    const needs = dishes.filter(d => !lovedSet.has(d))
      .sort((a, b) => badScore(b.t) - badScore(a.t) || goodScore(a.t) - goodScore(b.t) || b.t.total - a.t.total)
      .slice(0, 5);
    const cuisines = Object.entries(st.byCuisine).sort((a, b) => pct(b[1]) - pct(a[1]) || b[1].total - a[1].total);
    const commentCount = st.comments.length;
    const long = D.span(ins.from, ins.to) > 31;

    return `${top}
      <div class="kpis">
        <div class="kpi hl"><p class="kpi-l">Liked it</p><p class="kpi-v">${pct(st.total)}%</p><p class="kpi-s">of ratings were Good</p></div>
        <div class="kpi"><p class="kpi-l">Ratings</p><p class="kpi-v">${st.total.total}</p><p class="kpi-s">${st.total.good} good · ${st.total.mid} mid · ${st.total.bad} bad</p></div>
        <div class="kpi"><p class="kpi-l">Students</p><p class="kpi-v">${st.students}</p><p class="kpi-s">different devices</p></div>
        <div class="kpi"><p class="kpi-l">Comments</p><p class="kpi-v">${commentCount}</p><p class="kpi-s">written feedback</p></div>
      </div>
      <section class="card">
        <div class="card-head"><h2>Ratings by ${long ? "week" : "day"}</h2>${legend}</div>
        ${dailyChart(st, ins.from, ins.to)}
      </section>
      <div class="grid2">
        <section class="card"><div class="card-head"><h2>Most loved</h2></div>${rankList(loved, "good")}</section>
        <section class="card"><div class="card-head"><h2>Needs work</h2></div>${rankList(needs, "bad")}</section>
      </div>
      <div class="grid2">
        <section class="card"><div class="card-head"><h2>Breakfast/snacks vs. lunch</h2></div>
          <ul class="hbars">${Object.entries(MEALS).map(([m, l]) => {
            const t = st.byMeal[m];
            return `<li><div class="hbar-top"><span>${l}</span><span>${t.total ? `<strong>${pct(t)}%</strong> liked · ${t.total}` : "No ratings"}</span></div>${stackBar(t, l)}</li>`;
          }).join("")}</ul>
        </section>
        <section class="card"><div class="card-head"><h2>Favorite cuisines</h2></div>
          <ul class="hbars">${cuisines.map(([c, t]) => `<li><div class="hbar-top"><span>${esc(c)}</span><span><strong>${pct(t)}%</strong> liked · ${t.total}</span></div>${stackBar(t, c)}</li>`).join("")}</ul>
        </section>
      </div>
      <section class="card">
        <div class="card-head"><h2>What students said</h2><span class="muted small">${plural(commentCount, "comment")}</span></div>
        ${commentCount ? `<ul class="feed">${st.comments.slice(0, 40).map(c => `<li>
            <span class="pill v-${c.vote}">${icon(RATINGS[c.vote].icon)}${RATINGS[c.vote].label}</span>
            <div class="feed-main"><p class="feed-q">“${esc(c.comment)}”</p><p class="feed-m"><strong>${esc(c.name)}</strong> · ${MEALS[c.meal]} · ${shortDay(c.date)}</p></div>
          </li>`).join("")}</ul>` : '<p class="muted small">No written comments in this period.</p>'}
      </section>
      ${ins.ideas.length ? ideasCard(ins.ideas) : ""}
      <section class="card">
        <div class="card-head"><h2>Every dish</h2><span class="muted small">${plural(dishes.length, "dish", "dishes")}</span></div>
        <ul class="hbars">${[...dishes].sort((a, b) => b.t.total - a.t.total || pct(b.t) - pct(a.t)).map(d =>
          `<li><div class="hbar-top"><span>${esc(d.name)} <span class="muted">· ${[...d.meals].map(m => MEALS[m]).join(" & ")}</span></span><span><strong>${pct(d.t)}%</strong> liked · ${d.t.total}</span></div>${stackBar(d.t, d.name)}</li>`).join("")}</ul>
      </section>`;
  }

  function ideasCard(ideas) {
    return `<section class="card">
      <div class="card-head"><h2>Top student suggestions</h2><a class="link" href="#ideas">See all</a></div>
      <ol class="ideas compact">${ideas.slice(0, 3).map((it, i) => `<li class="idea"><span class="idea-rank">${i + 1}</span>
        <div class="idea-main"><p class="idea-text">${esc(it.text)}</p></div><span class="idea-count" aria-label="${plural(it.count, "vote")}">${icon("arrowUp")}${it.count}</span></li>`).join("")}</ol>
    </section>`;
  }

  function viewIdeasAdmin() {
    return `${head(esc(state.admin.school.name), "Student suggestions", "Dishes students want you to make, ranked by how many agree. Remove anything inappropriate.",
      `<button class="icon-btn outlined" data-act="retry-ideas" aria-label="Refresh">${icon("refresh")}</button>`)}${ideaList(true)}`;
  }

  // ----- menu editor -----
  function initAdminWeek() {
    const d = homeDay(state.today);
    state.aWeek = D.monday(d); state.aDay = d;
  }
  async function loadAdminWeek(mon) {
    const key = "a" + mon;
    if (state.loading.has(key)) return;
    state.loading.add(key);
    try {
      const m = await api("GET", `menu?school=${state.admin.school.id}&from=${mon}&to=${D.add(mon, 4)}`);
      if (state.mode !== "admin") return;
      state.aWeeks[mon] = { days: m.days };
      state.today = m.today;
    } catch (e) {
      if (e.status === 404 && /school/i.test(e.message)) { state.loading.delete(key); adminGone(); return; }
      state.aWeeks[mon] = { error: e.message };
    } finally {
      state.loading.delete(key);
    }
    if (state.mode === "admin" && !state.ob && currentTab() === "kitchen" && state.aWeek === mon) render();
  }
  const emptyDay = date => ({ date, breakfast: [], lunch: [] });

  function viewKitchen() {
    if (!state.aWeek) initAdminWeek();
    const wk = state.aWeeks[state.aWeek], date = state.aDay;
    let body;
    if (!wk) { loadAdminWeek(state.aWeek); body = skeleton(3); }
    else if (wk.error) body = errorBox(wk.error, "retry-aweek");
    else {
      const day = wk.days[date] || emptyDay(date);
      const items = day[state.aMeal];
      const weekEmpty = !D.weekdays(state.aWeek).some(d => wk.days[d]);
      body = `${mealSeg(day, state.aMeal, "a-meal")}
        <div class="edit-list">
          ${items.length ? items.map(it => `<button class="edit-row" data-act="edit-dish" data-id="${it.id}">
              ${it.photo ? `<img class="thumb" src="${esc(it.photo)}" alt="" loading="lazy">` : `<span class="thumb ph">${icon("image")}</span>`}
              <span class="edit-main"><span class="edit-t">${esc(it.name)}</span>
                <span class="edit-s">${it.allergens.length || it.allergens_other ? "Contains " + esc(listJoin([...it.allergens.map(a => ALLERGENS[a]), ...terms(it.allergens_other).map(cap)])) : "No major allergens"}${it.photo ? "" : " · No photo"}</span></span>
              <span class="edit-go">${icon("pencil")}<span class="sr-only">Edit</span></span>
            </button>`).join("")
            : `<div class="empty slim"><p>No ${MEALS[state.aMeal].toLowerCase()} for ${D.fmt(date, { weekday: "long" })} yet.</p></div>`}
        </div>
        <div class="row-btns">
          <button class="btn primary" data-act="add-dish">${icon("plus")}Add to ${MEALS[state.aMeal]}</button>
          ${weekEmpty ? `<button class="btn secondary" data-act="fill-sample">${icon("sparkles")}Fill this week with sample dishes</button>` : ""}
        </div>`;
    }
    return `${head(esc(state.admin.school.name), "Menu", "Pick a day, then add or edit its food. Students see changes right away.")}
      ${weekStrip(state.aWeek, date, wk && wk.days, "a-")}
      ${body}`;
  }

  async function saveAdminDay(date, day) {
    const res = await api("PUT", "menu", { school: state.admin.school.id, days: [day] }, { admin: true });
    const wk = state.aWeeks[D.monday(date)];
    if (wk && wk.days) {
      const saved = res.days[date];
      if (saved && (saved.breakfast.length || saved.lunch.length)) wk.days[date] = saved;
      else delete wk.days[date];
    }
    state.insights = null;
  }

  async function fillSample() {
    const mon = state.aWeek;
    const btn = $('[data-act="fill-sample"]');
    if (btn) { btn.disabled = true; btn.textContent = "Adding…"; }
    try {
      const res = await api("PUT", "menu", { school: state.admin.school.id, days: sampleDays(mon, 1) }, { admin: true });
      state.aWeeks[mon] = { days: res.days };
      state.insights = null;
      render();
      toast("Sample dishes added. Tap any dish to edit it.");
    } catch (e) { toast(e.message, true); render(); }
  }

  // Editor sheet
  function openEditor(id) {
    const wk = state.aWeeks[state.aWeek], day = (wk && wk.days[state.aDay]) || emptyDay(state.aDay);
    const found = id && day[state.aMeal].find(i => i.id === id);
    const blank = { name: "", desc: "", ingredients: "", allergens: [], allergens_other: "", may: [], may_other: "", diet: [], cuisine: "", cuisine_other: "", calories: null, photo: "" };
    state.edit = { id: found ? found.id : null, date: state.aDay, meal: state.aMeal, item: JSON.parse(JSON.stringify(found || blank)), busy: false, uploading: false };
    sheet.innerHTML = editorHTML();
    sheet.showModal();
    sheet.scrollTop = 0;
    if (!found && matchMedia("(hover: hover)").matches) $("#ed-name")?.focus();
    else $("#ed-close")?.focus();
  }

  function chipToggles(field, entries, selected) {
    return `<div class="toggles">${entries.map(([k, l]) =>
      `<button type="button" class="toggle" data-act="ed-chip" data-field="${field}" data-key="${k}" aria-pressed="${selected.includes(k)}">${l}</button>`).join("")}</div>`;
  }

  function editorHTML() {
    const e = state.edit, it = e.item;
    return `<form class="editor" data-form="editor" novalidate>
      <header class="sheet-head">
        <button type="button" class="icon-btn" id="ed-close" data-act="ed-close" aria-label="Close without saving">${icon("x")}</button>
        <div class="sheet-title"><h2 id="sheet-title">${e.id ? "Edit dish" : "New dish"}</h2>
          <p class="sheet-sub">${MEALS[e.meal]} · ${D.fmt(e.date, { weekday: "long", month: "long", day: "numeric" })}</p></div>
        <button type="submit" class="btn primary sm" id="ed-save"${e.uploading ? " disabled" : ""}>Save</button>
      </header>
      <div class="sheet-body">
        <div class="photo-field" id="ed-photo-box">${photoFieldHTML()}</div>

        <label class="label" for="ed-name">Dish name <span class="req">Required</span></label>
        <input class="input" id="ed-name" data-ed="name" value="${esc(it.name)}" maxlength="80" placeholder="e.g. Chicken Tenders & Fries">

        <label class="label" for="ed-desc">Short description</label>
        <input class="input" id="ed-desc" data-ed="desc" value="${esc(it.desc)}" maxlength="200" placeholder="What's on the plate">

        <label class="label" for="ed-ing">Ingredients</label>
        <textarea class="input" id="ed-ing" data-ed="ingredients" rows="3" maxlength="800" placeholder="Chicken, wheat flour, eggs, soybean oil, potatoes…">${esc(it.ingredients)}</textarea>

        <fieldset class="fs">
          <legend class="label">Contains <span class="muted">(major allergens)</span></legend>
          ${chipToggles("allergens", Object.entries(ALLERGENS), it.allergens)}
          <label class="label sub-label" for="ed-ao">Other allergens</label>
          <input class="input" id="ed-ao" data-ed="allergens_other" value="${esc(it.allergens_other)}" maxlength="100" placeholder="e.g. mustard, coconut">
        </fieldset>

        <fieldset class="fs">
          <legend class="label">May contain <span class="muted">(cross-contact)</span></legend>
          ${chipToggles("may", Object.entries(ALLERGENS), it.may)}
          <label class="label sub-label" for="ed-mo">Cross-contact note</label>
          <input class="input" id="ed-mo" data-ed="may_other" value="${esc(it.may_other)}" maxlength="100" placeholder="e.g. Fried in a shared fryer">
        </fieldset>

        <fieldset class="fs">
          <legend class="label">Diet</legend>
          ${chipToggles("diet", Object.entries(DIETS), it.diet)}
        </fieldset>

        <div class="two">
          <div>
            <label class="label" for="ed-cuisine">Cuisine</label>
            <select class="input" id="ed-cuisine" data-ed="cuisine">
              <option value="">Not set</option>
              ${Object.entries(CUISINES).map(([k, [l]]) => `<option value="${k}"${it.cuisine === k ? " selected" : ""}>${l}</option>`).join("")}
              <option value="other"${it.cuisine === "other" ? " selected" : ""}>Other…</option>
            </select>
          </div>
          <div>
            <label class="label" for="ed-cal">Calories</label>
            <input class="input" id="ed-cal" data-ed="calories" type="number" inputmode="numeric" min="0" max="5000" value="${it.calories ?? ""}" placeholder="e.g. 550">
          </div>
        </div>
        <div id="ed-co-wrap"${it.cuisine === "other" ? "" : " hidden"}>
          <label class="label" for="ed-co">Cuisine name</label>
          <input class="input" id="ed-co" data-ed="cuisine_other" value="${esc(it.cuisine_other)}" maxlength="40" placeholder="e.g. Vietnamese">
        </div>
        <p class="err" id="ed-err" role="alert"></p>
        ${e.id ? `<button type="button" class="btn danger-ghost" data-act="ed-delete">${icon("trash")}Delete dish</button>` : ""}
      </div>
    </form>`;
  }

  function photoFieldHTML() {
    const e = state.edit, it = e.item;
    const input = `<input type="file" id="ed-file" accept="image/*" class="sr-only" data-photo-input>`;
    if (e.uploading) return `<div class="photo-drop busy"><span class="spinner" aria-hidden="true"></span><span>Uploading photo…</span></div>`;
    if (it.photo) {
      return `<div class="photo-has"><img src="${esc(it.photo)}" alt="Current photo of the dish">
        <div class="photo-actions">${input}<label for="ed-file" class="btn secondary sm">${icon("camera")}Change</label>
        <button type="button" class="btn secondary sm" data-act="ed-photo-remove">${icon("trash")}Remove</button></div></div>`;
    }
    return `${input}<label for="ed-file" class="photo-drop">${icon("camera")}<span class="photo-drop-t"><strong>Add a photo</strong><span>Students see it with the dish</span></span></label>`;
  }

  async function shrinkImage(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error("We couldn't read that image. Try a JPEG or PNG photo."));
        i.src = url;
      });
      const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale)), h = Math.max(1, Math.round(img.naturalHeight * scale));
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); // transparent PNGs get a white background
      ctx.drawImage(img, 0, 0, w, h);
      for (const q of [0.85, 0.75, 0.6, 0.45]) {
        const b = await new Promise(r => c.toBlob(r, "image/jpeg", q));
        if (b && b.size <= 2.5e6) return b;
      }
      throw new Error("That photo is too large. Try a smaller one.");
    } finally { URL.revokeObjectURL(url); }
  }

  async function uploadPhoto(file) {
    const e = state.edit;
    if (!e || !file) return;
    e.uploading = true;
    $("#ed-photo-box").innerHTML = photoFieldHTML();
    $("#ed-save").disabled = true;
    try {
      const blob = await shrinkImage(file);
      const res = await api("POST", `photos?school=${state.admin.school.id}`, undefined, { admin: true, raw: blob, type: "image/jpeg" });
      if (state.edit === e) e.item.photo = res.url;
    } catch (err) { toast(err.message, true); }
    if (state.edit !== e) return;
    e.uploading = false;
    $("#ed-photo-box").innerHTML = photoFieldHTML();
    $("#ed-save").disabled = false;
  }

  async function saveEditor() {
    const e = state.edit;
    if (!e || e.busy || e.uploading) return;
    const it = e.item;
    it.name = it.name.trim();
    if (!it.name) { $("#ed-err").textContent = "Give the dish a name."; $("#ed-name").focus(); return; }
    const cal = Number(it.calories);
    it.calories = it.calories === "" || it.calories == null || !Number.isFinite(cal) || cal <= 0 ? null : Math.round(cal);
    const wk = state.aWeeks[D.monday(e.date)];
    const day = JSON.parse(JSON.stringify((wk && wk.days[e.date]) || emptyDay(e.date)));
    const list = day[e.meal];
    const i = e.id ? list.findIndex(x => x.id === e.id) : -1;
    if (i >= 0) list[i] = { ...it, id: e.id }; else list.push(it);
    e.busy = true;
    const btn = $("#ed-save"); btn.disabled = true; btn.textContent = "Saving…";
    try {
      await saveAdminDay(e.date, day);
      closeEditor();
      render();
      toast(e.id ? "Dish updated" : "Dish added");
    } catch (err) {
      e.busy = false; btn.disabled = false; btn.textContent = "Save";
      $("#ed-err").textContent = err.message;
      if (err.status === 401 || err.status === 403) { closeEditor(); adminGone(); }
    }
  }

  async function deleteDish() {
    const e = state.edit;
    if (!e || !e.id || e.busy) return;
    if (!confirm(`Delete “${e.item.name || "this dish"}”? Its ratings will no longer show in Insights.`)) return;
    const wk = state.aWeeks[D.monday(e.date)];
    const day = JSON.parse(JSON.stringify((wk && wk.days[e.date]) || emptyDay(e.date)));
    day[e.meal] = day[e.meal].filter(x => x.id !== e.id);
    e.busy = true;
    try {
      await saveAdminDay(e.date, day);
      closeEditor();
      render();
      toast("Dish deleted");
    } catch (err) { e.busy = false; $("#ed-err").textContent = err.message; }
  }

  function closeEditor() {
    state.edit = null;
    if (sheet.open) sheet.close();
    sheet.innerHTML = "";
  }

  // ----- school settings -----
  function viewSchool() {
    const a = state.admin, s = a.school;
    return `${head("Organizer settings", esc(s.name), "")}
      <div class="grid2">
        <section class="card">
          <div class="card-head"><h2>Student join code</h2></div>
          <p class="big-code">${esc(s.code)}</p>
          <p class="muted small">Students enter this code, open the invite link, or search “${esc(s.name)}”.</p>
          <div class="row-btns">
            <button class="btn secondary" data-act="copy" data-text="${esc(s.code)}" data-label="Join code">${icon("copy")}Copy code</button>
            <button class="btn secondary" data-act="copy" data-text="${esc(inviteLink(s.code))}" data-label="Invite link">${icon("link")}Copy invite link</button>
          </div>
        </section>
        <section class="card">
          <div class="card-head"><h2>Admin key</h2></div>
          <p class="key" id="admin-key" data-shown="false">••••-••••-••••</p>
          <p class="muted small">Use it to sign in on another device. Anyone with it can edit your menu, so keep it private.</p>
          <div class="row-btns">
            <button class="btn secondary" data-act="show-key">${icon("eye")}Show</button>
            <button class="btn secondary" data-act="copy" data-text="${esc(fmtKey(a.key))}" data-label="Admin key">${icon("copy")}Copy key</button>
          </div>
        </section>
      </div>
      <div class="group">
        <button class="cell" data-act="as-student"><span class="cell-ic">${icon("user")}</span>
          <div class="cell-main"><p class="cell-t">Open student view</p><p class="cell-s">See and rate the menu the way students do</p></div>${icon("chevR")}</button>
        <div class="cell"><span class="cell-ic">${icon("clock")}</span>
          <div class="cell-main"><p class="cell-t">Time zone</p><p class="cell-s">${esc(s.tz.replace(/_/g, " "))} · Today is ${shortDay(state.today)}</p></div></div>
      </div>
      <div class="group">
        <button class="cell" data-act="signout"><span class="cell-ic">${icon("logout")}</span>
          <div class="cell-main"><p class="cell-t">Sign out on this device</p><p class="cell-s">You'll need the admin key to sign back in</p></div>${icon("chevR")}</button>
        <button class="cell danger" data-act="delete-school"><span class="cell-ic danger">${icon("trash")}</span>
          <div class="cell-main"><p class="cell-t">Delete school</p><p class="cell-s">Permanently removes menus, photos, ratings, and ideas</p></div>${icon("chevR")}</button>
      </div>`;
  }

  async function deleteSchool() {
    const s = state.admin.school;
    const typed = prompt(`This permanently deletes ${s.name} and all of its menus, photos, ratings, comments, and ideas.\n\nType the school name to confirm:`);
    if (typed === null) return;
    if (typed.trim().toLowerCase() !== s.name.trim().toLowerCase()) { toast("The name didn't match, so nothing was deleted.", true); return; }
    try {
      await api("DELETE", `schools/${s.id}`, undefined, { admin: true });
      if (state.student?.school.id === s.id) { LS.del("ll_student"); state.student = null; }
      LS.del("ll_admin"); state.admin = null;
      toast(`${s.name} was deleted`);
      if (state.student) setMode("student"); else leaveToWelcome();
    } catch (e) { toast(e.message, true); }
  }

  const VIEWS = {
    student: { menu: viewMenu, ideas: viewIdeasStudent, me: viewMe },
    admin: { insights: viewInsights, kitchen: viewKitchen, ideas: viewIdeasAdmin, school: viewSchool },
  };

  // ================= EVENTS =================
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    const a = el.dataset.act;
    const ob = state.ob;

    switch (a) {
      // onboarding
      case "role":
        if (el.dataset.role === "student") startFlow("student");
        else if (el.dataset.role === "organizer") startFlow("organizer");
        else startFlow("signin");
        break;
      case "ob-back":
        if (ob.i > 0) { ob.i--; ob.err = ""; render(true); } else obExit();
        break;
      case "ob-findby":
        ob.d.findBy = el.dataset.by; ob.err = ""; render();
        $(el.dataset.by === "name" ? "#in-q" : "#in-code")?.focus();
        if (el.dataset.by === "name" && ob.d.q) searchSchools();
        break;
      case "ob-pick":
        ob.d.school = ob.d.results[+el.dataset.i]; obNext();
        break;
      case "ob-opt": {
        const list = el.dataset.kind === "allergies" ? ob.d.allergies : ob.d.cuisines;
        const k = el.dataset.key, i = list.indexOf(k);
        if (i >= 0) list.splice(i, 1); else list.push(k);
        el.setAttribute("aria-pressed", String(i < 0));
        refreshCta();
        break;
      }
      case "ob-other": {
        const kind = el.dataset.kind, prop = kind === "allergies" ? "allergyOtherOn" : "cuisineOtherOn";
        ob.d[prop] = !ob.d[prop];
        el.setAttribute("aria-pressed", String(ob.d[prop])); el.setAttribute("aria-expanded", String(ob.d[prop]));
        el.querySelector(".opt-check").innerHTML = icon(ob.d[prop] ? "check" : "plus");
        const box = $("#other-" + kind);
        box.hidden = !ob.d[prop];
        if (ob.d[prop]) {
          const inp = box.querySelector("input");
          inp.focus({ preventScroll: true });
          inp.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        }
        refreshCta();
        break;
      }
      case "copy":
        copy(el.dataset.text, el.dataset.label);
        break;

      // student menu
      case "s-week":
        state.week = D.add(state.week, 7 * +el.dataset.dir);
        state.day = D.weekdays(state.week).includes(state.today) ? state.today : state.week;
        state.meal = null; state.touched = true; state.openComment.clear();
        render(); $(`[data-act="s-week"][data-dir="${el.dataset.dir}"]`)?.focus();
        break;
      case "s-day":
        state.day = el.dataset.date; state.meal = null; state.touched = true; state.openComment.clear();
        render(); $(`[data-act="s-day"][data-date="${state.day}"]`)?.focus();
        break;
      case "meal":
        state.meal = el.dataset.meal; state.openComment.clear();
        render(); $(`[data-act="meal"][data-meal="${state.meal}"]`)?.focus();
        break;
      case "s-goto":
        state.day = el.dataset.date; state.week = D.monday(state.day); state.meal = null; state.touched = true; state.openComment.clear();
        render(); window.scrollTo(0, 0); $(".rate-banner")?.setAttribute("tabindex", "-1"); $(".rate-banner")?.focus({ preventScroll: true });
        break;
      case "tips-done":
        LS.set("ll_tips_done", true); $(".howto")?.remove(); $("h1")?.focus();
        break;
      case "retry-week":
        delete state.weeks[state.week]; render();
        break;
      case "rate": rate(el.dataset.id, el.dataset.vote); break;
      case "c-open": state.openComment.add(el.dataset.id); patchRate(el.dataset.id, "textarea"); break;
      case "c-cancel": state.openComment.delete(el.dataset.id); delete state.cDraft[el.dataset.id]; patchRate(el.dataset.id, `[data-act="c-open"]`); break;
      case "c-send": sendComment(el.dataset.id); break;

      // ideas
      case "idea-vote": voteIdea(el.dataset.id); break;
      case "retry-ideas": state.ideas = null; render(); break;
      case "idea-del": {
        const it = Array.isArray(state.ideas) && state.ideas.find(x => x.id === el.dataset.id);
        if (!it || !confirm(`Remove this suggestion?\n\n“${it.text}”`)) break;
        api("DELETE", `ideas/${it.id}?school=${state.admin.school.id}`, undefined, { admin: true })
          .then(() => { state.ideas = state.ideas.filter(x => x !== it); state.insights = null; render(); toast("Suggestion removed"); })
          .catch(err => toast(err.message, true));
        break;
      }

      // profile
      case "edit": startFlow("edit", {}, { steps: [el.dataset.step], exit: "app" }); break;
      case "leave":
        if (!confirm(`Sign out of ${state.student.school.name}?\n\nTo come back, tap "I'm a student" and enter the school code ${state.student.school.code}.`)) break;
        LS.del("ll_student"); state.student = null;
        if (state.admin) setMode("admin"); else leaveToWelcome();
        toast("Signed out");
        break;
      case "to-admin": setMode("admin"); break;

      // organizer
      case "range": state.range = el.dataset.range; render(); $(`[data-act="range"][data-range="${state.range}"]`)?.focus(); break;
      case "refresh-ins": state.insights = null; render(); $('[data-act="refresh-ins"]')?.focus(); break;
      case "a-week":
        state.aWeek = D.add(state.aWeek, 7 * +el.dataset.dir);
        state.aDay = D.weekdays(state.aWeek).includes(state.today) ? state.today : state.aWeek;
        render(); $(`[data-act="a-week"][data-dir="${el.dataset.dir}"]`)?.focus();
        break;
      case "a-day": state.aDay = el.dataset.date; render(); $(`[data-act="a-day"][data-date="${state.aDay}"]`)?.focus(); break;
      case "a-meal": state.aMeal = el.dataset.meal; render(); $(`[data-act="a-meal"][data-meal="${state.aMeal}"]`)?.focus(); break;
      case "retry-aweek": delete state.aWeeks[state.aWeek]; render(); break;
      case "add-dish": openEditor(null); break;
      case "edit-dish": openEditor(el.dataset.id); break;
      case "fill-sample": fillSample(); break;
      case "ed-close": closeEditor(); break;
      case "ed-delete": deleteDish(); break;
      case "ed-photo-remove": state.edit.item.photo = ""; $("#ed-photo-box").innerHTML = photoFieldHTML(); break;
      case "ed-chip": {
        const it = state.edit.item, f = el.dataset.field, k = el.dataset.key;
        const list = it[f], i = list.indexOf(k);
        if (i >= 0) list.splice(i, 1); else list.push(k);
        el.setAttribute("aria-pressed", String(i < 0));
        // An allergen is either "contains" or "may contain", never both.
        const other = f === "allergens" ? "may" : f === "may" ? "allergens" : null;
        if (other && i < 0 && it[other].includes(k)) {
          it[other] = it[other].filter(x => x !== k);
          $(`[data-act="ed-chip"][data-field="${other}"][data-key="${k}"]`)?.setAttribute("aria-pressed", "false");
        }
        break;
      }
      case "show-key": {
        const k = $("#admin-key"), shown = k.dataset.shown === "true";
        k.textContent = shown ? "••••-••••-••••" : fmtKey(state.admin.key);
        k.dataset.shown = String(!shown);
        el.innerHTML = icon("eye") + (shown ? "Show" : "Hide");
        break;
      }
      case "as-student":
        if (state.student?.school.id === state.admin.school.id) setMode("student");
        else startFlow("student", { school: state.admin.school }, { steps: ["name", "allergies", "food"], exit: "app" });
        break;
      case "signout":
        if (!confirm("Sign out of the organizer view?\n\nYou'll need your admin key to sign back in, so make sure you've saved it.")) break;
        LS.del("ll_admin"); state.admin = null;
        if (state.student) setMode("student"); else leaveToWelcome();
        toast("Signed out");
        break;
      case "delete-school": deleteSchool(); break;
    }
  });

  document.addEventListener("submit", e => {
    const f = e.target.closest("[data-form]");
    if (!f) return;
    e.preventDefault();
    if (f.dataset.form === "ob") obSubmit();
    else if (f.dataset.form === "idea") postIdea($("#idea-in"));
    else if (f.dataset.form === "editor") saveEditor();
  });

  document.addEventListener("input", e => {
    const t = e.target;
    if (t.dataset.bind && state.ob) {
      const d = state.ob.d;
      if (t.dataset.bind === "code") {
        const v = normCode(t.value).slice(0, 6);
        if (t.value !== v) t.value = v;
        d.code = v;
      } else d[t.dataset.bind] = t.value;
      if (state.ob.err) obError("");
      if (t.dataset.bind === "q") searchSchools();
      refreshCta();
    } else if (t.dataset.comment) {
      state.cDraft[t.dataset.comment] = t.value;
      const c = $("#cc-" + t.dataset.comment);
      if (c) c.textContent = `${t.value.length}/${COMMENT_MAX}`;
    } else if (t.dataset.ed && state.edit) {
      state.edit.item[t.dataset.ed] = t.value;
      if (t.dataset.ed === "cuisine") $("#ed-co-wrap").hidden = t.value !== "other";
      $("#ed-err").textContent = "";
    }
  });

  document.addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.bindCheck && state.ob) state.ob.d[t.dataset.bindCheck] = t.checked;
    if (t.dataset.ed === "cuisine" && state.edit) { state.edit.item.cuisine = t.value; $("#ed-co-wrap").hidden = t.value !== "other"; }
    if (t.matches("[data-photo-input]") && t.files && t.files[0]) uploadPhoto(t.files[0]);
  });

  sheet.addEventListener("close", () => { state.edit = null; sheet.innerHTML = ""; });

  window.addEventListener("hashchange", () => { if (!state.ob && state.mode) render(true); });

  // ================= START =================
  function start() {
    let mode = LS.get("ll_mode");
    if (mode === "admin" && !state.admin) mode = null;
    if (mode === "student" && !state.student) mode = null;
    if (!mode) mode = state.admin ? "admin" : state.student ? "student" : null;
    state.mode = mode;

    const join = normCode(new URLSearchParams(location.search).get("join"));
    if (location.search) history.replaceState(null, "", location.pathname + location.hash);
    if (join.length === 6 && state.student?.school.code !== join) {
      startFlow("student", { code: join }, { exit: mode ? "app" : "welcome" });
      obSubmit();
      return;
    }
    if (!mode) { startFlow("welcome"); return; }
    render(true);
  }
  start();
})();
