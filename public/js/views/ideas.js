// suggestions: vote, did you mean, staff tools
import { $, esc, plural, timeAgo, D } from "../util.js";
import { state, school, IDEA_MAX, IDEA_STATUSES } from "../state.js";
import { api, enqueue } from "../api.js";
import { icon } from "../icons.js";
import { t } from "../i18n.js";
import { render, toast, registerActions, head, errorBox, skeleton, currentTab, askConfirm, openSheet, closeSheet, hooks } from "../ui.js";

// load ideas
export async function loadIdeas() {
  if (state.loading.has("ideas")) return;
  state.loading.add("ideas");
  const s = school(), mode = state.mode;
  try {
    const ideas = (await api("GET", `ideas?school=${s.id}`, undefined, mode === "student" ? { student: s.id } : {})).ideas;
    if (state.mode === mode) state.ideas = ideas;
    if (mode === "admin") {
      try { state.dupes = (await api("GET", `ideas/dupes?school=${s.id}`)).pairs; } catch { state.dupes = []; }
    }
  } catch (e) { if (state.mode === mode) state.ideas = { error: e.message }; }
  state.loading.delete("ideas");
  if (state.mode && !state.ob && ["ideas", "menu", "insights"].includes(currentTab())) {
    // only banners depend on ideas, refresh just those
    const needsCards = Array.isArray(state.ideas) && state.ideas.some(i => i.dish);
    if (currentTab() === "menu" && !needsCards && hooks.ideasLoaded) hooks.ideasLoaded(); else render();
  }
}

// status tag
const statusChip = i => i.status && i.status !== "new" ? `<span class="status s-${i.status}">${esc(t("status." + i.status))}</span>` : "";
// most votes first
const sorted = list => [...list].sort((a, b) => b.count - a.count || b.created_at.localeCompare(a.created_at));

// student side
// did you mean list
function matchesHTML() {
  const ms = state.ideaMatches;
  if (!ms.length) return "";
  return `<div class="dym" role="region" aria-label="${esc(t("ideas.dym"))}">
    <p class="dym-k">${icon("sparkles")}${esc(ms.some(m => m.same) ? t("ideas.dym") : t("ideas.similar"))}</p>
    <ul>${ms.map(m => `<li><span class="dym-t">${esc(m.text)}<em>${esc(plural(m.count, t("ideas.vote"), t("ideas.votes")))}</em></span>
      <button type="button" class="btn secondary sm" data-act="idea-join" data-id="${m.id}">${icon("arrowUp")}${esc(t("ideas.addVote"))}</button></li>`).join("")}</ul>
    <button type="button" class="link" data-act="idea-new">${esc(t("ideas.postNew"))}</button>
  </div>`;
}

// the leaderboard
function board(admin) {
  const ideas = state.ideas;
  if (!ideas) { loadIdeas(); return skeleton(3); }
  if (ideas.error) return errorBox(ideas.error, "retry-ideas");
  let list = sorted(ideas.filter(i => !(admin && false)));
  if (!list.length) return `<div class="empty"><p>${esc(admin ? "Nobody's suggested anything yet. Students can post ideas from the Ideas tab in their app." : t("ideas.empty"))}</p></div>`;
  return `<ol class="board">${list.map((it, i) => `<li class="bd">
    <span class="bd-rank" aria-hidden="true">${i + 1}</span>
    <div class="bd-main">
      <p class="bd-text">${esc(it.text)}${statusChip(it)}</p>
      ${it.reply ? `<p class="bd-reply"><strong>${esc(admin ? "You" : t("ideas.kitchen"))}:</strong> ${esc(it.reply)}</p>` : ""}
      ${it.own || it.dish ? `<p class="bd-meta">${it.own ? `<span>${esc(t("ideas.yours"))}</span>` : ""}${it.dish ? `<span>${icon("calendar")}${esc(D.fmt(it.dish.date, { weekday: "short" }))}</span>` : ""}</p>` : ""}
      ${admin ? staffControls(it) : ""}
    </div>
    ${admin
      ? `<span class="bd-count">${icon("arrowUp")}${it.count}<span class="sr-only"> ${esc(it.count === 1 ? t("ideas.vote") : t("ideas.votes"))}</span></span>`
      : `<button class="vote-btn" data-act="idea-vote" data-id="${it.id}" aria-pressed="${it.voted}" aria-label="${esc(t("ideas.meToo", { text: it.text, n: plural(it.count, t("ideas.vote"), t("ideas.votes")) }))}">${icon("arrowUp")}<span>${it.count}</span></button>`}
  </li>`).join("")}</ol>`;
}

// student ideas page
export function viewIdeasStudent() {
  return `${head("", esc(t("ideas.title")), esc(t("ideas.lede")))}
    ${board(false)}
    <section class="suggest" aria-labelledby="suggest-t">
      <h2 id="suggest-t">${esc(t("ideas.suggest"))}</h2>
      <form class="idea-form" data-form="idea">
        <label class="sr-only" for="idea-in">${esc(t("ideas.label"))}</label>
        <input class="input" id="idea-in" maxlength="${IDEA_MAX}" value="${esc(state.ideaDraft)}" placeholder="${esc(t("ideas.ph"))}" autocomplete="off" enterkeyhint="send" data-idea-input>
        <div id="idea-matches" aria-live="polite">${matchesHTML()}</div>
        <button class="btn primary lg" type="submit"${state.ideaDraft.trim().length < 2 ? " disabled" : ""}>${esc(t("ideas.post"))}</button>
      </form>
    </section>`;
}

// search for similar while typing
let simTimer, simSeq = 0;
export function onIdeaInput(input) {
  state.ideaDraft = input.value;
  state.ideaForce = false;
  const post = input.form?.querySelector("button[type=submit]");
  if (post) post.disabled = input.value.trim().length < 2;
  clearTimeout(simTimer);
  const q = input.value.trim(), seq = ++simSeq;
  if (q.length < 3) { state.ideaMatches = []; const b = $("#idea-matches"); if (b) b.innerHTML = ""; return; }
  simTimer = setTimeout(async () => {
    try {
      const out = await api("GET", `ideas/similar?school=${school().id}&q=${encodeURIComponent(q)}`);
      if (seq !== simSeq) return;
      state.ideaMatches = out.matches;
      const b = $("#idea-matches"); if (b) b.innerHTML = matchesHTML();
    } catch { /* matching is a nicety; posting still works */ }
  }, 260);
}

// post an idea
async function postIdea() {
  const input = $("#idea-in");
  const text = input.value.trim();
  if (text.length < 2) { toast(t("ideas.tooShort"), true); input.focus(); return; }
  if (!state.ideaForce && state.ideaMatches.some(m => m.same)) {
    $("#idea-matches")?.scrollIntoView({ block: "nearest" });
    toast(t("ideas.checkFirst"));
    return;
  }
  const btn = input.form.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    const out = await api("POST", "ideas", { school: school().id, text }, { student: school().id });
    if (Array.isArray(state.ideas)) {
      const i = state.ideas.findIndex(x => x.id === out.idea.id);
      if (i >= 0) state.ideas[i] = { ...state.ideas[i], ...out.idea }; else state.ideas.push(out.idea);
    }
    state.ideaDraft = ""; state.ideaMatches = []; state.ideaForce = false;
    render();
    toast(out.merged ? t("ideas.merged") : t("ideas.posted"));
    $("#idea-in")?.focus();
  } catch (e) { btn.disabled = false; toast(e.message, true); }
}

// vote on an idea
async function voteIdea(id, forceOn) {
  const it = Array.isArray(state.ideas) && state.ideas.find(x => x.id === id);
  if (!it) return;
  const on = forceOn ?? !it.voted, before = { voted: it.voted, count: it.count };
  if (on === it.voted) return;
  it.voted = on; it.count += on ? 1 : -1;
  render();
  document.querySelector(`[data-act="idea-vote"][data-id="${id}"]`)?.focus();
  try {
    const r = await enqueue("idea-" + id, () => api("POST", `ideas/${id}/vote`, { school: school().id, on }, { student: school().id }));
    if (it.voted === on) it.count = r.count;
  } catch (e) {
    if (it.voted === on) Object.assign(it, before);
    toast(e.message, true);
    if (e.status === 404) state.ideas = null;
  }
  render();
  document.querySelector(`[data-act="idea-vote"][data-id="${id}"]`)?.focus();
}

// staff side
// status, reply, merge, delete
function staffControls(it) {
  return `<div class="bd-tools">
    <div class="seg mini" role="group" aria-label="Status for ${esc(it.text)}">
      ${IDEA_STATUSES.map(s => `<button data-act="idea-status" data-id="${it.id}" data-status="${s}" aria-pressed="${(it.status || "new") === s}">${esc(t("status." + s))}</button>`).join("")}
    </div>
    <button class="btn ghost sm" data-act="idea-reply" data-id="${it.id}">${icon("megaphone")}${it.reply ? "Edit reply" : "Reply"}</button>
    <button class="icon-btn danger" data-act="idea-del" data-id="${it.id}" aria-label="Remove suggestion: ${esc(it.text)}">${icon("trash")}</button>
  </div>`;
}

// ideas that look the same
function dupesCard() {
  const pairs = state.dupes || [], ideas = Array.isArray(state.ideas) ? state.ideas : [];
  const by = Object.fromEntries(ideas.map(i => [i.id, i]));
  const rows = pairs.map(p => ({ ...p, A: by[p.a], B: by[p.b] })).filter(p => p.A && p.B).slice(0, 5);
  if (!rows.length) return "";
  return `<section class="card dupes"><div class="card-head"><h2>${icon("merge")}Possible duplicates</h2><span class="muted small">Merge to combine their votes</span></div>
    <ul class="dupe-list">${rows.map(({ A, B, score }) => {
      const [keep, drop] = A.count >= B.count ? [A, B] : [B, A];
      return `<li><p><strong>${esc(drop.text)}</strong> <span class="muted">(${drop.count})</span> looks like <strong>${esc(keep.text)}</strong> <span class="muted">(${keep.count})</span></p>
        <button class="btn secondary sm" data-act="idea-merge" data-from="${drop.id}" data-into="${keep.id}">${icon("merge")}Merge into “${esc(keep.text)}”</button></li>`;
    }).join("")}</ul></section>`;
}

// staff ideas page
export function viewIdeasAdmin() {
  return `${head("", "What students are asking for", "These are dishes students would love to see, ranked by how many of them agree. Let them know what you're planning and why.",
    `<button class="icon-btn outlined" data-act="retry-ideas" aria-label="Refresh">${icon("refresh")}</button>`)}
    ${state.ideas && !state.ideas.error ? dupesCard() : ""}
    ${board(true)}`;
}

// small ideas card
export function ideasCard(ideas) {
  return `<section class="card">
    <div class="card-head"><h2>${icon("lightbulb")}Top student ideas</h2><a class="link" href="#ideas">See all</a></div>
    <ol class="board compact">${ideas.slice(0, 3).map((it, i) => `<li class="bd"><span class="bd-rank">${i + 1}</span>
      <div class="bd-main"><p class="bd-text">${esc(it.text)}</p></div><span class="bd-count">${icon("arrowUp")}${it.count}<span class="sr-only"> ${it.count === 1 ? "vote" : "votes"}</span></span></li>`).join("")}</ol>
  </section>`;
}

// save a change to an idea
async function patchIdea(id, patch, msg) {
  try {
    await api("PATCH", `ideas/${id}`, { school: school().id, ...patch });
    const it = state.ideas.find(x => x.id === id);
    if (it) Object.assign(it, patch);
    state.insights = null;
    render();
    toast(msg);
  } catch (e) { toast(e.message, true); }
}

registerActions({
  "idea-vote"(el) { voteIdea(el.dataset.id); },
  "idea-join"(el) { voteIdea(el.dataset.id, true); state.ideaDraft = ""; state.ideaMatches = []; render(); toast(t("ideas.voteAdded")); },
  "idea-new"() { state.ideaForce = true; state.ideaMatches = []; const b = $("#idea-matches"); if (b) b.innerHTML = ""; postIdea(); },
  "idea-view"(el) { state.ideaView = el.dataset.view; render(); document.querySelector(`[data-act="idea-view"][data-view="${state.ideaView}"]`)?.focus(); },
  "retry-ideas"() { state.ideas = null; render(); },

  "idea-status"(el) {
    const id = el.dataset.id, status = el.dataset.status;
    if (status === "on_menu") {
      openSheet(`<form class="sheet-form" data-form="idea-menu" data-id="${id}">
        <h2 id="sheet-title">Which day is it on the menu?</h2>
        <p class="muted">Students who asked for it will see a “You asked for this” tag on that day's matching dish.</p>
        <label class="label" for="idea-date">Date</label>
        <input class="input" id="idea-date" type="date" value="${esc(state.today || "")}" required>
        <div class="modal-btns"><button type="button" class="btn secondary" data-act="sheet-close">Cancel</button><button class="btn primary" type="submit">Save</button></div>
      </form>`);
      return;
    }
    patchIdea(id, { status, served_on: "" }, `Marked “${t("status." + status)}”`);
  },
  "idea-reply"(el) {
    const it = state.ideas.find(x => x.id === el.dataset.id);
    openSheet(`<form class="sheet-form" data-form="idea-reply" data-id="${it.id}">
      <h2 id="sheet-title">Reply to students</h2>
      <p class="muted">Everyone sees this under “${esc(it.text)}”. Keep it short and kind.</p>
      <label class="label" for="idea-reply-in">Your reply</label>
      <input class="input" id="idea-reply-in" maxlength="160" value="${esc(it.reply || "")}" placeholder="e.g. Trying this the first week of November">
      <div class="modal-btns"><button type="button" class="btn secondary" data-act="sheet-close">Cancel</button><button class="btn primary" type="submit">Save reply</button></div>
    </form>`);
    $("#idea-reply-in")?.focus();
  },
  async "idea-del"(el) {
    const it = state.ideas.find(x => x.id === el.dataset.id);
    if (!it || !(await askConfirm({ title: "Remove this suggestion?", body: `“${esc(it.text)}” and its votes will be deleted.`, ok: "Remove", danger: true }))) return;
    try {
      await api("DELETE", `ideas/${it.id}?school=${school().id}`);
      state.ideas = state.ideas.filter(x => x !== it); state.insights = null; render(); toast("Suggestion removed");
    } catch (e) { toast(e.message, true); }
  },
  async "idea-merge"(el) {
    try {
      await api("POST", `ideas/${el.dataset.from}/merge`, { school: school().id, into: el.dataset.into });
      state.ideas = null; state.dupes = null; state.insights = null; render(); toast("Merged. Their votes now count together.");
    } catch (e) { toast(e.message, true); }
  },
});

// forms
export async function submitIdeaForm(f) {
  if (f.dataset.form === "idea") return postIdea();
  const id = f.dataset.id;
  if (f.dataset.form === "idea-menu") {
    const date = $("#idea-date").value;
    closeSheet();
    return patchIdea(id, { status: "on_menu", served_on: date }, "Marked “On the menu”");
  }
  if (f.dataset.form === "idea-reply") {
    const reply = $("#idea-reply-in").value.trim();
    closeSheet();
    return patchIdea(id, { reply }, reply ? "Reply saved" : "Reply removed");
  }
}
