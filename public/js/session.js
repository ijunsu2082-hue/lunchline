// switching between welcome, student, parent and staff
import { LS, zoned } from "./util.js";
import { state, MEALS } from "./state.js";
import { applyTheme, resetTheme } from "./theme.js";
import { render, go, TABS } from "./ui.js";

// clear everything
export function resetData() {
  Object.assign(state, {
    week: null, day: null, meal: null, touched: false, weeks: {}, mine: {}, ideas: null,
    aWeek: null, aDay: null, aWeeks: {}, insights: null, lastIns: null, showHidden: false, team: null, teamLink: null, reports: null, audit: null, today: null,
    bannerAt: 0, dishOpen: null, ideaDraft: "", ideaMatches: [],
  });
  state.openComment.clear(); state.cDraft = {};
}

// switch sides
export function setMode(mode) {
  state.mode = mode; state.ob = null;
  LS.set("ll_mode", mode);
  resetData();
  const s = mode === "admin" ? state.admin?.school : mode === "parent" ? state.parent?.school : state.student?.school;
  if (s) applyTheme(s.theme?.color); else resetTheme();
  go(TABS[mode][0][0]);
}

// back to the start
export function leaveToWelcome() {
  state.mode = null; LS.del("ll_mode"); resetData(); resetTheme();
  startFlow("welcome");
}

// setup and sign in flows
export const FLOWS = {
  welcome: ["welcome"],
  student: ["school", "setup"],
  parent: ["school"],
  signin: ["login"],
  create: ["create"],
  verify: ["verify"],
};

// start a flow
export function startFlow(flow, data = {}, opts = {}) {
  const st = state.student;
  state.ob = {
    flow, i: 0, busy: false, err: "",
    steps: opts.steps || FLOWS[flow],
    exit: opts.exit || "welcome",
    d: {
      findBy: "code", code: "", q: "", results: null, all: null, school: null,
      grade: "", vegetarian: false, allergies: [], allergyOther: "", allergyOtherOn: false, cuisines: [], cuisineOther: "", cuisineOtherOn: false,
      email: "", password: "", schoolName: "", picking: null,
      sentTo: "", devLink: "", verifyFailed: false,
      ...(flow === "edit" && st ? { ...st, allergyOtherOn: !!st.allergyOther, cuisineOtherOn: !!st.cuisineOther, allergies: [...st.allergies], cuisines: [...st.cuisines] } : {}),
      ...data,
    },
  };
  if (state.ob.d.school?.theme) applyTheme(state.ob.d.school.theme.color); else if (!state.mode) resetTheme();
  render(true);
}

// leave a flow
export function obExit() {
  if (state.ob.exit === "app" && state.mode) { state.ob = null; render(true); }
  else startFlow("welcome");
}

// small helpers
export const mealLabelKey = m => ("meal." + (MEALS.includes(m) ? m : "lunch"));
export const todayFor = tz => zoned(tz).date;
export { MEALS };
