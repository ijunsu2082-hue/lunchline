// QR codes and printable posters. The code is drawn right here as inline SVG
// with a vendored MIT library, so nothing about your school is sent to a QR service.
import qrcode from "../../vendor/qrcode.mjs";
import { esc, inviteLink, parentLink } from "../util.js";
import { icon, mark } from "../icons.js";
import { openSheet, registerActions, toast } from "../ui.js";
import { state } from "../state.js";

// Returns an <svg> string. `quiet` is the blank border, in modules.
export function qrSvg(text, { fg = "#20150D", bg = "#FFFFFF", quiet = 2, label = "QR code" } = {}) {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount(), size = n + quiet * 2;
  let path = "";
  for (let r = 0; r < n; r++) {
    let run = 0;
    for (let c = 0; c <= n; c++) {
      const on = c < n && qr.isDark(r, c);
      if (on) run++;
      else if (run) { path += `M${c - run + quiet} ${r + quiet}h${run}v1h-${run}z`; run = 0; }
    }
  }
  return `<svg class="qr" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(label)}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${bg}"/><path d="${path}" fill="${fg}"/></svg>`;
}

// What the poster says, in both languages so one sheet works on the tray line.
const POSTERS = {
  letter: {
    name: "Tray-line poster", sub: "Letter size, one per lunch line",
    html: s => `<div class="poster letter">
      <div class="poster-brand">${mark(56)}<span>LunchLine</span></div>
      <h2 class="poster-h">How was lunch?</h2>
      <p class="poster-es">¿Qué tal estuvo el almuerzo?</p>
      <div class="poster-qr">${qrSvg(inviteLink(s.code), { label: `QR code to join ${s.name}` })}</div>
      <p class="poster-step"><strong>Scan</strong> with your phone camera · <strong>Escanea</strong> con la cámara</p>
      <p class="poster-step">Tap <b>Good</b>, <b>Mid</b> or <b>Bad</b> under each dish. No account. No name.</p>
      <p class="poster-school">${esc(s.name)}</p>
      <p class="poster-code">Or go to <b>${esc(location.host)}</b> and enter code <b class="mono">${esc(s.code)}</b></p>
    </div>`,
  },
  tent: {
    name: "Table tent", sub: "Fold on the dashed line. The top half prints upside down so both sides read upright",
    html: s => `<div class="poster tent">
      <div class="tent-half flip"><p class="poster-h sm">Rate today's lunch</p><div class="poster-qr sm">${qrSvg(inviteLink(s.code), { label: `QR code to join ${s.name}` })}</div><p class="poster-code">${esc(s.name)} · <b class="mono">${esc(s.code)}</b></p></div>
      <div class="tent-half"><p class="poster-h sm">Rate today's lunch</p><div class="poster-qr sm">${qrSvg(inviteLink(s.code), { label: `QR code to join ${s.name}` })}</div><p class="poster-code">${esc(s.name)} · <b class="mono">${esc(s.code)}</b></p></div>
    </div>`,
  },
  parent: {
    name: "Family menu card", sub: "For the front office or newsletter",
    html: s => `<div class="poster letter">
      <div class="poster-brand">${mark(56)}<span>LunchLine</span></div>
      <h2 class="poster-h">This week's lunch menu</h2>
      <p class="poster-es">Menú de almuerzo de esta semana</p>
      <div class="poster-qr">${qrSvg(parentLink(s.code), { label: `QR code for the ${s.name} menu` })}</div>
      <p class="poster-step">Scan to see every dish with <strong>allergens and ingredients</strong>.</p>
      <p class="poster-school">${esc(s.name)}</p>
    </div>`,
  },
};

export function openPosterSheet(kind = "letter") {
  const s = state.admin.school, P = POSTERS[kind];
  openSheet(`<div class="poster-sheet">
    <header class="sheet-head">
      <div class="sheet-title"><h2 id="sheet-title">${esc(P.name)}</h2><p class="sheet-sub">${esc(P.sub)}</p></div>
      <button type="button" class="icon-btn" data-act="sheet-close" aria-label="Close">${icon("x")}</button>
    </header>
    <div class="seg narrow poster-kinds" role="group" aria-label="Poster style">
      ${Object.entries(POSTERS).map(([k, v]) => `<button data-act="poster-kind" data-kind="${k}" aria-pressed="${k === kind}">${esc(v.name)}</button>`).join("")}
    </div>
    <div class="poster-wrap">${P.html(s)}</div>
    <div class="modal-btns"><button class="btn primary" data-act="poster-print">${icon("printer")}Print</button></div>
  </div>`);
}

registerActions({
  "poster-open"(el) { openPosterSheet(el.dataset.kind || "letter"); },
  "poster-kind"(el) { openPosterSheet(el.dataset.kind); },
  "poster-print"() {
    document.body.classList.add("printing");
    const done = () => { document.body.classList.remove("printing"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    try { window.print(); } catch { done(); toast("Printing isn't available here. Save the page as a PDF instead.", true); }
  },
});
