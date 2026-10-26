// The student's own page: grade, allergies, food they like, button style,
// language, and leaving the school. Everything here lives on this device.
import { esc, cap, listJoin, LS, inviteLink, parentLink, copyText } from "../util.js";
import { state, school } from "../state.js";
import { icon } from "../icons.js";
import { t, LANGS, chooseLang, setLang } from "../i18n.js";
import { render, toast, registerActions, head, askConfirm } from "../ui.js";
import { startFlow, leaveToWelcome, setMode } from "../session.js";

const terms = s => String(s || "").toLowerCase().split(/[,;/\n]+/).map(x => x.trim()).filter(x => x.length >= 2);

export function viewMe() {
  const st = state.student, s = st.school;
  const allergies = [...st.allergies.map(a => t("allergen." + a)), ...terms(st.allergyOther).map(cap)];
  const foods = [...st.cuisines.map(c => t("cuisine." + c)), ...terms(st.cuisineOther).map(cap)];
  const style = LS.get("ll_style", "thumbs");
  const lang = document.documentElement.lang || "en";
  return `${head("", esc(t("me.title")), "")}
    <div class="group">
      <div class="cell">
        <div class="cell-main"><p class="cell-t">${esc(s.name)}</p><p class="cell-s">${esc(t("me.code"))} <span class="mono">${esc(s.code)}</span></p></div>
        <button class="btn secondary sm" data-act="copy" data-text="${esc(inviteLink(s.code))}" data-label="${esc(t("me.inviteLink"))}">${icon("link")}${esc(t("me.invite"))}</button>
      </div>
      <button class="cell" data-act="edit" data-step="grade">
        <div class="cell-main"><p class="cell-t">${esc(t("me.grade"))}</p><p class="cell-s">${st.grade ? esc(st.grade === "other" ? t("setup.gradeOther") : t("grade.n", { g: st.grade })) : esc(t("common.notSet"))}</p></div>${icon("chevR")}
      </button>
      <button class="cell" data-act="edit" data-step="allergies">
        <div class="cell-main"><p class="cell-t">${esc(t("me.allergies"))}</p><p class="cell-s">${allergies.length ? esc(listJoin(allergies)) : esc(t("common.none"))}</p></div>${icon("chevR")}
      </button>
      <button class="cell" data-act="edit" data-step="food">
        <div class="cell-main"><p class="cell-t">${esc(t("me.food"))}</p><p class="cell-s">${foods.length ? esc(listJoin(foods)) : esc(t("common.notSet"))}</p></div>${icon("chevR")}
      </button>
    </div>
    <div class="group">
      <div class="cell col">
        <div class="cell-main"><p class="cell-t">${esc(t("me.style"))}</p><p class="cell-s">${esc(t("me.style.why"))}</p></div>
        <div class="seg narrow" role="group" aria-label="${esc(t("me.style"))}">
          <button data-act="style" data-style="thumbs" aria-pressed="${style !== "faces"}">${icon("thumbUp")}${esc(t("me.thumbs"))}</button>
          <button data-act="style" data-style="faces" aria-pressed="${style === "faces"}">${icon("smile")}${esc(t("me.faces"))}</button>
        </div>
      </div>
      <div class="cell col">
        <div class="cell-main"><p class="cell-t">${esc(t("me.lang"))}</p></div>
        <div class="seg narrow" role="group" aria-label="${esc(t("me.lang"))}">
          ${LANGS.map(([k, l]) => `<button data-act="lang" data-lang="${k}" lang="${k}" aria-pressed="${lang === k}">${esc(l)}</button>`).join("")}
        </div>
      </div>
    </div>
    <p class="fine left">${icon("lock")}${esc(t("me.privacy"))}</p>
    <div class="group">
      <button class="cell" data-act="copy" data-text="${esc(parentLink(s.code))}" data-label="${esc(t("me.parentLink"))}"><div class="cell-main"><p class="cell-t">${esc(t("me.parent"))}</p><p class="cell-s">${esc(t("me.parent.why"))}</p></div>${icon("copy")}</button>
      ${state.admin ? `<button class="cell" data-act="to-admin"><div class="cell-main"><p class="cell-t">Staff view</p><p class="cell-s">${esc(state.admin.school.name)}</p></div>${icon("chevR")}</button>` : ""}
      <button class="cell" data-act="leave"><div class="cell-main"><p class="cell-t">${esc(t("me.leave", { school: s.name }))}</p><p class="cell-s">${esc(t("me.leave.why"))}</p></div>${icon("chevR")}</button>
    </div>`;
}

registerActions({
  async copy(el) { const ok = await copyText(el.dataset.text); toast(ok ? t("common.copied", { what: el.dataset.label }) : t("common.copyFail"), !ok); },
  edit(el) { startFlow("edit", {}, { steps: [el.dataset.step], exit: "app" }); },
  style(el) { LS.set("ll_style", el.dataset.style); render(); document.querySelector(`[data-act="style"][data-style="${el.dataset.style}"]`)?.focus(); },
  async leave() {
    const s = state.student.school;
    if (!(await askConfirm({ title: t("me.leaveTitle", { school: s.name }), body: t("me.leaveBody", { code: s.code }), ok: t("me.leaveOk") }))) return;
    LS.del("ll_student"); state.student = null;
    if (state.admin) setMode("admin"); else leaveToWelcome();
    toast(t("me.left"));
  },
  "to-admin"() { setMode("admin"); },
});
