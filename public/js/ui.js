// shared ui bits: render hook, tabs, toasts, sheets, confirm box
import { $, esc } from "./util.js";
import { state } from "./state.js";
import { icon } from "./icons.js";

// views leave callbacks here so they can refresh each other
export const hooks = {};

// render hook
let renderer = () => {};
export const setRenderer = fn => { renderer = fn; };
export const render = focus => renderer(focus);

// tabs
export const TABS = {
  student: [["menu", "Menu", "utensils"], ["ideas", "Ideas", "lightbulb"], ["me", "Me", "user"]],
  parent: [["menu", "Menu", "utensils"]],
  admin: [["insights", "Insights", "chart"], ["kitchen", "Menu", "calendar"], ["ideas", "Ideas", "lightbulb"], ["reports", "Reports", "mail"], ["school", "School", "school"]],
};
export const currentTab = () => {
  const h = location.hash.slice(1), tabs = TABS[state.mode];
  return tabs.some(t => t[0] === h) ? h : tabs[0][0];
};
export function go(tab) {
  if (location.hash === "#" + tab) render(true);
  else location.hash = tab;
}

// click handlers
const actions = {};
export const registerActions = obj => Object.assign(actions, obj);
export const getAction = name => actions[name];

// toasts
let toastTimer;
export function toast(msg, isError = false, action = null) {
  const el = $("#toast");
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" class="toast-act" data-act="${action.act}" ${action.data || ""}>${esc(action.label)}</button>` : ""}`;
  el.className = "toast show" + (isError ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = "toast"; }, isError ? 4800 : action ? 5200 : 2800);
}

// sheets
export const sheetEl = () => $("#sheet");
export function openSheet(html, { onClose } = {}) {
  const s = sheetEl();
  s.innerHTML = html;
  s._onClose = onClose || null;
  if (!s.open) s.showModal();
  s.scrollTop = 0;
}
export function closeSheet() {
  const s = sheetEl();
  if (s.open) s.close();
}
export function bindSheet() {
  const s = sheetEl();
  s.addEventListener("close", () => { s.innerHTML = ""; const f = s._onClose; s._onClose = null; if (f) f(); });
  // click outside closes it
  s.addEventListener("click", e => { if (e.target === s) s.close(); });
}

// confirm box instead of confirm()
export function askConfirm({ title, body = "", ok = "Confirm", cancel = "Cancel", danger = false, phrase = "" }) {
  const dlg = $("#modal");
  return new Promise(resolve => {
    dlg.innerHTML = `<form method="dialog" class="modal-in">
      <h2 id="modal-title">${esc(title)}</h2>
      ${body ? `<p class="modal-body">${body}</p>` : ""}
      ${phrase ? `<label class="label" for="modal-phrase">Type <strong>${esc(phrase)}</strong> to confirm</label><input class="input" id="modal-phrase" autocomplete="off" autocapitalize="off" spellcheck="false">` : ""}
      <div class="modal-btns">
        <button type="button" class="btn secondary" data-modal="cancel">${esc(cancel)}</button>
        <button type="submit" class="btn ${danger ? "danger" : "primary"}" data-modal="ok"${phrase ? " disabled" : ""}>${esc(ok)}</button>
      </div>
    </form>`;
    let result = false;
    const okBtn = dlg.querySelector('[data-modal="ok"]');
    const input = dlg.querySelector("#modal-phrase");
    if (input) input.addEventListener("input", () => { okBtn.disabled = input.value.trim().toLowerCase() !== phrase.trim().toLowerCase(); });
    dlg.querySelector('[data-modal="cancel"]').addEventListener("click", () => dlg.close());
    dlg.querySelector("form").addEventListener("submit", () => { result = true; });
    dlg.addEventListener("close", () => { dlg.innerHTML = ""; resolve(result); }, { once: true });
    dlg.showModal();
    (input || dlg.querySelector('[data-modal="cancel"]')).focus();
  });
}

// small shared pieces
export const errorBox = (msg, act) => `<div class="empty"><p>${esc(msg)}</p><button class="btn secondary" data-act="${act}">${icon("refresh")}Try again</button></div>`;
export const skeleton = (n, cls = "") => `<div class="skel-list ${cls}" aria-busy="true"><span class="sr-only">Loading</span>${'<div class="skel"></div>'.repeat(n)}</div>`;

export function focusTitle() {
  const h = $("#main h1");
  if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
}
export const refocus = sel => { const el = $(sel); if (el) el.focus(); };

export const head = (eyebrow, title, sub = "", side = "") => `<header class="page-head">
  <div class="page-head-main">${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ""}<h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ""}</div>${side}
</header>`;
