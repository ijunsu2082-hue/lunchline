// The landing page. White page, black ink, one orange that belongs to the logo.
// Styles are in landing.css, scoped under .welcome. The dishes come from the sample menu (sample.js).
import { esc } from "../util.js";
import { icon, mark } from "../icons.js";

const RATINGS = { good: { label: "Good", icon: "thumbUp" }, mid: { label: "Mid", icon: "thumbMid" }, bad: { label: "Bad", icon: "thumbDown" } };
const fakeRate = pressed => `<div class="rate-btns">${Object.entries(RATINGS).map(([k, r]) =>
  `<span class="rate-btn r-${k}" aria-pressed="${k === pressed}">${icon(r.icon)}<span>${r.label}</span></span>`).join("")}</div>`;

// One real school's menu (sample.js): each day's first featured lunch.
const plan = () => window.SAMPLE_PLAN || [];
const featured = i => (plan()[i] && plan()[i].lunch[0]) || { name: "", photo: "" };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const WWF_URL = "https://www.worldwildlife.org/publications/food-waste-warrior-report-2019/";
const REPO_URL = "https://github.com/ijunsu2082-hue/lunchline";

export function welcomeHTML() {
  return `<div class="welcome-bg"><div class="welcome">
    <header class="w-nav">
      <div class="brand">${mark(30)}<span class="brand-name">LunchLine</span></div>
      <button class="link" data-act="role" data-role="signin">Staff sign in</button>
    </header>

    <section class="w-hero">
      <div class="w-hero-text">
        <h1 class="w-title">Tell the kitchen what you actually ate.</h1>
        <p class="w-lede">LunchLine puts Good, Mid, and Bad under every dish, so the cafeteria can make more of what students eat and less of what they throw away.</p>
        <div class="w-go">
          <button class="btn primary lg" data-act="role" data-role="student">I'm a student${icon("arrowR")}</button>
          <button class="btn secondary lg" data-act="role" data-role="create">Set up my school's cafeteria${icon("arrowR")}</button>
        </div>
        <p class="w-note">No app and no account. Students join with the 6-character code their school shares.</p>
      </div>
      <div class="w-demo">
        <div class="w-card" aria-hidden="true">
          <div class="w-card-photo"><img class="on" src="${esc(featured(1).photo)}" alt="" decoding="async"><span class="w-tag">Today's lunch</span></div>
          <div class="w-card-body">
            <p class="w-card-name">${esc(featured(1).name)}</p>
            <p class="w-card-q">How was it?</p>
            ${fakeRate("good")}
          </div>
        </div>
      </div>
    </section>

    <section class="w-week" aria-labelledby="w-week-t">
      <p class="w-week-t" id="w-week-t">A week of lunch on a real school menu</p>
      <ul class="w-strip">${DAYS.map((d, i) => `<li><img src="${esc(featured(i).photo)}" alt="" decoding="async"><p><span>${d}</span>${esc(featured(i).name)}</p></li>`).join("")}</ul>
    </section>

    <section class="w-problem" aria-labelledby="w-problem-t">
      <p class="w-stat" aria-hidden="true">39<span>lb</span></p>
      <div class="w-problem-text">
        <h2 class="w-h2" id="w-problem-t"><span class="sr-only">39 pounds. </span>That's how much food each student wasted in a school year, on average, at 46 U.S. schools.</h2>
        <p>Cafeteria staff see the full trash cans. They can't see which dish was in them, or why it got left. LunchLine gives them that missing half.</p>
        <p class="w-src">Source: <a class="link" href="${WWF_URL}" target="_blank" rel="noopener">WWF, Food Waste Warriors report (2019)</a></p>
      </div>
    </section>

    <section class="w-end" aria-labelledby="w-end-t">
      <h2 class="w-h2" id="w-end-t">Try it at your school.</h2>
      <ul class="w-start">
        <li><span class="w-start-who">Students</span><button class="btn primary" data-act="role" data-role="student">Join your school${icon("arrowR")}</button></li>
        <li><span class="w-start-who">Cafeteria staff</span><button class="btn secondary" data-act="role" data-role="create">Set up your school${icon("arrowR")}</button></li>
      </ul>
    </section>

    <footer class="w-foot">
      <p>LunchLine is a student project built for Neighborhood Hacks 2026.</p>
      <p><a class="link" href="${REPO_URL}" target="_blank" rel="noopener">Source code</a><a class="link" href="${REPO_URL}/blob/main/public/samples/CREDITS.md" target="_blank" rel="noopener">Photo credits</a></p>
    </footer>
  </div></div>`;
}

// The landing page is static now; these stay so main.js doesn't need to know.
export const toggleDemoPause = () => false;
export function startWelcomeMotion() {}
