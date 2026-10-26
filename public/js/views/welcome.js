// The landing page. Real food photography, a serif headline, and plain talk.
// Styles: landing.css. Motion: startWelcomeMotion (scroll reveals, nav, count-up), all off for reduced motion.
import { esc, $, $$, reducedMotion } from "../util.js";
import { icon, mark } from "../icons.js";

const photo = (name, alt = "") => `<img src="/samples/${name}.jpg" alt="${esc(alt)}" width="800" height="600" loading="lazy" decoding="async">`;

const ROW_ONE = ["teriyaki-chicken-bowl", "cheese-pizza", "breakfast-burrito", "buffalo-chicken", "blueberry-muffin", "beef-tacos", "orange-chicken-rice", "yogurt-parfait"];
const ROW_TWO = ["pancakes", "beef-vindaloo", "pepperoni-pizza", "caesar-salad", "ravioli-bowl", "banana-bread", "chicken-tenders", "aloo-matar"];
const strip = names => `<div class="lx-track" aria-hidden="true">${[...names, ...names].map(n => `<figure>${photo(n)}</figure>`).join("")}</div>`;

const STEPS = [
  { n: "01", photo: "cheese-pizza", t: "Scan the code on the tray line.", p: "There's a poster at the cafeteria with a QR code on it. Point your camera at it and today's menu opens right there, with photos, calories, and what's in each dish. You don't download anything or make an account." },
  { n: "02", photo: "teriyaki-chicken-bowl", t: "Tap how it actually was.", p: "Every dish has three buttons: good, mid, or bad. That's the whole job. If something was cold, or amazing, you can leave a quick note, and nobody will ever see your name next to it." },
  { n: "03", photo: "orange-chicken-rice", t: "The kitchen reads it, and answers.", p: "The cooks see which dishes people finish and which ones end up in the trash, along with what you wrote. They can reply right under the dish, so you can tell when someone listened." },
];

export function welcomeHTML() {
  return `<div class="lx">
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
          <p class="lx-kicker">A lunch rating app made by students</p>
          <h1 class="lx-h1">Tell the kitchen what you <em>actually</em> thought of lunch.</h1>
          <p class="lx-lede">Scan the code on the tray line, tap a thumb under each dish, and the people who cook your food finally find out what worked and what went straight in the trash. No app, no account, and no name attached.</p>
          <div class="lx-cta">
            <button class="lx-btn solid" data-act="role" data-role="student">I'm a student${icon("arrowR")}</button>
            <button class="lx-btn line" data-act="role" data-role="create">I run a cafeteria</button>
          </div>
          <p class="lx-fine">Students join with the six-letter code their school shares, or just scan the poster.</p>
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
          <h2 class="lx-h2" id="lx-prob-t"><span class="sr-only">39 pounds. </span>That's how much food the average student threw away in one school year.</h2>
          <p class="lx-p">A 2019 audit by the World Wildlife Fund weighed the trash at 46 schools across the country and found about 39 pounds of wasted food per student. Cafeteria staff see those full trash cans every afternoon. What they can't see is which dish was in them, or why it got left behind.</p>
          <p class="lx-p">Meanwhile, plenty of us have opinions about lunch. They just never leave the lunch table. LunchLine is a quick way to get them to the people who can actually change the menu.</p>
          <p class="lx-src">Source: <a href="https://www.worldwildlife.org/publications/food-waste-warrior-report-2019/" target="_blank" rel="noopener">WWF, Food Waste Warriors report (2019)</a></p>
        </div>
      </div>
    </section>

    <section class="lx-how" id="how" aria-labelledby="lx-how-t">
      <div class="lx-wrap">
        <div class="lx-reveal lx-how-head">
          <p class="lx-kicker">How it works</p>
          <h2 class="lx-h2" id="lx-how-t">It takes about ten seconds, and it's anonymous.</h2>
        </div>
        <ol class="lx-steps">${STEPS.map((s, i) => `
          <li class="lx-step ${i % 2 ? "flip" : ""} lx-reveal">
            <div class="lx-step-photo">${photo(s.photo)}</div>
            <div class="lx-step-text"><span class="lx-n">${s.n}</span><h3>${esc(s.t)}</h3><p>${esc(s.p)}</p></div>
          </li>`).join("")}
        </ol>
      </div>
    </section>

    <section class="lx-both" aria-labelledby="lx-both-t">
      <div class="lx-wrap">
        <h2 class="lx-h2 lx-reveal" id="lx-both-t">One app, two very different jobs.</h2>
        <div class="lx-two">
          <article class="lx-reveal">
            <img class="lx-shot" src="/img/app-student.jpg" alt="The student menu on a phone, showing dishes with photos and Good, Mid and Bad buttons" width="780" height="1688" loading="lazy" decoding="async">
            <p class="lx-cap">Example: the student menu on a phone.</p><h3>For students</h3>
            <p>See what's for breakfast, snack, and lunch before you get in line. Flag your allergies once and any dish that has them, or might, gets a clear red warning. Suggest something you'd love to eat, and when your classmates agree, it climbs the list the kitchen sees.</p>
          </article>
          <article class="lx-reveal">
            <img class="lx-shot wide" src="/img/app-staff.jpg" alt="The staff dashboard showing the share of Good ratings, the top dishes and the ones to fix" width="1280" height="860" loading="lazy" decoding="async">
            <p class="lx-cap">Example: the kitchen dashboard, filled with test ratings from a trial run.</p><h3>For the kitchen</h3>
            <p>Post the week's menu once, and watch the ratings come in. The dashboard shows what people loved next to what needs fixing, with the comments that explain why. Log the trash each day and you can finally see whether the two line up.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="lx-final" aria-labelledby="lx-final-t">
      <div class="lx-final-bg" aria-hidden="true">${photo("pepperoni-pizza")}</div>
      <div class="lx-wrap lx-final-in lx-reveal">
        <h2 class="lx-h2" id="lx-final-t">Ready to hear what your school really thinks?</h2>
        <p class="lx-p">It's free, it works on any phone, and setting up a school takes a couple of minutes.</p>
        <div class="lx-cta">
          <button class="lx-btn light" data-act="role" data-role="student">Join my school${icon("arrowR")}</button>
          <button class="lx-btn ghost" data-act="role" data-role="create">Set up my cafeteria</button>
        </div>
      </div>
    </section>

    <footer class="lx-foot"><div class="lx-wrap"><span>LunchLine is a student project, built for Neighborhood Hacks 2026.</span></div></footer>
  </div>`;
}

// Scroll-linked touches. Skipped for reduced motion, where everything simply shows.
export const toggleDemoPause = () => false;
export function startWelcomeMotion() {
  const root = $(".lx");
  if (!root) return;
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
