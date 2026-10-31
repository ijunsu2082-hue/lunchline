// translations, falls back to english
import { LS, L } from "./util.js";
import en from "../i18n/en.js";
import es from "../i18n/es.js";

const DICTS = { en, es };
export const LANGS = [["en", "English"], ["es", "Español"]];

// which language to use
export function preferredLang() {
  const saved = LS.get("ll_lang");
  if (saved && DICTS[saved]) return saved;
  return (navigator.language || "en").toLowerCase().startsWith("es") ? "es" : "en";
}
// remember the choice
export function chooseLang(l) { LS.set("ll_lang", DICTS[l] ? l : "en"); }

// switch language
export function setLang(l) {
  const lang = DICTS[l] ? l : "en";
  L.lang = lang;
  document.documentElement.lang = lang;
}

// look up a string
export function t(key, vars) {
  let s = DICTS[L.lang]?.[key] ?? en[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}
