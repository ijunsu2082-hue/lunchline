// A working miniature of the student app for the landing page: rate dishes, flag an allergy or vegetarian,
// vote on ideas, suggest one. It runs entirely in the page; nothing is saved or sent.
import { esc } from "../util.js";
import { icon } from "../icons.js";

const DISHES = [
  { id: "t1", name: "Teriyaki Chicken & Rice Bowl", img: "teriyaki-chicken-bowl", cal: 540, meat: true, allergens: ["Soy", "Wheat"], desc: "Grilled teriyaki chicken over steamed rice with a side salad." },
  { id: "t2", name: "Cheese Pizza", img: "cheese-pizza", cal: 290, allergens: ["Dairy", "Wheat"], desc: "A slice of cheese pizza with tomato sauce and mozzarella." },
  { id: "t3", name: "Caesar Salad", img: "caesar-salad", cal: 280, allergens: ["Eggs", "Dairy"], desc: "Romaine, parmesan and crunchy croutons with Caesar dressing." },
  { id: "t4", name: "Beef Street Tacos", img: "beef-tacos", cal: 480, meat: true, allergens: [], desc: "Three corn tortillas with seasoned beef, onion, cilantro and lime." },
];
const IDEAS = [["Orange chicken with fried rice", 142], ["Birria tacos", 118], ["More vegetarian bowls", 97]];
const FLAGS = [["veg", "Vegetarian"], ["Eggs", "Egg allergy"], ["Dairy", "Dairy allergy"]];

export function tourHTML() {
  return `<div class="tp" data-tour>
    <div class="tp-phone">
      <div class="tp-notch" aria-hidden="true"></div>
      <div class="tp-screen" aria-live="polite"></div>
      <div class="tp-toast" role="status" hidden></div>
    </div>
  </div>`;
}

export function bindTour(root) {
  const el = root.querySelector("[data-tour]");
  if (!el) return;
  const screen = el.querySelector(".tp-screen"), toastEl = el.querySelector(".tp-toast");
  const S = { tab: "lunch", rated: {}, open: null, flags: new Set(), ideas: IDEAS.map(([text, n]) => ({ text, n, voted: false })), draft: "", added: 0 };
  let toastTimer;
  const say = msg => { toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.hidden = true; }, 1700); };
  const warn = d => {
    const hits = [];
    if (S.flags.has("veg") && d.meat) hits.push("meat");
    for (const a of ["Eggs", "Dairy"]) if (S.flags.has(a) && d.allergens.includes(a)) hits.push(a === "Eggs" ? "egg" : "dairy");
    return hits;
  };

  const dish = d => {
    const w = warn(d), r = S.rated[d.id], open = S.open === d.id;
    return `<article class="tp-dish${w.length ? " warn" : ""}">
      <button type="button" class="tp-photo" data-open="${d.id}" aria-expanded="${open}" aria-label="${esc(d.name)}, ${d.cal} calories. Show details">
        <img src="/samples/${d.img}.jpg" alt="" width="400" height="300" loading="lazy" decoding="async">
        ${w.length ? `<span class="tp-flag">${icon("alert")}Has ${esc(w.join(" and "))}</span>` : ""}
      </button>
      <p class="tp-name">${esc(d.name)}</p><p class="tp-sub">${d.cal} cal</p>
      ${open ? `<p class="tp-more">${esc(d.desc)} Contains: ${d.allergens.length ? esc(d.allergens.join(", ")) : "no major allergens"}.</p>` : ""}
      <div class="tp-rate" role="group" aria-label="Rate ${esc(d.name)}">
        ${[["good", "thumbUp", "Good"], ["mid", "thumbMid", "Mid"], ["bad", "thumbDown", "Bad"]].map(([k, ic, label]) => `<button type="button" class="r-${k}" data-rate="${d.id}:${k}" aria-pressed="${r === k}" aria-label="${label}">${icon(ic)}</button>`).join("")}
      </div>
    </article>`;
  };

  const body = () => {
    if (S.tab === "ideas") return `<h4 class="tp-h">What should be on the menu?</h4><p class="tp-p">Vote up the ideas you want.</p>
      <ol class="tp-ideas">${S.ideas.map((it, i) => `<li><span class="tp-n">${i + 1}</span><span class="tp-it">${esc(it.text)}</span>
        <button type="button" class="tp-vote" data-vote="${i}" aria-pressed="${it.voted}" aria-label="Vote for ${esc(it.text)}, ${it.n} votes">${icon("arrowUp")}<b>${it.n}</b></button></li>`).join("")}</ol>
      <form class="tp-suggest" data-suggest><label class="sr-only" for="tp-idea">Suggest a dish</label>
        <input id="tp-idea" maxlength="40" placeholder="Suggest a dish" value="${esc(S.draft)}" autocomplete="off">
        <button type="submit"${S.draft.trim().length < 2 ? " disabled" : ""}>Post</button></form>`;
    if (S.tab === "me") return `<h4 class="tp-h">Your profile</h4><p class="tp-p">Tell it once. Dishes that don't fit get a red flag.</p>
      <div class="tp-flags">${FLAGS.map(([k, label]) => `<button type="button" data-flag="${k}" aria-pressed="${S.flags.has(k)}">${icon("check")}${label}</button>`).join("")}</div>
      <p class="tp-p small">Then check the Lunch tab. Students keep all of this on their own phone.</p>`;
    return `<h4 class="tp-h">The menu for Friday</h4>
      <div class="tp-grid">${DISHES.map(dish).join("")}</div>`;
  };

  function draw(focusSel) {
    const top = screen.scrollTop;
    screen.innerHTML = `<div class="tp-bar"><span class="tp-logo" aria-hidden="true"></span><nav class="tp-tabs" aria-label="Demo app">${[["lunch", "Lunch"], ["ideas", "Ideas"], ["me", "Me"]].map(([k, l]) => `<button type="button" data-tab="${k}" aria-pressed="${S.tab === k}">${l}</button>`).join("")}</nav></div>
      <div class="tp-body"><p class="tp-school">Irvine High School</p>${body()}<p class="tp-note">Try it. Nothing here is saved or sent.</p></div>`;
    screen.scrollTop = top;
    if (focusSel) screen.querySelector(focusSel)?.focus({ preventScroll: true });
  }

  screen.addEventListener("click", e => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.tab) { S.tab = t.dataset.tab; screen.scrollTop = 0; draw(`[data-tab="${S.tab}"]`); }
    else if (t.dataset.open) { S.open = S.open === t.dataset.open ? null : t.dataset.open; draw(`[data-open="${t.dataset.open}"]`); }
    else if (t.dataset.rate) {
      const [id, k] = t.dataset.rate.split(":");
      if (S.rated[id] === k) delete S.rated[id]; else { S.rated[id] = k; say("Sent to the kitchen. Thanks!"); }
      draw(`[data-rate="${t.dataset.rate}"]`);
    } else if (t.dataset.vote) {
      const it = S.ideas[+t.dataset.vote]; it.voted = !it.voted; it.n += it.voted ? 1 : -1;
      S.ideas.sort((a, b) => b.n - a.n);
      draw(`[data-vote="${S.ideas.indexOf(it)}"]`);
    } else if (t.dataset.flag) {
      S.flags.has(t.dataset.flag) ? S.flags.delete(t.dataset.flag) : S.flags.add(t.dataset.flag);
      draw(`[data-flag="${t.dataset.flag}"]`);
    }
  });
  screen.addEventListener("input", e => {
    if (e.target.id !== "tp-idea") return;
    S.draft = e.target.value;
    const b = screen.querySelector("[data-suggest] button"); if (b) b.disabled = S.draft.trim().length < 2;
  });
  screen.addEventListener("submit", e => {
    if (!e.target.matches("[data-suggest]")) return;
    e.preventDefault();
    const text = S.draft.trim();
    if (text.length < 2 || S.added >= 3) return;
    S.added++; S.ideas.push({ text, n: 1, voted: true }); S.ideas.sort((a, b) => b.n - a.n); S.draft = "";
    say("Posted. Your classmates can vote on it.");
    draw("#tp-idea");
  });
  draw();
}
