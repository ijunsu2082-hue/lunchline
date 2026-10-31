// shared state and lists
import { LS, newId } from "./util.js";

export const ALLERGENS = ["peanuts", "tree_nuts", "dairy", "eggs", "gluten", "soy", "fish", "shellfish", "sesame"];
export const CUISINES = ["american", "italian", "mexican", "korean", "chinese", "japanese", "indian", "mediterranean", "healthy"];
export const DIETS = ["vegetarian", "vegan", "halal", "spicy"];
export const MEALS = ["breakfast", "snack", "lunch"];
// all dishes in a day
export const dayItems = day => (day ? MEALS.flatMap(m => day[m] || []) : []);
export const RATINGS = ["good", "mid", "bad"];
export const GRADE_ORDER = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
export const COMMENT_MAX = 280;
export const IDEA_MAX = 120;
export const REPLY_MAX = 160;
export const IDEA_STATUSES = ["new", "planned", "on_menu", "not_now"];

export const state = {
  voter: LS.get("ll_voter"),
  student: LS.get("ll_student"),   // profile
  parent: LS.get("ll_parent"),    // parent profile
  admin: null,                     // staff session
  mode: null,                      // which side we're on
  ob: null,                        // sign in / setup flow
  today: null,
  // student
  week: null, day: null, meal: null, touched: false, weeks: {}, mine: {}, ideas: null,
  openComment: new Set(), cDraft: {}, bannerAt: 0, dishOpen: null, ideaDraft: "", ideaMatches: [], ideaView: "all", ideaForce: false, dupes: null,
  draftColor: null, draftGrades: null,
  // staff
  aWeek: null, aDay: null, aMeal: "lunch", aWeeks: {}, range: "7", insights: null, edit: null,
  team: null, teamLink: null, reports: null, audit: null, // new teammate link
  loading: new Set(),
};

if (typeof state.voter !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(state.voter)) { state.voter = newId(); LS.set("ll_voter", state.voter); }
// leftovers from older versions
LS.del("ll_profile"); LS.del("ll_votes");

export const school = () => (state.mode === "admin" ? state.admin.school : state.mode === "parent" ? state.parent.school : state.student.school);
export const profile = () => (state.mode === "parent" ? state.parent : state.student) || { allergies: [], allergyOther: "", cuisines: [], cuisineOther: "", grade: "" };
export const isStaff = () => state.mode === "admin";
export const can = role => {
  const rank = r => ["cook", "admin", "owner"].indexOf(r);
  return state.admin && rank(state.admin.role) >= rank(role);
};
