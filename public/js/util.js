// small helpers

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
export const normCode = s => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
export const pct = t => (t && t.total ? Math.round((100 * t.good) / t.total) : 0);
export const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

// page language, dates read it
// language
export const L = { lang: "en" };
const locale = () => (L.lang === "es" ? "es-US" : "en-US");

export const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;
export const listJoin = a => {
  if (a.length < 2) return a.join("");
  const and = L.lang === "es" ? " y " : " and ";
  return a.slice(0, -1).join(", ") + and + a[a.length - 1];
};

// localStorage, safely
export const LS = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode, it just forgets */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

// date helpers
export const D = {
  add(d, n) { const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); },
  dow: d => new Date(d + "T00:00:00Z").getUTCDay(),
  monday(d) { const w = D.dow(d); return D.add(d, w === 0 ? -6 : 1 - w); },
  fmt: (d, o) => new Date(d + "T12:00:00Z").toLocaleDateString(locale(), { timeZone: "UTC", ...o }),
  weekdays: mon => [0, 1, 2, 3, 4].map(i => D.add(mon, i)),
  isWeekend: d => D.dow(d) === 0 || D.dow(d) === 6,
  span: (a, b) => Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 864e5) + 1,
};
export const shortDay = d => D.fmt(d, { weekday: "short", month: "short", day: "numeric" });

// date in the school's timezone
export function zoned(tz) {
  try {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const g = t => p.find(x => x.type === t).value;
    return { date: `${g("year")}-${g("month")}-${g("day")}`, hour: +g("hour") % 24, minute: +g("minute") };
  } catch {
    const n = new Date();
    return { date: `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`, hour: n.getHours(), minute: n.getMinutes() };
  }
}
// weekends: staff see next week, students see friday
export const staffHome = today => (D.isWeekend(today) ? D.add(D.monday(today), 7) : today);
export const studentHome = today => (D.isWeekend(today) ? D.add(D.monday(today), 4) : today);
export const RATE_DAYS = 7; // same as the server

// '5 min ago'
export function timeAgo(iso, t) {
  const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
  const w = t || (k => ({ now: "just now", m: "m ago", h: "h ago", d: "d ago" })[k]);
  if (s < 60) return w("now");
  if (s < 3600) return `${Math.floor(s / 60)}${w("m")}`;
  if (s < 86400) return `${Math.floor(s / 3600)}${w("h")}`;
  const d = Math.floor(s / 86400);
  return d < 7 ? `${d}${w("d")}` : new Date(iso).toLocaleDateString(locale(), { month: "short", day: "numeric" });
}

// random id
export function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, "0")).join("");
}

// copy to clipboard
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const t = document.createElement("textarea");
    t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { /* ignore */ }
    t.remove();
    return ok;
  }
}

// user wants less motion
export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
// join links
export const inviteLink = code => `${location.origin}/?join=${code}`;
export const parentLink = code => `${location.origin}/?parent=${code}`;

// emoji for dishes without a photo
const EMOJI = [
  [/bagel/, "🥯"], [/juice/, "🧃"], [/milk/, "🥛"], [/yogurt|parfait/, "🥣"], [/cereal|oat/, "🥣"], [/pancake|waffle|french toast/, "🥞"],
  [/muffin|honey bun|donut/, "🧁"], [/bread|toast/, "🍞"], [/pb&j|uncrust|sandwich|sub\b/, "🥪"], [/burrito|wrap/, "🌯"], [/taco/, "🌮"],
  [/pizza|flatbread|bosco|breadstick|stix|stick/, "🍕"], [/quesadilla|cheese/, "🧀"], [/burger/, "🍔"], [/fries/, "🍟"],
  [/wing|nugget|tender|chicken|popcorn/, "🍗"], [/pasta|spaghetti|noodle|mac/, "🍝"], [/rice|bowl/, "🍚"], [/salad|lettuce|greens/, "🥗"],
  [/carrot/, "🥕"], [/broccoli/, "🥦"], [/corn/, "🌽"], [/cucumber/, "🥒"], [/tomato/, "🍅"], [/edamame|bean|veg/, "🥬"],
  [/raisin|craisin|dried|grape/, "🍇"], [/apple|pear|peach|fruit|orange|melon/, "🍎"], [/egg|breakfast/, "🍳"], [/soup/, "🍲"],
];
export function foodEmoji(name) {
  const n = String(name || "").toLowerCase();
  for (const [re, e] of EMOJI) if (re.test(n)) return e;
  return "🍽️";
}
export const foodTile = (name, cls = "dc-noimg") => `<span class="${cls}" aria-hidden="true"><span class="emo">${foodEmoji(name)}</span></span>`;
