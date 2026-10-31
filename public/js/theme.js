// school colors: work out text and dark mode colors from one color

// common school colors
export const PRESET_GROUPS = [
  ["Reds", [["Scarlet", "#E03A3E"], ["Cardinal", "#C8102E"], ["Crimson", "#A6192E"], ["Maroon", "#7A1F2B"], ["Burgundy", "#5E1224"]]],
  ["Oranges & golds", [["Orange", "#FF5A1F"], ["Burnt orange", "#BF5700"], ["Gold", "#E0A100"], ["Old gold", "#B3995D"], ["Yellow", "#F2C500"]]],
  ["Greens", [["Kelly green", "#1FA145"], ["Forest", "#1F7A4D"], ["Hunter", "#175B3B"], ["Teal", "#0F8B8D"], ["Lime", "#7DB92F"]]],
  ["Blues", [["Sky", "#4AA3DF"], ["Columbia blue", "#6CACE4"], ["Royal", "#2563EB"], ["Navy", "#1F3A8A"], ["Midnight", "#14264F"]]],
  ["Purples & pinks", [["Purple", "#6D28D9"], ["Violet", "#8B5CF6"], ["Plum", "#5B2A6B"], ["Pink", "#DB2777"], ["Magenta", "#B5179E"]]],
  ["Neutrals", [["Black", "#232323"], ["Charcoal", "#3A3A3C"], ["Slate", "#475569"], ["Brown", "#6B4423"], ["Silver", "#8E99A4"]]],
];
export const PRESETS = PRESET_GROUPS.flatMap(([, list]) => list);
export const colorName = hex => (PRESETS.find(([, h]) => h.toLowerCase() === String(hex).toLowerCase()) || [])[0] || "Custom color";
export const DEFAULT_COLOR = "#FF5A1F";

const CREAM = "#FFF6EA", DARK = "#261B14", INK = "#20150D";
export const isHex = s => /^#[0-9a-fA-F]{6}$/.test(s || "");

// color math
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export const contrast = (a, b) => { const x = lum(rgb(a)), y = lum(rgb(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

// hsl conversion
function toHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function fromHsl(h, s, l) {
  const f = n => {
    const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return "#" + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, "0")).join("");
}

// nudge a color until it's readable
function readableOn(hex, bg, min, dir) {
  let [h, s, l] = toHsl(rgb(hex));
  for (let i = 0; i < 60 && contrast(fromHsl(h, s, l), bg) < min; i++) l = Math.min(0.97, Math.max(0.05, l + dir * 0.015));
  return fromHsl(h, s, l);
}

// css variables for a color
export function themeVars(color) {
  const c = isHex(color) ? color.toUpperCase() : DEFAULT_COLOR;
  const [h, s] = toHsl(rgb(c));
  return {
    "--brand": c,
    "--brand-ink": "#111111",
    "--brand-text-l": readableOn(c, CREAM, 4.5, -1),
    "--brand-text-d": readableOn(c, DARK, 4.5, 1),
    "--rail": "#FFFFFF",
    "--rail-2": "#FFFFFF",
  };
}

// brand color is fixed now, school colors are ignored
export function applyTheme() {
  const root = document.documentElement;
  const vars = themeVars(DEFAULT_COLOR);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", vars["--rail"]);
}

export const resetTheme = () => applyTheme(DEFAULT_COLOR);
