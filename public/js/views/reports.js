// Reports: the weekly kitchen report (AI-written summary with the real numbers
// beside it), on demand or by Monday email.
import { $, esc, plural, D, shortDay } from "../util.js";
import { state, school } from "../state.js";
import { api } from "../api.js";
import { icon } from "../icons.js";
import { render, toast, registerActions, head, skeleton, currentTab } from "../ui.js";

async function loadReports() {
  if (state.loading.has("reports")) return;
  state.loading.add("reports");
  try {
    state.reports = (await api("GET", `reports?school=${school().id}`)).reports;
    const team = await api("GET", `staff?school=${school().id}`);
    state.myReports = team.members.find(m => m.me)?.reports ?? null;
  } catch (e) { state.reports = { error: e.message }; }
  state.loading.delete("reports");
  if (state.mode === "admin" && !state.ob && currentTab() === "reports") render();
}

const list = (items, empty) => items.length ? `<ol class="rank flat">${items.map((d, i) => `<li><span class="rank-n">${i + 1}</span><div class="rank-main"><p class="rank-t">${esc(d.name)}</p></div><p class="rank-p"><strong>${d.pct}%</strong><span>${d.n} ratings</span></p></li>`).join("")}</ol>` : `<p class="muted small">${esc(empty)}</p>`;

function reportCard(r, latest) {
  return `<article class="tile wide report${latest ? " latest" : ""}">
    <div class="card-head"><h2>${latest ? "Latest report" : "Week of " + esc(shortDay(r.from))}</h2><span class="muted small">${esc(shortDay(r.from))} – ${esc(shortDay(r.to))}${r.ai ? " · written with AI" : ""}</span></div>
    <div class="rep-stats"><div><strong>${r.good_pct}%</strong><span>rated Good</span></div><div><strong>${r.ratings}</strong><span>ratings</span></div><div><strong>${r.students}</strong><span>students</span></div>${r.waste_pounds != null ? `<div><strong>${r.waste_pounds}</strong><span>lb wasted</span></div>` : ""}</div>
    <div class="rep-text">${esc(r.summary).split("\n\n").map(p => `<p>${p}</p>`).join("")}</div>
    ${latest ? `<div class="grid2"><div><h3 class="rep-h">Make more of these</h3>${list(r.loved, "Not enough ratings yet.")}</div><div><h3 class="rep-h">Fix or drop these</h3>${list(r.needs, "Nothing is standing out.")}</div></div>` : ""}
    ${r.bullets?.length ? `<ul class="rep-bullets">${r.bullets.map(b => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
  </article>`;
}

export function viewReports() {
  const rs = state.reports, email = state.admin.via === "email";
  const top = head("Reports", "Weekly report", "A plain-language summary of the week, with the numbers beside it.");
  if (!rs) { loadReports(); return top + skeleton(3); }
  if (rs.error) return top + `<div class="empty"><p>${esc(rs.error)}</p></div>`;
  const on = state.myReports;
  return `${top}
    <div class="bento">
      <section class="tile wide mail-card">
        <span class="mail-ic">${icon("mail")}</span>
        <div class="mail-body">
          <h2>Your Monday report</h2>
          <p>${email ? "Every Monday morning we email you a short summary of what students ate, what to fix, and what they said. You can also send this week's to yourself right now." : "Build this week's report any time. Sign in with your email to also get it by mail every Monday."}</p>
          <div class="mail-actions">
            <button class="btn primary" data-act="report-now">${icon(email ? "mail" : "sparkles")}${email ? "Email me this week's report" : "Build this week's report"}</button>
            ${email && on !== null ? `<button type="button" class="switch" role="switch" aria-checked="${on}" data-act="report-toggle"><span class="switch-track" aria-hidden="true"></span><span>Send me one every Monday</span></button>` : ""}
          </div>
        </div>
      </section>
      ${rs.length ? reportCard(rs[0], true) + rs.slice(1).map(r => reportCard(r, false)).join("")
        : `<section class="tile wide"><div class="empty slim"><p>No reports yet. Once students start rating, your first one will show up here.</p></div></section>`}
    </div>`;
}

registerActions({
  async "report-now"(el) {
    el.disabled = true; el.innerHTML = `${icon("sparkles")}Writing your report…`;
    try {
      const out = await api("POST", "reports/send", { school: school().id });
      state.reports = null; render();
      toast(out.emailed ? "Report ready. We emailed it to you." : "Report ready.");
    } catch (e) { toast(e.message, true); render(); }
  },
  async "report-toggle"() {
    try {
      const out = await api("PATCH", "staff/me", { school: school().id, reports: !state.myReports });
      state.myReports = out.reports; render(); toast(out.reports ? "Weekly email on" : "Weekly email off");
    } catch (e) { toast(e.message, true); }
  },
});
