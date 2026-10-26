// An animated tour of the whole project, played on a 1280 x 720 stage: a cursor moves, taps and types through
// the real flows (scan, rate, comment, dashboard, reply, ideas, presets, school colors). Space pauses, the arrow
// keys move between scenes, R restarts. Add ?loop=1 to replay forever (for a screen at a booth).
import { icon, mark } from "./js/icons.js";

const $ = (s, r = document) => r.querySelector(s);
const stage = $("#stage"), sceneEl = $("#scene"), cursor = $("#cursor"), capK = $("#capk"), capT = $("#capt"), prog = $("#prog"), dotsEl = $("#dots"), ppBtn = $("#pp");
const LOOP = new URLSearchParams(location.search).has("loop");
const CANCEL = Symbol("cancel");
let token = 0, paused = false, idx = 0, scale = 1, cx = 640, cy = 360;

// ---------- fit the stage to any screen ----------
function fit() {
  scale = Math.min(innerWidth / 1280, innerHeight / 720);
  stage.style.transform = `scale(${scale})`;
}
addEventListener("resize", fit); fit();

// ---------- timing and motion helpers ----------
const sleep = ms => new Promise((res, rej) => {
  const mine = token; let left = ms;
  const tick = () => {
    if (mine !== token) return rej(CANCEL);
    if (paused) return setTimeout(tick, 80);
    left -= 40;
    if (left <= 0) res(); else setTimeout(tick, 40);
  };
  tick();
});
const pos = el => { const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(); return { x: (r.left + r.width / 2 - s.left) / scale, y: (r.top + r.height / 2 - s.top) / scale }; };
async function moveTo(el, dx = 0, dy = 0, ms = 800) {
  const p = pos(el);
  cursor.hidden = false;
  cursor.style.transitionDuration = ms + "ms";
  cx = p.x + dx; cy = p.y + dy;
  cursor.style.transform = `translate(${cx - 6}px, ${cy - 4}px)`;
  await sleep(ms + 60);
}
function ripple() {
  const r = document.createElement("i"); r.className = "ripple"; r.style.left = cx + "px"; r.style.top = cy + "px";
  stage.append(r); setTimeout(() => r.remove(), 700);
}
async function tap(el, fn, dx = 0, dy = 0) { await moveTo(el, dx, dy); await sleep(120); ripple(); fn && fn(); await sleep(320); }
async function type(el, text, cps = 24) {
  el.classList.add("caret");
  for (let i = 1; i <= text.length; i++) { el.firstChild ? (el.firstChild.nodeValue = text.slice(0, i)) : el.append(text.slice(0, i)); await sleep(1000 / cps); }
  el.classList.remove("caret");
}
async function tween(ms, fn) { const n = Math.max(1, Math.round(ms / 40)); for (let i = 1; i <= n; i++) { fn(1 - Math.pow(1 - i / n, 3)); await sleep(40); } }
const say = (kicker, text) => { capK.textContent = kicker; capT.textContent = text; capT.parentElement.classList.remove("fade"); void capT.offsetWidth; capT.parentElement.classList.add("fade"); };
const show = html => { sceneEl.innerHTML = html; cursor.hidden = true; };
const toast = (host, msg) => { host.querySelector(".toast")?.remove(); const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; host.append(t); setTimeout(() => t.remove(), 2200); };

// ---------- pieces of UI ----------
const photo = n => `/samples/${n}.jpg`;
const qr = (() => { // a believable-looking QR code: three finder squares and a scatter of modules
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const N = 21, cells = [];
  const finder = (x, y) => x < 8 && y < 8 || x > N - 9 && y < 8 || x < 8 && y > N - 9;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!finder(x, y) && rnd() > .52) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
  const fnd = (x, y) => `<path fill-rule="evenodd" d="M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5z"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  return `<svg class="qr" viewBox="-1 -1 ${N + 2} ${N + 2}" shape-rendering="crispEdges" fill="#131211">${cells.join("")}${fnd(0, 0)}${fnd(N - 7, 0)}${fnd(0, N - 7)}</svg>`;
})();

const DISHES = [
  { id: "t", name: "Teriyaki Chicken Bowl", img: "teriyaki-chicken-bowl", cal: 540, meat: true },
  { id: "p", name: "Cheese Pizza", img: "cheese-pizza", cal: 290 },
  { id: "c", name: "Caesar Salad", img: "caesar-salad", cal: 280 },
  { id: "k", name: "Beef Street Tacos", img: "beef-tacos", cal: 480, meat: true },
];
const phoneMenu = (st = {}) => `<div class="topbar"><span class="logo">${mark(24, "#FF5A1F")}</span><span class="t on">Lunch</span><span class="t">Ideas</span><span class="me" data-t="me">${icon("user")}</span></div>
  <div class="body"><p class="school">Irvine High School</p><p class="h">The menu for Friday</p>
  <div class="grid">${DISHES.map(d => `<div class="dish${st.veg && d.meat ? " warn" : ""}" data-d="${d.id}"><div class="ph"><img src="${photo(d.img)}" alt="">${st.veg && d.meat ? `<span class="flag">${icon("alert").replace("<svg", '<svg width="10" height="10"')}Has meat</span>` : ""}</div>
    <b>${d.name}</b><span class="c">${d.cal} cal</span>
    <div class="rate"><button class="g${st.rated?.[d.id] === "g" ? " on" : ""}" data-r="${d.id}g">${icon("thumbUp")}</button><button class="m" data-r="${d.id}m">${icon("thumbMid")}</button><button class="b${st.rated?.[d.id] === "b" ? " on" : ""}" data-r="${d.id}b">${icon("thumbDown")}</button></div></div>`).join("")}</div></div>`;
const phoneMe = on => `<div class="topbar"><span class="logo">${mark(24, "#FF5A1F")}</span><span class="t">Lunch</span><span class="t">Ideas</span><span class="me" style="box-shadow:0 0 0 2px #131211">${icon("user")}</span></div>
  <div class="body"><p class="school">Irvine High School</p><p class="h">Your profile</p>
  <p style="color:#5A564F;font-size:13px;margin:0 0 12px">Tell it once. Dishes that don't fit get flagged.</p>
  <div class="chips"><span class="chip${on ? " on" : ""}" data-chip="veg">Vegetarian</span><span class="chip">Egg allergy</span><span class="chip">Dairy allergy</span></div></div>`;
const phone = (inner, left, top = 14) => `<div class="phone fade" style="left:${left}px;top:${top}px;height:600px"><div class="notch"></div><div class="screen" id="screen">${inner}</div></div>`;
const side = on => `<div class="side"><div class="sn">${mark(24, "var(--brand)")}<span>Irvine High</span></div>${[["chart", "Insights"], ["calendar", "Menu"], ["lightbulb", "Ideas"], ["mail", "Reports"], ["school", "School"]].map(([ic, l]) => `<div class="si${l === on ? " on" : ""}" data-s="${l}">${icon(ic)}${l}</div>`).join("")}</div>`;
const browser = (on, main, id = "main") => `<div class="browser fade"><div class="bar2"><i></i><i></i><i></i><em>lunchline.netlify.app</em></div><div class="app">${side(on)}<div class="main" id="${id}">${main}</div></div></div>`;

// ---------- the scenes ----------
const SCENES = [
  { name: "Hello", async run() {
    show(`<div class="center fade"><div><div class="logo" style="font-size:44px">${mark(84, "#FF5A1F")}</div><h1 class="big">LunchLine</h1><p class="lede">Tell the kitchen what you actually ate.</p></div></div>`);
    say("The idea", "Students rate every dish. The kitchen finally hears it.");
    await sleep(4200);
  } },

  { name: "Problem", async run() {
    show(`<div class="center fade"><div><div class="num" id="n">0<small>lb</small></div><p class="lede">of food thrown away by each student, every school year. Cafeterias see full trash cans, not which dish was in them.</p></div></div>`);
    say("The problem", "The kitchen can't fix what it can't see.");
    const n = $("#n"); await tween(1800, k => { n.firstChild.nodeValue = Math.round(39 * k); });
    await sleep(3600);
  } },

  { name: "Students", async run() {
    show(`<div class="poster fade" style="left:150px;top:70px" id="poster"><div class="logo" style="font-size:20px">${mark(34, "#FF5A1F")}LunchLine</div><h4>Rate today's lunch</h4>${qr}<p><b>Scan</b> with your phone camera</p><p>No account. No name.</p></div>${phone(`<div style="background:#131211;height:100%;display:grid;place-items:center;color:#fff;text-align:center;padding:30px;font-size:14px"><div><div style="width:150px;height:150px;border:3px solid #fff;border-radius:18px;margin:0 auto 18px;position:relative">${"<span></span>".repeat(0)}</div>Point your camera at the poster</div></div>`, 700)}`);
    const screen = $("#screen");
    say("Students", "Scan the QR on the poster near the line.");
    await sleep(700);
    const scan = document.createElement("div"); scan.className = "scanline"; $("#poster").append(scan);
    await moveTo($("#poster"), 0, -10, 900); await sleep(1500); scan.remove(); ripple();
    screen.innerHTML = phoneMenu(); toast(screen, "You're in! Welcome to Irvine High School."); await sleep(1500);

    say("Students", "Say you're vegetarian once. Dishes with meat, seafood or egg get a red flag.");
    const st = { veg: false, rated: {} };
    await tap($(".me", screen), () => { screen.innerHTML = phoneMe(false); });
    await tap($('[data-chip="veg"]', screen), () => { screen.innerHTML = phoneMe(true); st.veg = true; });
    await sleep(500);
    await tap($(".topbar .t", screen), () => { screen.innerHTML = phoneMenu(st); }); await sleep(1200);

    say("Students", "Tap Good, Mid or Bad under each dish.");
    await tap($('[data-r="pg"]', screen), () => { st.rated.p = "g"; screen.innerHTML = phoneMenu(st); toast(screen, "Sent to the kitchen. Thanks!"); });
    await sleep(500);
    await tap($('[data-r="tb"]', screen), () => { st.rated.t = "b"; screen.innerHTML = phoneMenu(st); toast(screen, "Sent to the kitchen. Thanks!"); });
    await sleep(1000);

    say("Students", "Add a note if something was off. Nobody sees your name.");
    await tap($('[data-d="t"] .ph', screen), () => {
      screen.innerHTML = `<div style="height:100%"><div style="height:210px;background:url(${photo("teriyaki-chicken-bowl")}) center/cover"></div><div class="body"><p class="h" style="margin-top:6px">Teriyaki Chicken Bowl</p>
        <p style="color:#5A564F;font-size:12.5px;margin:0 0 12px">You picked Bad. Want to tell the kitchen more?</p><div class="field" id="note"></div><span class="btnb" id="send">Send</span></div></div>`;
    });
    await type($("#note", screen), "It was cold and kind of dry", 22); await sleep(400);
    await tap($("#send", screen), () => { toast(screen, "Sent. The kitchen will see it."); });
    await sleep(1800);
  } },

  { name: "Dashboard", async run() {
    show(browser("Insights", `<h3>Here's what students are saying</h3>
      <div class="tiles"><div class="tile dark"><div class="ring" id="ring" style="--p:0"><b id="pct">0%</b></div><div><div style="font-size:12px;opacity:.7;font-weight:700">OVERALL</div><div style="font-size:23px;font-weight:800;letter-spacing:-.02em"><span id="pct2">0</span>% of ratings were Good</div><div style="font-size:12px;opacity:.7;margin-top:4px">7,233 ratings over 20 days</div></div></div>
      <div class="tile"><div class="k">Students rating</div><div class="v" id="stu">0</div><div class="k">21% of 1,850 students</div></div></div>
      <div class="tiles" style="margin-top:12px;grid-template-columns:1fr 1fr">
        <div class="tile"><div class="k">Ratings by week</div><div class="cols" id="wk">${[[1604, 52, 26], [1651, 54, 24], [2037, 57, 22], [1941, 55, 24]].map(([n, g, m], i) => `<div class="c stk" style="--g:${g}%;--m:${m}%"><span>${n}</span><i data-h="${60 + i * 12}"></i><span style="color:#5A564F;font-weight:600">${["9/28", "10/5", "10/12", "10/19"][i]}</span></div>`).join("")}</div></div>
        <div class="tile"><div class="k">Food thrown away <b style="color:#131211">&nbsp;809 lb</b></div><div class="cols" id="ws">${[43, 45, 39, 44, 40, 44, 47, 42].map(v => `<div class="c"><span>${v}</span><i data-h="${v * 1.9}"></i></div>`).join("")}<div class="avg" id="avg" style="bottom:${Math.round(40.5 * 1.9)}px"><span>Average 40.5 lb</span></div></div></div></div>`));
    say("The kitchen", "A live picture of what's loved and what's left behind.");
    await sleep(600);
    const ring = $("#ring"), pct = $("#pct"), pct2 = $("#pct2"), stu = $("#stu");
    await tween(1500, k => { ring.style.setProperty("--p", 55 * k); pct.textContent = Math.round(55 * k) + "%"; pct2.textContent = Math.round(55 * k); stu.textContent = Math.round(380 * k); });
    sceneEl.querySelectorAll(".cols .c i").forEach(i => { i.style.height = i.dataset.h + "px"; });
    await sleep(1600);
    say("The kitchen", "Pounds on every bar, with an average line, by day, week or month.");
    $("#avg").style.opacity = 1; await sleep(4200);
  } },

  { name: "Replies", async run() {
    show(browser("Insights", `<h3>What students said</h3>
      <div id="feed"><div class="cmt new" id="cm"><span class="pill" style="background:#FBE7E5;color:#AE261F">Bad</span><div class="q"><b>“It was cold and kind of dry”</b><span>Teriyaki Chicken Bowl · Lunch · Fri</span></div><span class="mini" id="rep">Reply</span><span class="mini">Hide</span></div>
      <div class="cmt"><span class="pill" style="background:#DDF0E3;color:#1B6A3C">Good</span><div class="q"><b>“Honestly the best thing on the line today.”</b><span>Cheese Pizza · Lunch · Fri</span></div><span class="mini">Reply</span><span class="mini">Hide</span></div>
      <div class="cmt"><span class="pill" style="background:#FBE7E5;color:#AE261F">Bad</span><div class="q"><b>“Way too salty today.”</b><span>Beef Street Tacos · Lunch · Thu</span></div><span class="mini">Reply</span><span class="mini">Hide</span></div></div>`));
    say("Replies", "A comment comes in. The kitchen answers it.");
    await sleep(1400);
    await tap($("#rep"), () => {
      const m = document.createElement("div"); m.id = "ov"; m.innerHTML = `<div class="scrim"></div><div class="sheet"><h4>Reply on “Teriyaki Chicken Bowl”</h4><div class="quote">Replying to<br><b>“It was cold and kind of dry”</b></div>
        <div class="radio on" id="r1"><u></u><span><b>Everyone</b><br>Shown on the dish, with the comment it answers. No name.</span></div><div class="radio" id="r2"><u></u><span><b>Only the student who wrote it</b><br>They see it next to their own comment.</span></div>
        <div class="field" id="rt" style="margin-top:10px"></div><span class="btnb" id="post">Post reply</span></div>`;
      $("#main").append(m);
    });
    say("Replies", "Choose who sees it: everyone, or only the student who wrote it.");
    await sleep(500);
    await tap($("#r2"), () => { $("#r1").classList.remove("on"); $("#r2").classList.add("on"); });
    await type($("#rt"), "The oven was down. Fixed for Thursday.", 26); await sleep(300);
    await tap($("#post"), () => { $("#ov").remove(); });
    const f = document.createElement("div"); f.className = "fade"; f.style.cssText = "font-size:12.5px;color:#5A564F;margin:-2px 0 0 54px"; f.innerHTML = "<b style='color:#131211'>You replied privately:</b> The oven was down. Fixed for Thursday.";
    $("#cm").append(f); $("#cm").style.flexWrap = "wrap"; f.style.flexBasis = "100%";
    await sleep(900);
    // the student's phone
    sceneEl.insertAdjacentHTML("beforeend", phone(`<div class="topbar"><span class="logo">${mark(24, "#FF5A1F")}</span><span class="t on">Lunch</span><span class="t">Ideas</span></div><div class="body"><p class="school">Irvine High School</p><p class="h">The menu for Friday</p>
      <div style="background:#FF5A1F;color:#fff;border-radius:16px;padding:14px"><div style="font-size:22px;font-weight:800;line-height:1.1">The kitchen replied to you</div><div style="font-size:12px;margin-top:8px;opacity:.95">You wrote “It was cold and kind of dry”<br><b>“The oven was down. Fixed for Thursday.”</b></div><span style="display:inline-block;margin-top:8px;background:#131211;border-radius:999px;font-size:11px;font-weight:800;padding:3px 10px">Only you can see this</span></div></div>`, 870, 40));
    $(".phone:last-child").style.transform = "scale(.86)"; $(".phone:last-child").style.transformOrigin = "top left";
    say("Replies", "The student sees it next to their own comment. Nobody is talking to a void.");
    await sleep(4800);
  } },

  { name: "Ideas", async run() {
    const ideas = [["Orange chicken with fried rice", 142], ["Birria tacos", 118], ["More vegetarian bowls", 97], ["Chicken caesar wrap", 64], ["Hot breakfast sandwiches", 41]];
    show(browser("Ideas", `<h3>What students are asking for</h3><ol class="ideas" id="il">${ideas.map(([t, n], i) => `<li id="i${i}"><span class="n">${i + 1}</span><span class="t">${t}<span id="s${i}"></span></span><span class="vote" id="v${i}"><i style="display:block">${icon("arrowUp")}</i><b>${n - 24}</b></span></li>`).join("")}</ol>`));
    say("Ideas", "Students vote on what they want to eat.");
    await sleep(800);
    await tween(2600, k => ideas.forEach(([, n], i) => { $(`#v${i} b`).textContent = Math.round(n - 24 * (1 - k)); }));
    await sleep(600);
    say("Ideas", "The kitchen sets a status and answers, right on the idea.");
    const t = $("#s0"); await moveTo($("#i0 .t"), 220, 0); await sleep(300); ripple();
    t.innerHTML = `<span class="st p">Planned</span><div style="font-size:12.5px;font-weight:500;color:#5A564F;margin-top:3px" id="kr"><b style="color:#131211">Kitchen:</b> <span id="krt"></span></div>`;
    await type($("#krt"), "Testing a recipe now. Look for it in November.", 28);
    await sleep(3200);
  } },

  { name: "Presets", async run() {
    const chips = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    show(browser("Menu", `<h3>What's being served</h3><div class="week" id="wk2">${chips.map((d, i) => `<div class="wd" id="w${i}"><span class="t">${d} ${19 + i}</span><span id="wi${i}">${i === 4 ? `<img src="${photo("cheese-pizza")}" alt=""><img src="${photo("caesar-salad")}" alt=""><img src="${photo("teriyaki-chicken-bowl")}" alt="">` : ""}</span></div>`).join("")}</div>
      <div style="display:flex;gap:10px;margin-top:6px"><span class="mini" style="background:#131211;color:#fff;border-color:#131211">+ Add to Lunch</span><span class="mini">Copy to next day</span><span class="mini" id="pb">Presets</span></div>`));
    say("Menu presets", "Built a good Friday? Save it as a preset.");
    await sleep(1200);
    await tap($("#pb"), () => {
      const m = document.createElement("div"); m.id = "ov"; m.innerHTML = `<div class="scrim"></div><div class="sheet"><h4>Save this day as a preset</h4><div class="field" id="pn"></div><span class="btnb" id="sv">Save preset</span></div>`; $("#main").append(m);
    });
    await type($("#pn"), "Pizza Friday", 14); await sleep(300);
    await tap($("#sv"), () => { $("#ov h4").textContent = "Saved. Load it onto any days"; $("#ov .field").style.display = "none"; $("#sv").textContent = "Load onto Mon to Thu"; });
    say("Menu presets", "Load a day, a week or a single dish onto any days you like, for as many weeks as you want.");
    await sleep(900);
    await tap($("#sv"), () => { $("#ov").remove(); });
    for (let i = 0; i < 4; i++) { $(`#wi${i}`).innerHTML = `<img src="${photo("cheese-pizza")}" alt=""><img src="${photo("caesar-salad")}" alt=""><img src="${photo("teriyaki-chicken-bowl")}" alt="">`; await sleep(380); }
    await sleep(2800);
  } },

  { name: "Colors", async run() {
    const logo = c => `<span class="mlogo" id="ml" style="background:${c}">${mark(40, "transparent")}</span>`;
    show(`<div class="mail fade"><div class="card"><div>${logo("#FF5A1F")} <b style="font-size:20px;vertical-align:middle;margin-left:8px">LunchLine</b></div><h4>Your LunchLine sign-in link</h4><p>Tap the button to sign in to your staff dashboard. There's no password to remember.</p><span class="go" id="go" style="background:#FF5A1F">Sign in</span><p style="font-size:12px;color:#7A6F66;margin:16px 0 0">This link works once and expires in 15 minutes.</p></div>
      <div class="swatches" id="sw">${["#FF5A1F", "#1F7A4D", "#1D4ED8", "#7C3AED"].map((c, i) => `<i style="background:${c}" data-c="${c}" class="${i ? "" : "on"}"></i>`).join("")}</div></div>`);
    say("Staff", "Staff sign in with an emailed link. No passwords to lose.");
    await sleep(2600);
    say("School colors", "Every school picks its own color. The app and its emails follow.");
    for (const c of ["#1F7A4D", "#1D4ED8", "#7C3AED"]) {
      const sw = $(`#sw [data-c="${c}"]`);
      await tap(sw, () => { sceneEl.querySelectorAll("#sw i").forEach(i => i.classList.toggle("on", i === sw)); $("#ml").style.background = c; $("#go").style.background = c; });
      await sleep(800);
    }
    await sleep(1200);
  } },

  { name: "Close", async run() {
    show(`<div class="center fade"><div><div class="logo" style="font-size:44px">${mark(84, "#FF5A1F")}</div><h1 class="big">Scan. Tap. The kitchen listens.</h1><p class="lede">Free, anonymous for students, and no app to install.</p><p class="lede" style="font-weight:800;color:#131211;margin-top:10px">lunchline.netlify.app</p></div></div>`);
    say("LunchLine", "Better lunches, less waste, one tap at a time.");
    await sleep(6200);
  } },
];

// ---------- the player ----------
dotsEl.innerHTML = SCENES.map((s, i) => `<button type="button" data-i="${i}" aria-label="Go to ${s.name}"></button>`).join("");
const dots = [...dotsEl.children];
async function play(from = 0) {
  const mine = ++token; idx = from;
  try {
    for (; idx < SCENES.length; idx++) {
      if (mine !== token) return;
      dots.forEach((d, i) => d.classList.toggle("on", i === idx));
      prog.style.width = ((idx + 1) / SCENES.length) * 100 + "%";
      await SCENES[idx].run();
    }
    if (LOOP) { await sleep(1500); play(0); }
    else { ppBtn.textContent = "Replay"; capK.textContent = ""; }
  } catch (e) { if (e !== CANCEL) throw e; }
}
const jump = i => { token++; paused = false; ppBtn.textContent = "Pause"; cursor.hidden = true; sceneEl.querySelectorAll(".ripple").forEach(r => r.remove()); play(Math.max(0, Math.min(SCENES.length - 1, i))); };
ppBtn.addEventListener("click", () => { if (ppBtn.textContent === "Replay") return jump(0); paused = !paused; ppBtn.textContent = paused ? "Play" : "Pause"; });
$("#rs").addEventListener("click", () => jump(0));
dotsEl.addEventListener("click", e => { const b = e.target.closest("button"); if (b) jump(+b.dataset.i); });
addEventListener("keydown", e => {
  if (e.code === "Space") { e.preventDefault(); ppBtn.click(); }
  else if (e.key === "ArrowRight") jump(idx + 1);
  else if (e.key === "ArrowLeft") jump(idx - 1);
  else if (e.key === "r" || e.key === "R") jump(0);
});
const start = Number(new URLSearchParams(location.search).get("scene")) || 0;
play(start);
