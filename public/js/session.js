// Moving between "who is using the app": welcome, student, parent, staff.
import { LS, D, zoned } from "./util.js";
import { state, MEALS } from "./state.js";
import { applyTheme, resetTheme } from "./theme.js";
import { render, go, TABS } from "./ui.js";

export function resetData() {
  Object.assign(state, {
    week: null, day: null, meal: null, touched: false, weeks: {}, mine: {}, ideas: null,
    aWeek: null, aDay: null, aWeeks: {}, insights: null, team: null, teamLink: null, reports: null, audit: null, today: null,
    bannerAt: 0, dishOpen: null, ideaDraft: "", ideaMatches: [],
  });
  state.openComment.clear(); state.cDraft = {};
}

export function setMode(mode) {
  state.mode = mode; state.ob = null;
  LS.set("ll_mode", mode);
  resetData();
  const s = mode === "admin" ? state.admin?.school : mode === "parent" ? state.parent?.school : state.student?.school;
  if (s) applyTheme(s.theme?.color); else resetTheme();
  go(TABS[mode][0][0]);
}

export function leaveToWelcome() {
  state.mode = null; LS.del("ll_mode"); resetData(); resetTheme();
  startFlow("welcome");
}

export const FLOWS = {
  welcome: ["welcome"],
  student: ["school", "setup"],
  parent: ["school"],
  signin: ["login"],
  create: ["create"],
  invite: ["newpass"],
};

export function startFlow(flow, data = {}, opts = {}) {
  const st = state.student;
  state.ob = {
    flow, i: 0, busy: false, err: "",
    steps: opts.steps || FLOWS[flow],
    exit: opts.exit || "welcome",
    d: {
      findBy: "code", code: "", q: "", results: null, all: null, school: null,
      grade: "", allergies: [], allergyOther: "", allergyOtherOn: false, cuisines: [], cuisineOther: "", cuisineOtherOn: false,
      email: "", password: "", schoolName: "", sample: true, picking: null,
      token: "", setupEmail: "", setupSchool: "",
      ...(flow === "edit" && st ? { ...st, allergyOtherOn: !!st.allergyOther, cuisineOtherOn: !!st.cuisineOther, allergies: [...st.allergies], cuisines: [...st.cuisines] } : {}),
      ...data,
    },
  };
  if (state.ob.d.school?.theme) applyTheme(state.ob.d.school.theme.color); else if (!state.mode) resetTheme();
  render(true);
}

export function obExit() {
  if (state.ob.exit === "app" && state.mode) { state.ob = null; render(true); }
  else startFlow("welcome");
}

// A sample menu to try everything right away: `weeks` weeks starting at `monday`.
export function sampleDays(monday, weeks) {
  const plan = window.SAMPLE_PLAN || window.SAMPLE_WEEK || [];
  const days = [];
  for (let w = 0; w < weeks; w++) {
    for (let i = 0; i < 5 && plan.length; i++) {
      const day = plan[(w * 5 + i) % plan.length];
      days.push({ date: D.add(monday, w * 7 + i), ...Object.fromEntries(MEALS.map(m => [m, (day[m] || []).map(x => ({ ...x }))])) });
    }
  }
  return days;
}

export const mealLabelKey = m => ("meal." + (MEALS.includes(m) ? m : "lunch"));
export const todayFor = tz => zoned(tz).date;
export { MEALS };
