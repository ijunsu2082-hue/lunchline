// The landing page. Real food photography, a serif headline, and plain talk.
// Styles: landing.css. Two colour themes (orange, olive), switched in the footer.
// Motion: startWelcomeMotion (scroll reveals, nav, count-up), all off for reduced motion.
import { esc, $, $$, reducedMotion } from "../util.js";
import { icon, mark } from "../icons.js";

const photo = (name, alt = "") => `<img src="/samples/${name}.jpg" alt="${esc(alt)}" width="800" height="600" loading="lazy" decoding="async">`;

const ROW_ONE = ["teriyaki-chicken-bowl", "cheese-pizza", "breakfast-burrito", "buffalo-chicken", "blueberry-muffin", "beef-tacos", "orange-chicken-rice", "yogurt-parfait"];
const ROW_TWO = ["pancakes", "beef-vindaloo", "pepperoni-pizza", "caesar-salad", "ravioli-bowl", "banana-bread", "chicken-tenders", "aloo-matar"];
const strip = names => `<div class="lx-track" aria-hidden="true">${[...names, ...names].map(n => `<figure>${photo(n)}</figure>`).join("")}</div>`;

const STEPS = [
  { photo: "cheese-pizza", t: "Scan the QR on the poster near the line.", p: "Today's menu opens right on your phone. No app to download and no account to make." },
  { photo: "teriyaki-chicken-bowl", t: "Vote Good, Mid or Bad under each dish.", p: "Any allergens you've flagged show up in red, so you know before you eat." },
  { photo: "orange-chicken-rice", t: "The kitchen answers on the dish.", p: "The cooks read your comments, fix what's wrong, and reply right under the dish." },
];

const THEME_KEY = "ll_lx_theme";
const THEMES = [["orange", "Orange"], ["olive", "Olive"]];
const savedTheme = () => { try { const v = localStorage.getItem(THEME_KEY); return THEMES.some(t => t[0] === v) ? v : "orange"; } catch { return "orange"; } };

export function welcomeHTML() {
  const theme = savedTheme();
  return `<div class="lx" data-theme="${theme}">
    <header class="lx-nav" id="lx-nav">
      <div class="lx-wrap lx-nav-in">
        <a class="lx-brand" href="/" aria-label="LunchLine home">${mark(30)}<span>LunchLine</span></a>
        <nav class="lx-links" aria-label="Page"><a href="#problem">Why we built it</a><a href="#how">How it works</a></nav>
        <button class="lx-signin" data-act="role" data-role="signin">Staff sign in</button>
      </div>
    </header>

    <section class="lx-hero">
      <div class="lx-wrap lx-hero-grid">
        <div class="lx-hero-copy">
          <h1 class="lx-h1">Tell the kitchen what you actually ate.</h1>
          <p class="lx-lede">Scan the code on the tray line and tap a thumb under each dish. The people who cook your food find out what worked and what went in the trash. No app, no account, no name attached.</p>
          <div class="lx-cta">
            <button class="lx-btn solid" data-act="role" data-role="student">I'm a student${icon("arrowR")}</button>
            <button class="lx-btn line" data-act="role" data-role="create">I run a cafeteria</button>
          </div>
        </div>
        <div class="lx-hero-card" aria-hidden="true">
          <div class="lx-card">
            <div class="lx-card-photo">${photo("teriyaki-chicken-bowl")}<span class="lx-chip">Today's lunch</span></div>
            <div class="lx-card-body">
              <p class="lx-card-name">Teriyaki Chicken &amp; Rice Bowl</p>
              <p class="lx-card-q">How was it?</p>
              <div class="lx-rate"><span class="on good">${icon("thumbUp")}Good</span><span>${icon("thumbMid")}Mid</span><span>${icon("thumbDown")}Bad</span></div>
            </div>
          </div>
          <div class="lx-note">${icon("check")}<span>Sent to the kitchen. Thanks!</span></div>
        </div>
      </div>
    </section>

    <section class="lx-strips" aria-label="Dishes from a real school menu">
      <div class="lx-strip a">${strip(ROW_ONE)}</div>
      <div class="lx-strip b">${strip(ROW_TWO)}</div>
    </section>

    <section class="lx-problem" id="problem" aria-labelledby="lx-prob-t">
      <div class="lx-wrap lx-prob-grid">
        <p class="lx-big" data-count="39" aria-hidden="true"><span class="num">39</span><span class="unit">lb</span></p>
        <div class="lx-reveal">
          <h2 class="lx-h2" id="lx-prob-t"><span class="sr-only">39 pounds. </span>Food each student throws away in a school year.</h2>
          <p class="lx-p">The <a href="https://www.worldwildlife.org/publications/food-waste-warrior-report-2019/" target="_blank" rel="noopener">World Wildlife Fund weighed the trash</a> at 46 schools in 2019 and found about 39 pounds per student. Cafeteria staff see those full cans every afternoon. They just can't see which dish was in them, or why.</p>
        </div>
      </div>
    </section>

    <section class="lx-how" id="how" aria-labelledby="lx-how-t">
      <div class="lx-wrap">
        <h2 class="lx-h2 lx-reveal lx-how-head" id="lx-how-t">Ten seconds, and nobody knows it was you.</h2>
        <ol class="lx-steps">${STEPS.map((s, i) => `
          <li class="lx-step ${i % 2 ? "flip" : ""} lx-reveal">
            <div class="lx-step-photo">${photo(s.photo)}</div>
            <div class="lx-step-text"><h3>${esc(s.t)}</h3><p>${esc(s.p)}</p></div>
          </li>`).join("")}
        </ol>
      </div>
    </section>

    <section class="lx-both" aria-labelledby="lx-both-t">
      <div class="lx-wrap">
        <h2 class="lx-h2 lx-reveal" id="lx-both-t">One app, two jobs.</h2>
        <div class="lx-two">
          <article class="lx-reveal">
            <img class="lx-shot" src="/img/app-student.jpg" alt="The student menu on a phone, showing dishes with photos and Good, Mid and Bad buttons" width="780" height="1688" loading="lazy" decoding="async">
            <p class="lx-cap">Example: the student menu on a phone.</p><h3>For students</h3>
            <p>See the menu before you get in line, and suggest dishes you'd like. When classmates agree, your idea climbs the list the kitchen reads.</p>
          </article>
          <article class="lx-reveal">
            <img class="lx-shot wide" src="/img/app-staff.jpg" alt="The staff dashboard showing the share of Good ratings, the top dishes and the ones to fix" width="1280" height="860" loading="lazy" decoding="async">
            <p class="lx-cap">Example: the kitchen dashboard, filled with test ratings from a trial run.</p><h3>For the kitchen</h3>
            <p>Post the week's menu once and watch ratings come in. See what people loved next to what needs fixing, and log the trash to check the two line up.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="lx-final" aria-labelledby="lx-final-t">
      <div class="lx-final-bg" aria-hidden="true">${photo("pepperoni-pizza")}</div>
      <div class="lx-wrap lx-final-in lx-reveal">
        <h2 class="lx-h2" id="lx-final-t">Ready to hear what your school thinks?</h2>
        <p class="lx-p">It's free, it works on any phone, and setting up a school takes a couple of minutes.</p>
        <div class="lx-cta">
          <button class="lx-btn light" data-act="role" data-role="student">Join my school${icon("arrowR")}</button>
          <button class="lx-btn ghost" data-act="role" data-role="create">Set up my cafeteria</button>
        </div>
      </div>
    </section>

    <footer class="lx-foot"><div class="lx-wrap lx-foot-in">
      <span>We hope LunchLine can help your school!</span>
      <div class="lx-theme" role="group" aria-label="Page colors">${THEMES.map(([id, label]) => `<button type="button" data-lx-theme="${id}" aria-pressed="${id === theme}">${label}</button>`).join("")}</div>
    </div></footer>
  </div>`;
}

// Scroll-linked touches. Skipped for reduced motion, where everything simply shows.
export const toggleDemoPause = () => false;
export function startWelcomeMotion() {
  const root = $(".lx");
  if (!root) return;
  $$("[data-lx-theme]", root).forEach(b => b.addEventListener("click", () => {
    root.dataset.theme = b.dataset.lxTheme;
    try { localStorage.setItem(THEME_KEY, b.dataset.lxTheme); } catch {}
    $$("[data-lx-theme]", root).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  }));
  const nav = $("#lx-nav");
  const onScroll = () => nav && nav.classList.toggle("stuck", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  if (reducedMotion() || !("IntersectionObserver" in window)) return;
  root.classList.add("js-motion");
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in");
    if (en.target.querySelector("[data-count]") || en.target.matches("[data-count]")) countUp(en.target.matches("[data-count]") ? en.target : en.target.querySelector("[data-count]"));
    io.unobserve(en.target);
  }), { threshold: 0.15 });
  $$(".lx-reveal, [data-count]", root).forEach(el => io.observe(el));
}

function countUp(el) {
  const num = $(".num", el), to = +el.dataset.count;
  if (!num || el.dataset.done) return;
  el.dataset.done = "1";
  const t0 = performance.now(), dur = 1100;
  const tick = t => {
    const k = Math.min(1, (t - t0) / dur);
    num.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
    if (k < 1 && num.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
