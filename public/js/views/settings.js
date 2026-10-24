// School settings: join code and QR, school color, grades and enrollment, the
// team (invite by email, roles), activity log, and the danger zone.
import { $, esc, plural, LS, inviteLink, parentLink, timeAgo } from "../util.js";
import { state, school, can, GRADE_ORDER } from "../state.js";
import { api } from "../api.js";
import { icon } from "../icons.js";
import { render, toast, registerActions, head, skeleton, currentTab, askConfirm } from "../ui.js";
import { applyTheme, themeVars, PRESET_GROUPS, colorName, isHex, DEFAULT_COLOR } from "../theme.js";
import { setMode, leaveToWelcome } from "../session.js";
import { qrSvg } from "./qr.js";

const GRADES = GRADE_ORDER;

async function loadTeam() {
  if (state.loading.has("team")) return;
  state.loading.add("team");
  try {
    const s = school();
    const team = await api("GET", `staff?school=${s.id}`);
    let audit = [];
    if (can("admin")) { try { audit = (await api("GET", `audit?school=${s.id}`)).entries; } catch { /* the log is optional */ } }
    state.team = { ...team, audit };
  } catch (e) { state.team = { error: e.message }; }
  state.loading.delete("team");
  if (state.mode === "admin" && !state.ob && currentTab() === "school") render();
}

const roleBadge = r => `<span class="role-badge r-${r}">${esc(r)}</span>`;

function previewStyle(color) {
  return Object.entries(themeVars(color)).map(([k, v]) => `${k}:${v}`).join(";");
}

export function viewSchool() {
  const a = state.admin, s = a.school;
  const color = (state.draftColor || s.theme?.color || DEFAULT_COLOR).toUpperCase();
  const grades = state.draftGrades || s.grades || ["9", "10", "11", "12"];
  if (!state.team) loadTeam();
  const team = state.team;
  const admin = can("admin"), owner = can("owner");
  const dirtyColor = color !== (s.theme?.color || DEFAULT_COLOR).toUpperCase();

  return `${head("Settings", esc(s.name), "Everything students and families see about your school.")}
  <div class="bento">
    <section class="tile join">
      <div class="join-qr">${qrSvg(inviteLink(s.code), { label: `QR code to join ${s.name}` })}</div>
      <div class="join-text">
        <p class="tile-k">${icon("qr")}Student join</p>
        <p class="big-code">${esc(s.code)}</p>
        <p class="tile-s">Students scan the QR, enter the code, or search “${esc(s.name)}”. No account, no email.</p>
        ${/^(localhost|127\.|\[::1\])/.test(location.hostname) ? `<div class="alert caution">${icon("info")}<p><strong>Testing on your computer?</strong> This QR points to <span class="mono">${esc(location.host)}</span>, which a phone can't open. Run <span class="mono">npm run dev:lan</span>, then open the app from the “On your phone” address it prints, and the QR will work.</p></div>` : ""}
        <div class="row-btns">
          <button class="btn primary" data-act="poster-open" data-kind="letter">${icon("printer")}Print QR poster</button>
          <button class="btn secondary" data-act="copy" data-text="${esc(inviteLink(s.code))}" data-label="Invite link">${icon("link")}Copy link</button>
          <button class="btn secondary" data-act="copy" data-text="${esc(s.code)}" data-label="Join code">${icon("copy")}Copy code</button>
        </div>
        <div class="row-btns">
          <button class="btn ghost sm" data-act="poster-open" data-kind="tent">Table tent</button>
          <button class="btn ghost sm" data-act="poster-open" data-kind="parent">Family menu card</button>
          <button class="btn ghost sm" data-act="copy" data-text="${esc(parentLink(s.code))}" data-label="Family link">${icon("link")}Family link</button>
        </div>
      </div>
    </section>

    <section class="tile grades-tile">
      <p class="tile-k">${icon("grad")}Grades &amp; enrollment</p>
      <p class="tile-s">Students can optionally share their grade in one tap. You'll see what each grade likes, only for groups of 5 or more.</p>
      <form data-form="school-grades">
        <fieldset class="fs"><legend class="label">Grades at your school</legend>
          <div class="toggles">${GRADES.map(g => `<button type="button" class="toggle" data-act="grade-toggle" data-grade="${g}" aria-pressed="${grades.includes(g)}"${admin ? "" : " disabled"}>${g}</button>`).join("")}</div></fieldset>
        <label class="label" for="enroll">Total students enrolled <span class="muted">(optional, for participation %)</span></label>
        <input class="input" id="enroll" type="number" inputmode="numeric" min="0" max="20000" value="${s.enrollment || ""}" placeholder="e.g. 850"${admin ? "" : " disabled"}>
        ${admin ? `<div class="row-btns"><button class="btn primary" type="submit">Save</button></div>` : `<p class="muted small">Ask an admin to change this.</p>`}
      </form>
    </section>

    <section class="tile wide">
      <div class="card-head"><h2>${icon("users")}Your team</h2><span class="muted small">${team && team.members ? plural(team.members.length, "person", "people") : ""}</span></div>
      ${!team ? skeleton(2) : team.error ? `<p class="muted">${esc(team.error)}</p>` : `
        ${team.legacy_key ? `<div class="alert caution">${icon("key")}<p><strong>This school still has its old shared staff key.</strong> Add your email below and sign in with it, then retire the key so only named people have access.${a.via === "email" && owner ? ` <button class="link" data-act="retire-key">Retire the old key now</button>` : ""}</p></div>` : ""}
        <ul class="team">${team.members.map(m => `<li>
          <span class="team-av" aria-hidden="true">${esc(m.email.charAt(0).toUpperCase())}</span>
          <div class="team-main"><p class="team-e">${esc(m.email)}${m.me ? ' <span class="muted">(you)</span>' : ""}</p><p class="team-s">${roleBadge(m.role)} · added ${esc(timeAgo(m.added_at))}</p></div>
          ${admin && !m.me ? `<button class="icon-btn danger" data-act="team-remove" data-id="${m.id}" data-email="${esc(m.email)}" aria-label="Remove ${esc(m.email)}">${icon("trash")}</button>` : ""}
        </li>`).join("")}</ul>
        ${admin ? `<form class="invite" data-form="invite">
          <label class="label" for="inv-email">Add someone from your cafeteria or office</label>
          <div class="invite-row"><input class="input" id="inv-email" type="email" inputmode="email" placeholder="name@school.edu" autocomplete="off" required>
            <select class="input" id="inv-role" aria-label="Role"><option value="cook">Cook: edit menu, reply</option><option value="admin">Admin: manage team</option>${owner ? '<option value="owner">Owner: everything</option>' : ""}</select>
            <button class="btn primary" type="submit">${icon("mail")}Invite</button></div>
          <p class="help">They sign in with that email. We send them a link, no password.</p>
        </form>` : `<p class="muted small">Only admins can add or remove people.</p>`}`}
    </section>

    ${admin && team && team.audit && team.audit.length ? `<section class="tile wide"><div class="card-head"><h2>Recent activity</h2></div>
      <ul class="audit">${team.audit.slice(0, 10).map(e => `<li><span class="audit-who">${esc(e.by || "someone")}</span> ${esc(e.action)} <span class="muted">· ${esc(timeAgo(e.at))}</span></li>`).join("")}</ul></section>` : ""}

    <section class="tile wide group-tile">
      <div class="group">
        <div class="cell"><div class="cell-main"><p class="cell-t">Time zone</p><p class="cell-s">${esc(s.tz.replace(/_/g, " "))} · Today is ${esc(state.today || "")}</p></div></div>
        <button class="cell" data-act="as-student"><div class="cell-main"><p class="cell-t">Open student view</p><p class="cell-s">See and rate the menu the way students do</p></div>${icon("chevR")}</button>
        <button class="cell" data-act="signout"><div class="cell-main"><p class="cell-t">Sign out</p><p class="cell-s">${a.via === "email" ? "You'll get a new sign-in link by email next time" : "You'll need the staff key to sign back in"}</p></div>${icon("chevR")}</button>
        ${owner ? `<button class="cell danger" data-act="delete-school"><div class="cell-main"><p class="cell-t">Delete school</p><p class="cell-s">Permanently removes menus, photos, ratings, ideas and the team</p></div>${icon("chevR")}</button>` : ""}
      </div>
    </section>
  </div>`;
}

// ---------- actions ----------
function setColor(hex) {
  if (!isHex(hex)) return;
  state.draftColor = hex.toUpperCase();
  applyTheme(state.draftColor);
  render();
}

registerActions({
  color(el) { setColor(el.dataset.color); },
  "reset-color"() { state.draftColor = null; applyTheme(school().theme?.color); render(); },
  async "save-color"() {
    try {
      const out = await api("PATCH", `schools/${school().id}`, { theme: { color: state.draftColor } });
      state.admin.school = out.school;
      state.admin.schools = state.admin.schools.map(x => (x.school.id === out.school.id ? { ...x, school: out.school } : x));
      state.draftColor = null; applyTheme(out.school.theme.color);
      render(); toast("School color saved");
    } catch (e) { toast(e.message, true); }
  },
  "grade-toggle"(el) {
    const s = school(), cur = state.draftGrades || [...(s.grades || [])];
    const g = el.dataset.grade, i = cur.indexOf(g);
    if (i >= 0) cur.splice(i, 1); else cur.push(g);
    state.draftGrades = GRADES.filter(x => cur.includes(x));
    el.setAttribute("aria-pressed", String(i < 0));
  },
  async "team-remove"(el) {
    if (!(await askConfirm({ title: `Remove ${el.dataset.email}?`, body: "They'll lose access right away. You can add them again later.", ok: "Remove", danger: true }))) return;
    try { await api("DELETE", `staff/${el.dataset.id}?school=${school().id}`); state.team = null; render(); toast("Removed"); }
    catch (e) { toast(e.message, true); }
  },
  async "retire-key"() {
    if (!(await askConfirm({ title: "Retire the old staff key?", body: "Anyone still using it will be signed out. Make sure you and your team can sign in by email first.", ok: "Retire key", danger: true }))) return;
    try { await api("POST", `schools/${school().id}/retire-key`); LS.del("ll_admin"); state.team = null; render(); toast("Old key retired"); }
    catch (e) { toast(e.message, true); }
  },
  async "delete-school"() {
    const s = school();
    if (!(await askConfirm({ title: `Delete ${s.name}?`, body: "This permanently deletes the school and all of its menus, photos, ratings, comments, ideas and team. This can't be undone.", ok: "Delete school", danger: true, phrase: s.name }))) return;
    try {
      await api("DELETE", `schools/${s.id}`);
      if (state.student?.school.id === s.id) { LS.del("ll_student"); state.student = null; }
      LS.del("ll_admin"); LS.del("ll_admin_school"); state.admin = null;
      toast(`${s.name} was deleted`);
      if (state.student) setMode("student"); else leaveToWelcome();
    } catch (e) { toast(e.message, true); }
  },
  async signout() {
    if (!(await askConfirm({ title: "Sign out of the staff view?", body: state.admin.via === "email" ? "You can sign back in any time with your email." : "You'll need your staff key to sign back in.", ok: "Sign out" }))) return;
    try { await api("POST", "auth/logout"); } catch { /* the cookie is cleared locally either way */ }
    LS.del("ll_admin"); LS.del("ll_admin_school"); state.admin = null;
    if (state.student) setMode("student"); else leaveToWelcome();
    toast("Signed out");
  },
});

export function onColorInput(el) {
  if (el.matches("[data-color-input]")) setColor(el.value);
  if (el.matches("[data-color-hex]")) {
    let v = el.value.trim(); if (v && v[0] !== "#") v = "#" + v;
    if (isHex(v)) setColor(v);
  }
}

export async function submitSettingsForm(f) {
  if (f.dataset.form === "school-grades") {
    const s = school();
    const grades = state.draftGrades || s.grades;
    const enrollment = $("#enroll").value === "" ? 0 : Number($("#enroll").value);
    try {
      const out = await api("PATCH", `schools/${s.id}`, { grades, enrollment });
      state.admin.school = out.school; state.draftGrades = null; state.insights = null;
      render(); toast("Saved");
    } catch (e) { toast(e.message, true); }
  }
  if (f.dataset.form === "invite") {
    const email = $("#inv-email").value.trim(), role = $("#inv-role").value;
    try {
      await api("POST", "staff", { school: school().id, email, role });
      state.team = null; render(); toast(`${email} added. They can sign in now.`);
    } catch (e) { toast(e.message, true); }
  }
}
