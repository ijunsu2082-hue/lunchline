// Staff menu editor: pick a day, add or edit dishes (photo, allergens, diet,
// calories) and leave students a note on any dish.
import { $, esc, cap, listJoin, D, staffHome, foodTile } from "../util.js";
import { state, school, ALLERGENS, CUISINES, DIETS, MEALS } from "../state.js";
import { api } from "../api.js";
import { icon } from "../icons.js";
import { t } from "../i18n.js";
import { render, toast, registerActions, head, errorBox, skeleton, currentTab, openSheet, closeSheet, sheetEl, askConfirm } from "../ui.js";
import { dayChips } from "./student.js";
import { adminGone } from "./staff.js";
import { savePresetFromEditor } from "./presets.js";

const terms = s => String(s || "").toLowerCase().split(/[,;/\n]+/).map(x => x.trim()).filter(x => x.length >= 2);
const mealName = m => cap(m);
const emptyDay = date => ({ date, ...Object.fromEntries(MEALS.map(m => [m, []])) });

function initAdminWeek() {
  const d = staffHome(state.today);
  state.aWeek = D.monday(d); state.aDay = d;
}

async function loadAdminWeek(mon) {
  const key = "a" + mon;
  if (state.loading.has(key)) return;
  state.loading.add(key);
  try {
    const m = await api("GET", `menu?school=${school().id}&from=${mon}&to=${D.add(mon, 4)}`);
    if (state.mode !== "admin") return;
    state.aWeeks[mon] = { days: m.days };
    state.today = m.today;
  } catch (e) {
    if (e.status === 404 && /school/i.test(e.message)) { state.loading.delete(key); adminGone(); return; }
    state.aWeeks[mon] = { error: e.message };
  } finally { state.loading.delete(key); }
  if (state.mode === "admin" && !state.ob && currentTab() === "kitchen" && state.aWeek === mon) render();
}

const mealSeg = (day, sel) => `<div class="seg" role="group" aria-label="Meal">${MEALS.map(k =>
  `<button data-act="a-meal" data-meal="${k}" aria-pressed="${k === sel}">${mealName(k)}<span class="seg-n">${day ? (day[k] || []).length : 0}</span></button>`).join("")}</div>`;

export function viewKitchen() {
  if (!state.today) { loadAdminWeek(D.monday(new Date().toISOString().slice(0, 10))); return head("Menu", "Menu", "") + skeleton(3); }
  if (!state.aWeek) initAdminWeek();
  const wk = state.aWeeks[state.aWeek], date = state.aDay;
  let body;
  if (!wk) { loadAdminWeek(state.aWeek); body = skeleton(3); }
  else if (wk.error) body = errorBox(wk.error, "retry-aweek");
  else {
    const day = wk.days[date] || emptyDay(date);
    const items = day[state.aMeal] || [];
    const weekEmpty = !D.weekdays(state.aWeek).some(d => wk.days[d]);
    body = `${mealSeg(day, state.aMeal)}
      <div class="edit-list">
        ${items.length ? items.map(it => `<button class="edit-row" data-act="edit-dish" data-id="${it.id}">
            ${it.photo ? `<img class="thumb" src="${esc(it.photo)}" alt="" loading="lazy">` : `${foodTile(it.name, "thumb ph")}`}
            <span class="edit-main"><span class="edit-t">${esc(it.name)}</span>
              <span class="edit-s">${it.allergens.length || it.allergens_other ? "Contains " + esc(listJoin([...it.allergens.map(a => t("allergen." + a)), ...terms(it.allergens_other).map(cap)])) : (it.calories == null && /ask nutrition/i.test(it.may_other) ? "Allergens not listed" : "No major allergens")}${it.photo ? "" : " · No photo"}${it.reply ? " · Has a reply" : ""}</span></span>
            <span class="edit-go">${icon("pencil")}<span class="sr-only">Edit</span></span>
          </button>`).join("")
          : `<div class="empty slim"><p>Nothing's been added for ${mealName(state.aMeal).toLowerCase()} on ${D.fmt(date, { weekday: "long" })} yet.</p></div>`}
      </div>
      <div class="row-btns">
        <button class="btn primary" data-act="add-dish">${icon("plus")}Add to ${mealName(state.aMeal)}</button>
        ${state.aMeal === "snack" && !items.length && day.breakfast.length ? `<button class="btn secondary" data-act="snack-same">${icon("copy")}Same as breakfast</button>` : ""}
        ${items.length ? `<button class="btn secondary" data-act="copy-day">${icon("copy")}Copy to next day</button>` : ""}
        <button class="btn secondary" data-act="presets-open">${icon("copy")}Presets</button>
      </div>`;
  }
  return `${head("Menu", "What's being served", "Pick a day, then add or change the food for it. Students see your changes the moment you save.")}
    ${dayChips(state.aWeek, date, wk && wk.days, "a-")}
    ${body}`;
}

async function saveAdminDay(date, day) {
  const res = await api("PUT", "menu", { school: school().id, days: [day] });
  const wk = state.aWeeks[D.monday(date)];
  if (wk && wk.days) {
    const saved = res.days[date];
    if (saved && MEALS.some(m => (saved[m] || []).length)) wk.days[date] = saved; else delete wk.days[date];
  }
  state.insights = null;
}

async function copyDay() {
  const wk = state.aWeeks[state.aWeek], src = wk?.days[state.aDay];
  if (!src) return;
  let next = D.add(state.aDay, 1);
  if (D.isWeekend(next)) next = D.add(D.monday(next), 7);
  const clone = { date: next, ...Object.fromEntries(MEALS.map(m => [m, (src[m] || []).map(i => ({ ...i, id: "", reply: "", reply_to: "" }))])) };
  try {
    const res = await api("PUT", "menu", { school: school().id, days: [clone] });
    const w = state.aWeeks[D.monday(next)];
    if (w && w.days) w.days[next] = res.days[next];
    state.insights = null;
    toast(`Copied to ${D.fmt(next, { weekday: "long" })}`);
  } catch (e) { toast(e.message, true); }
}

// ---------- editor sheet ----------
const BLANK = { name: "", desc: "", ingredients: "", allergens: [], allergens_other: "", may: [], may_other: "", diet: [], cuisine: "", cuisine_other: "", calories: null, protein: null, fat: null, sat_fat: null, carbs: null, fiber: null, sodium: null, photo: "", reply: "" };

function openEditor(id) {
  const wk = state.aWeeks[state.aWeek], day = (wk && wk.days[state.aDay]) || emptyDay(state.aDay);
  const found = id && (day[state.aMeal] || []).find(i => i.id === id);
  state.edit = { id: found ? found.id : null, date: state.aDay, meal: state.aMeal, item: JSON.parse(JSON.stringify(found || BLANK)), busy: false, uploading: false };
  openSheet(editorHTML(), { onClose: () => { state.edit = null; } });
  if (!found && matchMedia("(hover: hover)").matches) $("#ed-name")?.focus(); else $("#ed-close")?.focus();
}

const chipToggles = (field, entries, selected) => `<div class="toggles">${entries.map(([k, l]) =>
  `<button type="button" class="toggle" data-act="ed-chip" data-field="${field}" data-key="${k}" aria-pressed="${selected.includes(k)}">${esc(l)}</button>`).join("")}</div>`;

const NUTRI = [["protein", "Protein", "g"], ["fat", "Fat", "g"], ["sat_fat", "Saturated fat", "g"], ["carbs", "Carbs", "g"], ["fiber", "Fiber", "g"], ["sodium", "Sodium", "mg"]];

function editorHTML() {
  const e = state.edit, it = e.item;
  const A = ALLERGENS.map(a => [a, t("allergen." + a)]);
  return `<form class="editor" data-form="editor" novalidate>
    <header class="sheet-head">
      <button type="button" class="icon-btn" id="ed-close" data-act="sheet-close" aria-label="Close without saving">${icon("x")}</button>
      <div class="sheet-title"><h2 id="sheet-title">${e.id ? "Edit dish" : "New dish"}</h2><p class="sheet-sub">${mealName(e.meal)} · ${D.fmt(e.date, { weekday: "long", month: "long", day: "numeric" })}</p></div>
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
      <fieldset class="fs"><legend class="label">Contains <span class="muted">(major allergens)</span></legend>${chipToggles("allergens", A, it.allergens)}
        <label class="label sub-label" for="ed-ao">Other allergens</label><input class="input" id="ed-ao" data-ed="allergens_other" value="${esc(it.allergens_other)}" maxlength="100" placeholder="e.g. mustard, coconut"></fieldset>
      <fieldset class="fs"><legend class="label">May contain <span class="muted">(cross-contact)</span></legend>${chipToggles("may", A, it.may)}
        <label class="label sub-label" for="ed-mo">Cross-contact note</label><input class="input" id="ed-mo" data-ed="may_other" value="${esc(it.may_other)}" maxlength="100" placeholder="e.g. Fried in a shared fryer"></fieldset>
      <fieldset class="fs"><legend class="label">Diet</legend>${chipToggles("diet", DIETS.map(d => [d, t("diet." + d)]), it.diet)}</fieldset>
      <div class="two">
        <div><label class="label" for="ed-cuisine">Cuisine</label>
          <select class="input" id="ed-cuisine" data-ed="cuisine"><option value="">Not set</option>
            ${CUISINES.map(k => `<option value="${k}"${it.cuisine === k ? " selected" : ""}>${esc(t("cuisine." + k))}</option>`).join("")}
            <option value="other"${it.cuisine === "other" ? " selected" : ""}>Other…</option></select></div>
        <div><label class="label" for="ed-cal">Calories</label>
          <input class="input" id="ed-cal" data-ed="calories" type="number" inputmode="numeric" min="0" max="5000" value="${it.calories ?? ""}" placeholder="e.g. 550"></div>
      </div>
      <details class="nutri-edit"${NUTRI.some(([k]) => it[k] != null) ? " open" : ""}><summary>Nutrition facts <span class="muted">(optional, per serving)</span></summary>
        <div class="nutri-fields">${NUTRI.map(([k, label, unit]) => `<div><label class="label" for="ed-${k}">${label} <span class="muted">${unit}</span></label>
          <input class="input" id="ed-${k}" data-ed="${k}" type="number" inputmode="decimal" min="0" step="0.1" value="${it[k] ?? ""}"></div>`).join("")}</div></details>
      <div id="ed-co-wrap"${it.cuisine === "other" ? "" : " hidden"}><label class="label" for="ed-co">Cuisine name</label>
        <input class="input" id="ed-co" data-ed="cuisine_other" value="${esc(it.cuisine_other)}" maxlength="40" placeholder="e.g. Vietnamese"></div>
      <label class="label" for="ed-reply">Note to students <span class="muted">(optional)</span></label>
      <input class="input" id="ed-reply" data-ed="reply" value="${esc(it.reply || "")}" maxlength="160" placeholder="e.g. New recipe this week. Tell us what you think.">
      <p class="err" id="ed-err" role="alert"></p>
      ${e.id ? `<button type="button" class="btn secondary" data-act="ed-preset">${icon("copy")}Save dish as preset</button>` : ""}
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
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("We couldn't read that image. Try a JPEG or PNG photo.")); i.src = url; });
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale)), h = Math.max(1, Math.round(img.naturalHeight * scale));
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
    for (const q of [0.85, 0.75, 0.6, 0.45]) {
      const b = await new Promise(r => c.toBlob(r, "image/jpeg", q));
      if (b && b.size <= 2.5e6) return b;
    }
    throw new Error("That photo is too large. Try a smaller one.");
  } finally { URL.revokeObjectURL(url); }
}

export async function uploadPhoto(file) {
  const e = state.edit;
  if (!e || !file) return;
  e.uploading = true;
  $("#ed-photo-box").innerHTML = photoFieldHTML(); $("#ed-save").disabled = true;
  try {
    const blob = await shrinkImage(file);
    const res = await api("POST", `photos?school=${school().id}`, undefined, { raw: blob, type: "image/jpeg" });
    if (state.edit === e) e.item.photo = res.url;
  } catch (err) { toast(err.message, true); }
  if (state.edit !== e) return;
  e.uploading = false;
  $("#ed-photo-box").innerHTML = photoFieldHTML(); $("#ed-save").disabled = false;
}

export async function saveEditor() {
  const e = state.edit;
  if (!e || e.busy || e.uploading) return;
  const it = e.item;
  it.name = it.name.trim();
  if (!it.name) { $("#ed-err").textContent = "Give the dish a name."; $("#ed-name").focus(); return; }
  const cal = Number(it.calories);
  it.calories = it.calories === "" || it.calories == null || !Number.isFinite(cal) || cal <= 0 ? null : Math.round(cal);
  for (const [k] of NUTRI) it[k] = it[k] === "" || it[k] == null || !Number.isFinite(Number(it[k])) ? null : Number(it[k]);
  const wk = state.aWeeks[D.monday(e.date)];
  const day = JSON.parse(JSON.stringify((wk && wk.days[e.date]) || emptyDay(e.date)));
  const list = day[e.meal] ||= [];
  const i = e.id ? list.findIndex(x => x.id === e.id) : -1;
  if (i >= 0) list[i] = { ...it, id: e.id }; else list.push(it);
  e.busy = true;
  const btn = $("#ed-save"); btn.disabled = true; btn.textContent = "Saving…";
  try {
    await saveAdminDay(e.date, day);
    closeSheet(); render(); toast(e.id ? "Dish updated" : "Dish added");
  } catch (err) {
    e.busy = false; btn.disabled = false; btn.textContent = "Save";
    $("#ed-err").textContent = err.message;
    if (err.status === 401 || err.status === 403) { closeSheet(); adminGone(); }
  }
}

async function deleteDish() {
  const e = state.edit;
  if (!e || !e.id || e.busy) return;
  if (!(await askConfirm({ title: `Delete “${e.item.name || "this dish"}”?`, body: "Its ratings will no longer show in Insights.", ok: "Delete dish", danger: true }))) return;
  const wk = state.aWeeks[D.monday(e.date)];
  const day = JSON.parse(JSON.stringify((wk && wk.days[e.date]) || emptyDay(e.date)));
  day[e.meal] = (day[e.meal] || []).filter(x => x.id !== e.id);
  e.busy = true;
  try { await saveAdminDay(e.date, day); closeSheet(); render(); toast("Dish deleted"); }
  catch (err) { e.busy = false; const el = $("#ed-err"); if (el) el.textContent = err.message; }
}

export function onEditorInput(target) {
  state.edit.item[target.dataset.ed] = target.value;
  if (target.dataset.ed === "cuisine") $("#ed-co-wrap").hidden = target.value !== "other";
  const err = $("#ed-err"); if (err) err.textContent = "";
}

async function snackSame() {
  const wk = state.aWeeks[state.aWeek], day = wk?.days[state.aDay];
  if (!day || !day.breakfast.length) return;
  const next = { ...day, snack: day.breakfast.map(i => ({ ...i, id: "", reply: "", reply_to: "" })) };
  try { await saveAdminDay(state.aDay, next); render(); toast("Snack is now the same as breakfast. Edit any dish to change it."); }
  catch (e) { toast(e.message, true); }
}

registerActions({
  "snack-same"() { snackSame(); },
  "a-week"(el) {
    state.aWeek = D.add(state.aWeek, 7 * +el.dataset.dir);
    state.aDay = D.weekdays(state.aWeek).includes(state.today) ? state.today : state.aWeek;
    render(); document.querySelector(`[data-act="a-week"][data-dir="${el.dataset.dir}"]`)?.focus();
  },
  "a-day"(el) { state.aDay = el.dataset.date; render(); document.querySelector(`[data-act="a-day"][data-date="${state.aDay}"]`)?.focus(); },
  "a-meal"(el) { state.aMeal = el.dataset.meal; render(); document.querySelector(`[data-act="a-meal"][data-meal="${state.aMeal}"]`)?.focus(); },
  "retry-aweek"() { delete state.aWeeks[state.aWeek]; render(); },
  "add-dish"() { openEditor(null); },
  "edit-dish"(el) { openEditor(el.dataset.id); },
  "copy-day"() { copyDay(); },
  "ed-delete"() { deleteDish(); },
  "ed-preset"() { savePresetFromEditor(state.edit.item); },
  "ed-photo-remove"() { state.edit.item.photo = ""; $("#ed-photo-box").innerHTML = photoFieldHTML(); },
  "ed-chip"(el) {
    const it = state.edit.item, f = el.dataset.field, k = el.dataset.key;
    const list = it[f], i = list.indexOf(k);
    if (i >= 0) list.splice(i, 1); else list.push(k);
    el.setAttribute("aria-pressed", String(i < 0));
    // An allergen is either "contains" or "may contain", never both.
    const other = f === "allergens" ? "may" : f === "may" ? "allergens" : null;
    if (other && i < 0 && it[other].includes(k)) {
      it[other] = it[other].filter(x => x !== k);
      document.querySelector(`[data-act="ed-chip"][data-field="${other}"][data-key="${k}"]`)?.setAttribute("aria-pressed", "false");
    }
  },
});
