// Menu presets: save a dish, a day or a week once, then load it again onto any days you like.
// Presets belong to the school, so everyone on the team sees the same list.
import { $, esc, D, cap } from "../util.js";
import { state, school, MEALS } from "../state.js";
import { api } from "../api.js";
import { icon } from "../icons.js";
import { render, toast, registerActions, openSheet, closeSheet, askConfirm } from "../ui.js";

const KINDS = [["week", "Weeks"], ["day", "Days"], ["item", "Dishes"]];
const mealName = cap;
const dayCount = d => MEALS.reduce((n, m) => n + (d?.[m] || []).length, 0);
const summary = p => p.kind === "item" ? [p.data.calories ? `${p.data.calories} cal` : "", p.data.diet?.join(", ")].filter(Boolean).join(" · ") || "One dish"
  : p.kind === "day" ? `${dayCount(p.data)} dishes` : `${p.data.days.length} days, ${p.data.days.reduce((n, d) => n + dayCount(d), 0)} dishes`;

async function loadPresets() {
  state.presets = (await api("GET", `presets?school=${school().id}`)).presets;
  return state.presets;
}

const currentWeekDays = () => state.aWeeks[state.aWeek]?.days || {};
const stripReplies = items => (items || []).map(i => ({ ...i, id: "", reply: "", reply_to: "" }));

// ---------- the list ----------
function listHTML(presets) {
  const rows = kind => presets.filter(p => p.kind === kind).map(p => `<li class="preset">
      <div class="preset-main"><p class="preset-n">${esc(p.name)}</p><p class="preset-s">${esc(summary(p))}</p></div>
      <button class="btn secondary sm" data-act="preset-load" data-id="${p.id}">Load</button>
      <button class="icon-btn danger" data-act="preset-del" data-id="${p.id}" aria-label="Delete ${esc(p.name)}">${icon("trash")}</button>
    </li>`).join("");
  const body = KINDS.map(([k, label]) => {
    const r = rows(k);
    return `<section class="preset-group"><h3>${label}</h3>${r ? `<ul class="preset-list">${r}</ul>` : `<p class="muted small">None saved yet.</p>`}</section>`;
  }).join("");
  const date = state.aDay, hasDay = dayCount(currentWeekDays()[date]) > 0, hasWeek = Object.values(currentWeekDays()).some(d => dayCount(d) > 0);
  return `<div class="sheet-form presets">
    <h2 id="sheet-title">Menu presets</h2>
    <p class="muted">Save a menu once and load it onto any days you like. Everyone on your team can use them.</p>
    <div class="row-btns">
      <button class="btn primary sm" data-act="preset-save" data-kind="day"${hasDay ? "" : " disabled"}>${icon("plus")}Save ${esc(D.fmt(date, { weekday: "long" }))} as a day</button>
      <button class="btn primary sm" data-act="preset-save" data-kind="week"${hasWeek ? "" : " disabled"}>${icon("plus")}Save this week</button>
    </div>
    <p class="help">To save a single dish, open it and choose “Save dish as preset”.</p>
    ${body}
    <div class="modal-btns"><button type="button" class="btn secondary" data-act="sheet-close">Done</button></div>
  </div>`;
}

async function openPresets() {
  openSheet(`<div class="sheet-form"><h2 id="sheet-title">Menu presets</h2><p class="muted">Loading…</p></div>`);
  try { openSheet(listHTML(await loadPresets())); }
  catch (e) { closeSheet(); toast(e.message, true); }
}

// ---------- saving ----------
function nameForm(kind, data, suggestion) {
  state.presetDraft = { kind, data };
  openSheet(`<form class="sheet-form" data-form="preset-save">
    <h2 id="sheet-title">Save ${kind === "item" ? "this dish" : kind === "day" ? "this day" : "this week"} as a preset</h2>
    <label class="label" for="preset-name">Name</label>
    <input class="input" id="preset-name" maxlength="50" value="${esc(suggestion)}" placeholder="e.g. Taco Tuesday" required>
    <p class="help">Photos, nutrition and allergens come along. Replies to students don't.</p>
    <div class="modal-btns"><button type="button" class="btn secondary" data-act="presets-open">Back</button><button class="btn primary" type="submit">Save preset</button></div>
  </form>`);
  $("#preset-name")?.select();
}

export function savePresetFromEditor(item) { // the dish editor's "Save dish as preset"
  const { id, reply, reply_to, ...rest } = item;
  nameForm("item", rest, item.name);
}

// ---------- loading ----------
function loadForm(p) {
  const days = D.weekdays(state.aWeek), sel = state.aDay;
  const dayPick = p.kind === "day" ? `<fieldset class="reply-vis"><legend>Which days?</legend><div class="chips-pick">${days.map(d => `<label class="pick"><input type="checkbox" class="sr-only" name="pday" value="${d}"${d === sel ? " checked" : ""}><span>${esc(D.fmt(d, { weekday: "short" }))} ${+d.slice(8)}</span></label>`).join("")}</div></fieldset>` : "";
  const mealPick = p.kind === "item" ? `<label class="label" for="pl-meal">Add it to</label><select class="input" id="pl-meal">${MEALS.map(m => `<option value="${m}"${m === state.aMeal ? " selected" : ""}>${mealName(m)}</option>`).join("")}</select>` : "";
  const repeat = p.kind !== "item" ? `<label class="label" for="pl-weeks">Repeat for how many weeks?</label>
    <select class="input" id="pl-weeks">${[1, 2, 3, 4, 6, 8].map(n => `<option value="${n}">${n === 1 ? "Just this week" : n + " weeks in a row"}</option>`).join("")}</select>
    <p class="help">Starts the week of ${esc(D.fmt(state.aWeek, { month: "short", day: "numeric" }))}.</p>
    <fieldset class="reply-vis"><legend>If those days already have food</legend>
      <label class="radio"><input type="radio" name="pl-mode" value="add" checked><span><strong>Add to it</strong>Keeps what's there and skips dishes with the same name.</span></label>
      <label class="radio"><input type="radio" name="pl-mode" value="replace"><span><strong>Replace it</strong>Clears those days first.</span></label></fieldset>` : "";
  openSheet(`<form class="sheet-form" data-form="preset-load" data-id="${p.id}">
    <h2 id="sheet-title">Load “${esc(p.name)}”</h2>
    ${dayPick}${mealPick}${repeat}
    <p class="form-err" id="pl-err" role="alert"></p>
    <div class="modal-btns"><button type="button" class="btn secondary" data-act="presets-open">Back</button><button class="btn primary" type="submit">Load</button></div>
  </form>`);
}

async function applyPreset(f) {
  const p = (state.presets || []).find(x => x.id === f.dataset.id);
  if (!p) return;
  const mode = f.querySelector('input[name="pl-mode"]:checked')?.value || "add";
  const weeks = +($("#pl-weeks")?.value || 1);
  const known = state.aWeeks;
  // The days already stored for a date: from this week's cache when we have it, otherwise fetched.
  const existing = async date => {
    const mon = D.monday(date);
    if (known[mon]?.days) return known[mon].days[date];
    const m = await api("GET", `menu?school=${school().id}&from=${date}&to=${date}`);
    return m.days[date];
  };
  const targets = []; // [{ date, source }]
  if (p.kind === "item") {
    const date = state.aDay, meal = $("#pl-meal").value, cur = (await existing(date)) || {};
    const day = { date, ...Object.fromEntries(MEALS.map(m => [m, (cur[m] || []).map(i => ({ ...i }))])) };
    day[meal] = [...day[meal], { ...p.data, id: "" }];
    targets.push(day);
  } else {
    for (let w = 0; w < weeks; w++) {
      const mon = D.add(state.aWeek, 7 * w);
      const pairs = p.kind === "day"
        ? [...f.querySelectorAll('input[name="pday"]:checked')].map(c => [D.add(mon, D.weekdays(state.aWeek).indexOf(c.value)), p.data])
        : p.data.days.map((d, i) => [D.add(mon, i), d]);
      if (p.kind === "day" && !pairs.length) { $("#pl-err").textContent = "Pick at least one day."; return; }
      for (const [date, src] of pairs) {
        const cur = mode === "add" ? (await existing(date)) || {} : {};
        const day = { date };
        for (const m of MEALS) {
          const have = (cur[m] || []).map(i => ({ ...i }));
          const names = new Set(have.map(i => i.name.trim().toLowerCase()));
          day[m] = [...have, ...stripReplies(src[m]).filter(i => !names.has(i.name.trim().toLowerCase()))];
        }
        targets.push(day);
      }
    }
  }
  const btn = f.querySelector('button[type="submit"]'); btn.disabled = true; btn.textContent = "Loading…";
  try {
    for (let i = 0; i < targets.length; i += 40) await api("PUT", "menu", { school: school().id, days: targets.slice(i, i + 40) });
    state.aWeeks = {}; state.insights = null;
    closeSheet(); render();
    toast(p.kind === "item" ? `Added ${p.data.name}` : `Loaded “${p.name}” onto ${targets.length} day${targets.length === 1 ? "" : "s"}`);
  } catch (e) { btn.disabled = false; btn.textContent = "Load"; $("#pl-err").textContent = e.message; }
}

registerActions({
  "presets-open"() { openPresets(); },
  "preset-save"(el) {
    const kind = el.dataset.kind, days = currentWeekDays();
    if (kind === "day") nameForm("day", Object.fromEntries(MEALS.map(m => [m, stripReplies(days[state.aDay]?.[m])])), `${D.fmt(state.aDay, { weekday: "long" })} menu`);
    else nameForm("week", { days: D.weekdays(state.aWeek).map(d => Object.fromEntries(MEALS.map(m => [m, stripReplies(days[d]?.[m])]))) }, `Week of ${D.fmt(state.aWeek, { month: "short", day: "numeric" })}`);
  },
  "preset-load"(el) { const p = (state.presets || []).find(x => x.id === el.dataset.id); if (p) loadForm(p); },
  async "preset-del"(el) {
    const p = (state.presets || []).find(x => x.id === el.dataset.id);
    if (!p || !(await askConfirm({ title: "Delete this preset?", body: `“${esc(p.name)}” will be removed for everyone on your team. Menus you already loaded from it stay as they are.`, ok: "Delete", danger: true }))) return;
    try { await api("DELETE", `presets/${p.id}?school=${school().id}`); openPresets(); } catch (e) { toast(e.message, true); }
  },
});

export async function submitPresetForm(f) {
  if (f.dataset.form === "preset-load") return applyPreset(f);
  const name = $("#preset-name").value.trim(), { kind, data } = state.presetDraft;
  try {
    await api("POST", "presets", { school: school().id, name, kind, data });
    toast(`Saved “${name}”`);
    openPresets();
  } catch (e) { toast(e.message, true); }
}
