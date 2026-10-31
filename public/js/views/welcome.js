// landing page
import { esc, $, $$, reducedMotion } from "../util.js";
import { icon, mark } from "../icons.js";
import { tourHTML, bindTour } from "./tour.js";

const photo = (name, alt = "") => `<img src="/samples/${name}.jpg" alt="${esc(alt)}" width="800" height="600" loading="lazy" decoding="async">`;

const ROW_ONE = ["teriyaki-chicken-bowl", "cheese-pizza", "breakfast-burrito", "buffalo-chicken", "blueberry-muffin", "beef-tacos", "orange-chicken-rice", "yogurt-parfait"];
const ROW_TWO = ["pancakes", "beef-vindaloo", "pepperoni-pizza", "caesar-salad", "ravioli-bowl", "banana-bread", "chicken-tenders", "aloo-matar"];
// a row of food photos
const strip = names => `<div class="lx-track">${[...names, ...names].map((n, i) => `<figure${i >= names.length ? ' aria-hidden="true"' : ""}>${photo(n)}</figure>`).join("")}</div>`;

const STEPS = [
  { photo: "cheese-pizza", t: "Scan the QR on the poster near the line.", p: "Today's menu opens right on your phone. No app to download and no account to make." },
  { photo: "teriyaki-chicken-bowl", t: "Vote Good, Mid or Bad under each dish.", p: "Any allergens you've flagged show up in red, so you know before you eat." },
  { photo: "orange-chicken-rice", t: "The kitchen answers on the dish.", p: "The cooks read your comments, fix what's wrong, and reply right under the dish." },
];

// the page html
export function welcomeHTML() {
  return `<div class="lx">
    <header class="lx-nav" id="lx-nav">
      <div class="lx-wrap lx-nav-in">
        <a class="lx-brand" href="/" aria-label="LunchLine home">${mark(30, "#FF5A1F")}<span>LunchLine</span></a>
        <nav class="lx-links" aria-label="Page"><a href="#problem">Why we built it</a><a href="#how">How it works</a></nav>
        <button class="lx-signin" data-act="role" data-role="signin">Staff sign in</button>
      </div>
      <span class="lx-progress" aria-hidden="true"></span>
    </header>

    <section class="lx-hero">
      <div class="lx-wrap lx-hero-grid">
        <div class="lx-hero-copy">
          <h1 class="lx-h1 lx-split">Tell the kitchen what you actually ate.</h1>
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

    <section class="lx-strips" aria-label="Dishes from a real school menu. Drag or swipe to look around.">
      <div class="lx-strip a" data-strip tabindex="0">${strip(ROW_ONE)}</div>
      <div class="lx-strip b" data-strip data-dir="-1" tabindex="0">${strip(ROW_TWO)}</div>
    </section>

    <section class="lx-problem" id="problem" aria-labelledby="lx-prob-t">
      <div class="lx-wrap lx-prob-grid">
        <p class="lx-big" data-count="39" aria-hidden="true"><span class="num">39</span><span class="unit">lb</span></p>
        <div class="lx-reveal">
          <h2 class="lx-h2 lx-split" id="lx-prob-t"><span class="sr-only">39 pounds. </span>Food each student throws away in a school year.</h2>
          <p class="lx-p">The <a href="https://www.worldwildlife.org/publications/food-waste-warrior-report-2019/" target="_blank" rel="noopener">World Wildlife Fund weighed the trash</a> at 46 schools in 2019 and found about 39 pounds per student. Cafeteria staff see those full cans every afternoon. They just can't see which dish was in them, or why.</p>
        </div>
      </div>
    </section>

    <section class="lx-how" id="how" aria-labelledby="lx-how-t">
      <div class="lx-wrap">
        <h2 class="lx-h2 lx-split lx-how-head" id="lx-how-t">Ten seconds to a better lunch.</h2>
        <ol class="lx-steps">${STEPS.map((s, i) => `
          <li class="lx-step ${i % 2 ? "flip" : ""}">
            <div class="lx-step-photo lx-mask" data-parallax>${photo(s.photo)}</div>
            <div class="lx-step-text lx-reveal" data-fx="${i % 2 ? "left" : "right"}"><h3>${esc(s.t)}</h3><p>${esc(s.p)}</p></div>
          </li>`).join("")}
        </ol>
      </div>
    </section>

    <section class="lx-both" aria-labelledby="lx-both-t">
      <div class="lx-wrap">
        <h2 class="lx-h2 lx-split" id="lx-both-t">One app, two jobs.</h2>
        <div class="lx-two">
          <article class="lx-reveal">
            <h3>For students</h3>
            <p>See the menu before you get in line, and suggest dishes you'd like. When classmates agree, your idea climbs the list the kitchen reads.</p>
            ${tourHTML()}
            <p class="lx-cap">This is the real thing in miniature. Rate a dish, flag an allergy, vote on an idea.</p>
          </article>
          <article class="lx-reveal" data-fx="zoom">
            <h3>For the kitchen</h3>
            <p>Post the week's menu once and watch ratings come in. See what people loved next to what needs fixing, and log the trash to check the two line up.</p>
            <div class="lx-shot-wrap" tabindex="0" role="group" aria-label="Dashboard screenshot, scrolls sideways on small screens"><img class="lx-shot wide" src="/img/app-staff.jpg" alt="The staff dashboard showing the share of Good ratings, the top dishes and the ones to fix" width="1280" height="860" loading="lazy" decoding="async"></div>
            <p class="lx-cap">Example: the kitchen dashboard, filled with simulated ratings from a month of lunches.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="lx-final" aria-labelledby="lx-final-t">
      <div class="lx-final-bg" aria-hidden="true" data-parallax="-1">${photo("pepperoni-pizza")}</div>
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
      <a class="lx-tour" href="/walkthrough.html">Watch the 90 second tour</a>
    </div></footer>
  </div>`;
}

// scroll effects, off for reduced motion
// unused now
export const toggleDemoPause = () => false;
export function startWelcomeMotion() {
  const root = $(".lx");
  if (!root) return;
  bindTour(root);

  // nav shadow and progress line
  const nav = $("#lx-nav"), bar = $(".lx-progress", root);
  const onScroll = () => {
    nav && nav.classList.toggle("stuck", window.scrollY > 12);
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar && max > 0) bar.style.transform = `scaleX(${Math.min(1, scrollY / max)})`;
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const still = reducedMotion();
  startStrips(root, still);
  if (still || !("IntersectionObserver" in window)) return;

  // headings show up word by word
  $$(".lx-split", root).forEach(h => {
    const label = h.textContent.trim();
    let i = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement("span"); w.className = "w"; w.style.setProperty("--i", i++); w.setAttribute("aria-hidden", "true");
          const inner = document.createElement("span"); inner.textContent = part; w.append(inner); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains("sr-only")) walk(n);
    });
    walk(h);
    if (!h.querySelector(".sr-only")) h.setAttribute("aria-label", label);
  });

  root.classList.add("js-motion");
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const t = en.target;
    t.classList.add("in");
    if (t.matches("[data-count]")) countUp(t); else if (t.querySelector("[data-count]")) countUp(t.querySelector("[data-count]"));
    io.unobserve(t);
  }), { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  $$(".lx-reveal, .lx-split, .lx-step, [data-count]", root).forEach(el => io.observe(el));
  requestAnimationFrame(() => $$(".lx-hero .lx-split", root).forEach(el => el.classList.add("in")));

  // photos drift while scrolling
  const drift = $$("[data-parallax]", root);
  let tick = false;
  const move = () => {
    tick = false;
    for (const el of drift) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > innerHeight + 80) continue;
      const k = Number(el.dataset.parallax) || 1, mid = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      el.style.setProperty("--py", `${(-mid * 34 * k).toFixed(1)}px`);
    }
  };
  window.addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(move); } }, { passive: true });
  move();
}

// photo rows scroll on their own and can be dragged
function startStrips(root, still) {
  $$("[data-strip]", root).forEach(strip => {
    const dir = Number(strip.dataset.dir) || 1, speed = .35;
    const half = () => strip.scrollWidth / 2;
    let paused = false, resume;
    if (dir < 0) strip.scrollLeft = half();
    const hold = () => { paused = true; clearTimeout(resume); resume = setTimeout(() => { paused = false; }, 2200); };
    ["pointerdown", "touchstart", "wheel", "keydown", "focusin"].forEach(ev => strip.addEventListener(ev, hold, { passive: true }));
    strip.addEventListener("scroll", () => { const h = half(); if (!h) return; if (strip.scrollLeft >= h) strip.scrollLeft -= h; else if (strip.scrollLeft <= 0) strip.scrollLeft += h; }, { passive: true });
    // mouse dragging, touch already scrolls
    let down = false, x0 = 0, s0 = 0;
    strip.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; x0 = e.clientX; s0 = strip.scrollLeft; strip.classList.add("drag"); });
    window.addEventListener("pointermove", e => { if (down) strip.scrollLeft = s0 - (e.clientX - x0); });
    window.addEventListener("pointerup", () => { down = false; strip.classList.remove("drag"); });
    if (still) return;
    let acc = 0;
    const step = () => {
      if (!strip.isConnected) return;
      if (!paused && !down && document.visibilityState === "visible") { acc += speed * dir; const whole = Math.trunc(acc); if (whole) { strip.scrollLeft += whole; acc -= whole; } }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// count numbers up
function countUp(el) {
  const num = $(".num", el), to = +el.dataset.count;
  if (!num || el.dataset.done) return;
  el.dataset.done = "1";
  const t0 = performance.now(), dur = 1300;
  const tick = t => {
    const k = Math.min(1, (t - t0) / dur);
    num.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
    if (k < 1 && num.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
