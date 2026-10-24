// Translations. English is the source; anything missing in another language
// falls back to English, so a half-translated string never shows up blank.
import { LS, L } from "./util.js";
import en from "../i18n/en.js";
import es from "../i18n/es.js";

const DICTS = { en, es };
export const LANGS = [["en", "English"], ["es", "Español"]];

export function preferredLang() {
  const saved = LS.get("ll_lang");
  if (saved && DICTS[saved]) return saved;
  return (navigator.language || "en").toLowerCase().startsWith("es") ? "es" : "en";
}
export function chooseLang(l) { LS.set("ll_lang", DICTS[l] ? l : "en"); }

export function setLang(l) {
  const lang = DICTS[l] ? l : "en";
  L.lang = lang;
  document.documentElement.lang = lang;
}

export function t(key, vars) {
  let s = DICTS[L.lang]?.[key] ?? en[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}
