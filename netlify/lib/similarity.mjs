// matching for suggestions, so typos and plurals count as the same idea
const STOP = new Set(["a", "an", "the", "some", "more", "please", "pls", "plz", "we", "want", "need", "can", "could", "have", "get", "add", "make", "of", "and", "for", "on", "in", "at", "to"]);

// chop plurals
export function stem(word) {
  let w = word;
  if (w.length > 4 && w.endsWith("ies")) w = w.slice(0, -3) + "y";
  else if (w.length > 4 && /(ch|sh|x|ss|zz)es$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  return w;
}

// lowercase, clean up, split into words
export function tokens(input) {
  const base = String(input || "")
    .toLowerCase()
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/(.)\1{2,}/g, "$1$1");
  const words = base.split(/\s+/).filter(Boolean).map(stem);
  const kept = words.filter(w => !STOP.has(w));
  return kept.length ? kept : words;
}

// cleaned up text
export const normalize = input => tokens(input).join(" ");
// word order doesn't matter
export const sortedKey = input => [...tokens(input)].sort().join(" ");

// how many edits between two words
export function osa(a, b) {
  const la = a.length, lb = b.length;
  if (!la) return lb;
  if (!lb) return la;
  const d = Array.from({ length: la + 1 }, () => new Array(lb + 1).fill(0));
  for (let i = 0; i <= la; i++) d[i][0] = i;
  for (let j = 0; j <= lb; j++) d[0][j] = j;
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[la][lb];
}

// 0 to 1 how close two words are
const ratio = (a, b) => (a || b ? 1 - osa(a, b) / Math.max(a.length, b.length) : 1);

// does each word have a match
function wordCover(ta, tb) {
  const [small, big] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  if (!small.length) return 0;
  let sum = 0;
  for (const w of small) sum += Math.max(...big.map(x => ratio(w, x)));
  return sum / small.length;
}

// how alike two ideas are
export function similarity(a, b) {
  const ta = tokens(a), tb = tokens(b);
  if (!ta.length || !tb.length) return 0;
  const whole = ratio(ta.join(" "), tb.join(" "));
  const ordered = ratio(sortedKey(a), sortedKey(b));
  let score = Math.max(whole, ordered);
  const cover = wordCover(ta, tb);
  if (ta.length !== tb.length && cover >= 0.85) score = Math.max(score, 0.6 + 0.2 * Math.min(ta.length, tb.length) / Math.max(ta.length, tb.length));
  if (Math.max(ta.join("").length, tb.join("").length) <= 3 && score < 1) score = Math.min(score, 0.5);
  return Math.round(score * 1000) / 1000;
}

// score cutoffs
export const SAME = 0.8;
export const RELATED = 0.6;

// closest existing ideas
export function findSimilar(query, ideas, { min = RELATED, limit = 3 } = {}) {
  return ideas
    .map(i => ({ idea: i, score: similarity(query, i.text) }))
    .filter(x => x.score >= min)
    .sort((a, b) => b.score - a.score || (b.idea.count || 0) - (a.idea.count || 0))
    .slice(0, limit);
}

// fix shouty caps but leave names alone
export function tidyText(raw) {
  const t = String(raw || "").trim().replace(/\s+/g, " ");
  const letters = t.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3) return t;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  const allCaps = upper === letters.length;
  const allLower = upper === 0;
  const titleCase = t.split(" ").every(w => !w || /^[A-Z][a-z0-9'’-]*$/.test(w) || !/[A-Za-z]/.test(w));
  const mixedWord = t.split(" ").some(w => /[a-z]/.test(w) && /[A-Z]/.test(w.slice(1)) && !/^[A-Z][a-z]+(?:[A-Z]{2,}|$)/.test(w) && !/^[A-Z]{2,}s?$/.test(w));
  if (allCaps || mixedWord) return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  if (allLower) return t.charAt(0).toUpperCase() + t.slice(1);
  return titleCase || t.length > 0 ? t : t;
}
