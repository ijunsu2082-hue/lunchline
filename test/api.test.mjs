import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { memStore, client } from "./helpers.mjs";

process.env.POW_BITS = "6"; // keep the puzzle instant in tests; read when the module loads
globalThis.__LL_DEV = true; // sign-in links come back in the response instead of by email
globalThis.__LL_TODAY = "2026-10-21";
console.log = () => {}; // dev "emails" print to the console
const { handle } = await import("../netlify/lib/api.mjs");

const TODAY = "2026-10-21";
const dish = (id, name, extra = {}) => ({ id, name, allergens: [], may: [], diet: [], ...extra });

function solve(challenge, bits) {
  for (let n = 0; ; n++) {
    const h = createHash("sha256").update(`${challenge}:${n}`).digest();
    let z = 0;
    for (const b of h) { if (b === 0) { z += 8; continue; } z += Math.clz32(b) - 24; break; }
    if (z >= bits) return String(n);
  }
}

async function setup() {
  const store = memStore();
  const staff = client(handle, store, { ip: "9.9.9.9" });
  const r = await staff("POST", "auth/request", { email: "Cook@School.edu", mode: "create", name: "Lincoln High", tz: "America/Chicago" });
  assert.equal(r.status, 200);
  const v = await staff("POST", "auth/verify", { token: new URL(r.body.dev_link).searchParams.get("login") });
  assert.equal(v.status, 200);
  const school = v.body.created;
  const menu = await staff("PUT", "menu", { school: school.id, days: [{ date: TODAY, breakfast: [], lunch: [dish("aaaaaa1", "Pizza"), dish("aaaaaa2", "Salad")] }] });
  assert.equal(menu.status, 200);
  const device = async (voter, ip) => {
    const c = client(handle, store, { ip: ip || "5.5.5." + (voter.length % 200) });
    const pow = await c("GET", `pow?school=${school.id}`);
    const t = await c("POST", "token", { school: school.id, voter_id: voter, challenge: pow.body.challenge, nonce: solve(pow.body.challenge, pow.body.bits) });
    assert.equal(t.status, 201, JSON.stringify(t.body));
    return { call: c, token: t.body.token, voter };
  };
  return { store, staff, school, device };
}

test("creating a school needs a verified email, and the link works once", async () => {
  const store = memStore();
  const c = client(handle, store);
  const bad = await c("POST", "auth/request", { email: "nope", mode: "create", name: "X School" });
  assert.equal(bad.status, 400);
  const r = await c("POST", "auth/request", { email: "a@b.edu", mode: "create", name: "Oak Middle" });
  const token = new URL(r.body.dev_link).searchParams.get("login");
  const v = await c("POST", "auth/verify", { token });
  assert.equal(v.status, 200);
  assert.equal(v.body.created.name, "Oak Middle");
  assert.ok(v.headers.get("set-cookie").includes("HttpOnly"));
  const again = await c("POST", "auth/verify", { token });
  assert.equal(again.status, 400, "a magic link can't be replayed");
  const me = await c("GET", "auth/me");
  assert.equal(me.body.email, "a@b.edu");
  assert.equal(me.body.schools[0].role, "owner");
});

test("login for an unknown email looks the same as a known one", async () => {
  const { staff } = await setup();
  const known = await staff("POST", "auth/request", { email: "cook@school.edu", mode: "login" });
  const unknown = await staff("POST", "auth/request", { email: "stranger@elsewhere.com", mode: "login" });
  assert.equal(known.status, 200);
  assert.equal(unknown.status, 200);
  assert.equal(unknown.body.sent, true);
  assert.equal(unknown.body.dev_link, undefined);
  assert.ok(known.body.dev_link);
});

test("staff routes need a session, and a cookie alone isn't enough to change things", async () => {
  const { store, school, staff } = await setup();
  const anon = client(handle, store);
  assert.equal((await anon("GET", `insights?school=${school.id}&from=${TODAY}&to=${TODAY}`)).status, 401);
  assert.equal((await anon("PUT", "menu", { school: school.id, days: [{ date: TODAY, lunch: [dish("bbbbbb1", "X")] }] })).status, 401);
  // a forged cross-site POST carries the cookie but not the x-ll header
  const cookie = [...store._m.keys()].find(k => k.startsWith("sess/"));
  assert.ok(cookie);
  const sess = (await staff("GET", "auth/me")).body;
  assert.equal(sess.email, "cook@school.edu");
  const raw = await handle(new Request("http://localhost:8888/api/menu", {
    method: "PUT", headers: { "content-type": "application/json", cookie: "ll_session=nothing" }, body: JSON.stringify({ school: school.id, days: [] }),
  }), store);
  assert.equal(raw.status, 401);
});

test("only a device with a valid token can rate; the body can't pick the voter", async () => {
  const { school, device, store } = await setup();
  const a = await device("device-aaaa-0001");
  const noToken = await a.call("POST", "votes", { school: school.id, date: TODAY, item_id: "aaaaaa1", vote: "good" });
  assert.equal(noToken.status, 401);
  const forged = await a.call("POST", "votes", { school: school.id, date: TODAY, item_id: "aaaaaa1", vote: "good" }, { token: a.token.slice(0, -2) + "xx" });
  assert.equal(forged.status, 401);
  const ok = await a.call("POST", "votes", { school: school.id, voter_id: "someone-else-99", date: TODAY, item_id: "aaaaaa1", vote: "good", comment: "yum" }, { token: a.token });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.vote, "good");
  const keys = [...store._m.keys()].filter(k => k.startsWith(`vote/${school.id}/`));
  assert.equal(keys.length, 1);
  assert.ok(keys[0].includes("device-aaaa-0001"), "the vote is stored under the token's device, not the body's");
  // a token for another school doesn't work here
  const other = client(handle, store);
  const s2 = await other("POST", "auth/request", { email: "x@y.edu", mode: "create", name: "Other School" });
  const v2 = await other("POST", "auth/verify", { token: new URL(s2.body.dev_link).searchParams.get("login") });
  const pow = await other("GET", `pow?school=${v2.body.created.id}`);
  const t2 = await other("POST", "token", { school: v2.body.created.id, voter_id: "device-bbbb-0002", challenge: pow.body.challenge, nonce: solve(pow.body.challenge, pow.body.bits) });
  const cross = await a.call("POST", "votes", { school: school.id, date: TODAY, item_id: "aaaaaa1", vote: "bad" }, { token: t2.body.token });
  assert.equal(cross.status, 401);
});

test("a solved puzzle can't be reused, and a wrong answer is refused", async () => {
  const { school, store } = await setup();
  const c = client(handle, store, { ip: "7.7.7.7" });
  const pow = await c("GET", `pow?school=${school.id}`);
  const nonce = solve(pow.body.challenge, pow.body.bits);
  const body = { school: school.id, voter_id: "device-cccc-0003", challenge: pow.body.challenge, nonce };
  assert.equal((await c("POST", "token", body)).status, 201);
  assert.equal((await c("POST", "token", body)).status, 400, "replay");
  const pow2 = await c("GET", `pow?school=${school.id}`);
  let bad = 0;
  while (true) { const n = "z" + bad; const { createHash: h } = await import("node:crypto"); const d = h("sha256").update(`${pow2.body.challenge}:${n}`).digest(); if (d[0] !== 0) break; bad++; }
  assert.equal((await c("POST", "token", { ...body, challenge: pow2.body.challenge, nonce: "z" + bad })).status, 400);
});

test("ratings follow the 7-day window", async () => {
  const { school, device, staff } = await setup();
  await staff("PUT", "menu", { school: school.id, days: [{ date: "2026-10-22", lunch: [dish("fffff01", "Future")] }, { date: "2026-10-10", lunch: [dish("ooooo01", "Old")] }] });
  const d = await device("device-dddd-0004");
  assert.equal((await d.call("POST", "votes", { school: school.id, date: "2026-10-22", item_id: "fffff01", vote: "good" }, { token: d.token })).status, 403);
  assert.equal((await d.call("POST", "votes", { school: school.id, date: "2026-10-10", item_id: "ooooo01", vote: "good" }, { token: d.token })).status, 403);
  assert.equal((await d.call("POST", "votes", { school: school.id, date: TODAY, item_id: "nope123", vote: "good" }, { token: d.token })).status, 404);
});

test("grade level sticks to the student and reaches the kitchen only in groups", async () => {
  const { school, device, staff } = await setup();
  const kids = [];
  for (let i = 0; i < 6; i++) kids.push(await device(`device-grade-${String(i).padStart(4, "0")}`));
  const bad = await kids[0].call("POST", "profile", { school: school.id, grade: "3" }, { token: kids[0].token });
  assert.equal(bad.status, 400, "a grade the school doesn't serve is refused");
  // five 10th graders vote, one 11th grader votes
  for (let i = 0; i < 5; i++) {
    await kids[i].call("POST", "profile", { school: school.id, grade: "10" }, { token: kids[i].token });
    await kids[i].call("POST", "votes", { school: school.id, date: TODAY, item_id: "aaaaaa2", vote: "bad" }, { token: kids[i].token });
  }
  await kids[5].call("POST", "votes", { school: school.id, date: TODAY, item_id: "aaaaaa2", vote: "bad" }, { token: kids[5].token });
  // grade set AFTER voting still counts
  await kids[5].call("POST", "profile", { school: school.id, grade: "11" }, { token: kids[5].token });
  const ins = (await staff("GET", `insights?school=${school.id}&from=${TODAY}&to=${TODAY}`)).body;
  assert.equal(ins.stats.total.total, 6);
  const g10 = ins.stats.grades.find(g => g.grade === "10"), g11 = ins.stats.grades.find(g => g.grade === "11");
  assert.equal(g10.ok, true);
  assert.equal(g10.t.bad, 5);
  assert.equal(g10.worst.name, "Salad");
  assert.equal(g11.ok, false, "one student isn't a group");
  assert.equal(JSON.stringify(ins).includes("device-grade"), false, "raw device ids never reach the dashboard");
  const prof = await kids[5].call("GET", `profile?school=${school.id}`, undefined, { token: kids[5].token });
  assert.equal(prof.body.grade, "11");
});

test("duplicate suggestions merge into one idea", async () => {
  const { school, device, staff } = await setup();
  const [a, b, c] = [await device("device-idea-0001"), await device("device-idea-0002"), await device("device-idea-0003")];
  const first = await a.call("POST", "ideas", { school: school.id, text: "Noodles" }, { token: a.token });
  assert.equal(first.body.merged, false);
  const sim = await b.call("GET", `ideas/similar?school=${school.id}&q=noodels`);
  assert.equal(sim.body.matches[0].text, "Noodles");
  assert.equal(sim.body.matches[0].same, true);
  const second = await b.call("POST", "ideas", { school: school.id, text: "NOOdLEs" }, { token: b.token });
  assert.equal(second.body.merged, true);
  assert.equal(second.body.idea.count, 2);
  const spicy = await c.call("POST", "ideas", { school: school.id, text: "spicy noodles" }, { token: c.token });
  assert.equal(spicy.body.merged, false, "a related-but-different idea stays separate");
  const list = (await c.call("GET", `ideas?school=${school.id}`, undefined, { token: c.token })).body.ideas;
  assert.equal(list.length, 2);
  assert.equal(list[0].text, "Noodles");
  assert.equal(list[0].count, 2);
  // staff can merge related ideas and set a status
  const merged = await staff("POST", `ideas/${spicy.body.idea.id}/merge`, { school: school.id, into: first.body.idea.id });
  assert.equal(merged.body.count, 3);
  await staff("PATCH", `ideas/${first.body.idea.id}`, { school: school.id, status: "planned", reply: "Trying it in November" });
  const after = (await c.call("GET", `ideas?school=${school.id}`, undefined, { token: c.token })).body.ideas;
  assert.equal(after.length, 1);
  assert.equal(after[0].status, "planned");
  assert.equal(after[0].reply, "Trying it in November");
  assert.ok(after[0].aliases.includes("Spicy noodles"));
});

test("suggestions are rate limited per device", async () => {
  const { school, device } = await setup();
  const a = await device("device-spam-0001");
  const foods = ["tacos", "ramen", "pho", "waffles", "burritos", "sushi", "curry"];
  const results = [];
  for (const f of foods) results.push((await a.call("POST", "ideas", { school: school.id, text: f + " bowl" }, { token: a.token })).status);
  assert.deepEqual(results.slice(0, 6), [201, 201, 201, 201, 201, 201]);
  assert.equal(results[6], 429);
});

test("roles: cooks can edit menus but not manage people; nobody can promote past themselves", async () => {
  const { school, staff, store } = await setup();
  const inv = await staff("POST", "staff", { school: school.id, email: "cook2@school.edu", role: "cook" });
  assert.equal(inv.status, 201);
  const cook = client(handle, store, { ip: "8.8.8.8" });
  const r = await cook("POST", "auth/request", { email: "cook2@school.edu", mode: "login" });
  await cook("POST", "auth/verify", { token: new URL(r.body.dev_link).searchParams.get("login") });
  assert.equal((await cook("PUT", "menu", { school: school.id, days: [{ date: TODAY, lunch: [dish("ccccc01", "Soup")] }] })).status, 200);
  assert.equal((await cook("POST", "staff", { school: school.id, email: "x@y.edu", role: "cook" })).status, 403);
  assert.equal((await cook("PATCH", `schools/${school.id}`, { enrollment: 10 })).status, 403);
  assert.equal((await cook("DELETE", `schools/${school.id}`)).status, 403);
  // an admin can invite cooks but not owners
  await staff("POST", "staff", { school: school.id, email: "admin@school.edu", role: "admin" });
  const admin = client(handle, store, { ip: "6.6.6.6" });
  const ra = await admin("POST", "auth/request", { email: "admin@school.edu", mode: "login" });
  await admin("POST", "auth/verify", { token: new URL(ra.body.dev_link).searchParams.get("login") });
  assert.equal((await admin("POST", "staff", { school: school.id, email: "z@y.edu", role: "owner" })).status, 403);
  assert.equal((await admin("POST", "staff", { school: school.id, email: "z@y.edu", role: "cook" })).status, 201);
  // the last owner can't be removed
  const members = (await staff("GET", `staff?school=${school.id}`)).body.members;
  const owner = members.find(m => m.role === "owner");
  assert.equal((await staff("DELETE", `staff/${owner.id}?school=${school.id}`)).status, 400);
});

test("school colors and settings are validated", async () => {
  const { school, staff, store } = await setup();
  assert.equal((await staff("PATCH", `schools/${school.id}`, { theme: { color: "red" } })).status, 400);
  assert.equal((await staff("PATCH", `schools/${school.id}`, { theme: { color: "javascript:1" } })).status, 400);
  const ok = await staff("PATCH", `schools/${school.id}`, { theme: { color: "#1f7a4d" }, grades: ["6", "7", "8"], enrollment: 420 });
  assert.equal(ok.status, 200);
  const pub = (await client(handle, store)("GET", `schools/${school.id}`)).body.school;
  assert.equal(pub.theme.color, "#1F7A4D");
  assert.deepEqual(pub.grades, ["6", "7", "8"]);
  assert.equal(pub.enrollment, undefined, "enrollment stays private to staff");
  assert.equal((await staff("PATCH", `schools/${school.id}`, { grades: [] })).status, 400);
  assert.equal((await staff("PATCH", `schools/${school.id}`, { enrollment: -3 })).status, 400);
});

test("waste log, replies, and hiding a comment", async () => {
  const { school, staff, device } = await setup();
  assert.equal((await staff("PUT", "waste", { school: school.id, date: TODAY, pounds: 24.5 })).status, 200);
  assert.equal((await staff("PUT", "waste", { school: school.id, date: "2026-10-30", pounds: 5 })).status, 400, "no waste logged for the future");
  assert.equal((await staff("PUT", "waste", { school: school.id, date: TODAY, pounds: -1 })).status, 400);
  const kid = await device("device-wr-0001");
  await kid.call("POST", "votes", { school: school.id, date: TODAY, item_id: "aaaaaa1", vote: "bad", comment: "cold pizza" }, { token: kid.token });
  let ins = (await staff("GET", `insights?school=${school.id}&from=${TODAY}&to=${TODAY}`)).body;
  assert.equal(ins.stats.waste.pounds, 24.5);
  assert.equal(ins.stats.comments[0].comment, "cold pizza");
  const rep = await staff("POST", "replies", { school: school.id, date: TODAY, item_id: "aaaaaa1", text: "We're fixing the oven" });
  assert.equal(rep.body.reply, "We're fixing the oven");
  const menu = (await staff("GET", `menu?school=${school.id}&from=${TODAY}&to=${TODAY}`)).body;
  assert.equal(menu.days[TODAY].lunch[0].reply, "We're fixing the oven");
  const hide = await staff("POST", "votes/hide", { school: school.id, date: TODAY, item_id: "aaaaaa1", cid: ins.stats.comments[0].cid });
  assert.equal(hide.body.hidden, true);
  ins = (await staff("GET", `insights?school=${school.id}&from=${TODAY}&to=${TODAY}`)).body;
  assert.equal(ins.stats.comments.length, 0);
  assert.equal(ins.stats.total.total, 1, "hiding a comment keeps the rating");
});

test("deleting a school removes its data and staff access", async () => {
  const { school, staff, store } = await setup();
  assert.equal((await staff("DELETE", `schools/${school.id}`)).status, 200);
  const left = [...store._m.keys()].filter(k => k.includes(school.id) && !k.startsWith("rl/"));
  assert.deepEqual(left, []);
  assert.equal((await client(handle, store)("GET", `schools/${school.id}`)).status, 404);
});

test("three meals: a snack dish is saved, returned under snack and can be rated", async () => {
  const { school, staff, device } = await setup();
  const put = await staff("PUT", "menu", { school: school.id, days: [{ date: TODAY, breakfast: [dish("bkfst01", "Pancakes")], snack: [dish("snack01", "Banana Bread")], lunch: [dish("lunch01", "Pizza")] }] });
  assert.equal(put.status, 200);
  const menu = (await staff("GET", `menu?school=${school.id}&from=${TODAY}&to=${TODAY}`)).body.days[TODAY];
  assert.deepEqual(menu.snack.map(i => i.id), ["snack01"]);
  const d = await device("snack-kid-1");
  const r = await d.call("POST", "votes", { school: school.id, date: TODAY, item_id: "snack01", vote: "good" }, { token: d.token });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.meal, "snack");
  const ins = (await staff("GET", `insights?school=${school.id}&from=${TODAY}&to=${TODAY}`)).body;
  assert.equal(ins.stats.byMeal.snack.total, 1);
});

test("three meals: a legacy day without snack reads back with snack [], and still works", async () => {
  const { store, school, staff, device } = await setup();
  const legacy = { date: TODAY, breakfast: [dish("oldb001", "Toast")], lunch: [dish("oldl001", "Soup")] };
  await store.setJSON(`day/${school.id}/${TODAY}`, legacy);
  const menu = (await staff("GET", `menu?school=${school.id}&from=${TODAY}&to=${TODAY}`)).body.days[TODAY];
  assert.deepEqual(menu.snack, []);
  assert.equal(menu.lunch.length, 1);
  const d = await device("legacy-kid-1");
  const r = await d.call("POST", "votes", { school: school.id, date: TODAY, item_id: "oldl001", vote: "bad" }, { token: d.token });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const ins = (await staff("GET", `insights?school=${school.id}&from=${TODAY}&to=${TODAY}`)).body;
  assert.equal(ins.stats.byMeal.lunch.total, 1);
  assert.deepEqual(Object.keys(ins.stats.byMeal), ["breakfast", "snack", "lunch"]);
  const reply = await staff("POST", "replies", { school: school.id, date: TODAY, item_id: "oldb001", text: "Fresh daily" });
  assert.equal(reply.status, 200, JSON.stringify(reply.body));
});

test("nutrition facts are kept as numbers, and junk becomes blank", async () => {
  const { school, staff } = await setup();
  const out = await staff("PUT", "menu", { school: school.id, days: [{ date: TODAY, lunch: [
    dish("nutri01", "Chicken Sandwich", { calories: 443, protein: 37, fat: "27", sat_fat: 3, carbs: 50, fiber: 6.5, sodium: 809 }),
    dish("nutri02", "Mystery", { protein: "lots", fat: -4, sodium: 999999, carbs: "" }),
  ] }] });
  assert.equal(out.status, 200);
  const [a, b] = out.body.days[TODAY].lunch;
  assert.deepEqual([a.calories, a.protein, a.fat, a.sat_fat, a.carbs, a.fiber, a.sodium], [443, 37, 27, 3, 50, 6.5, 809]);
  assert.deepEqual([b.protein, b.fat, b.sodium, b.carbs, b.fiber], [null, null, null, null, null]);
});

test("a school full of students behind one wifi address isn't locked out", async () => {
  const { school, store } = await setup();
  let joined = 0;
  for (let i = 0; i < 60; i++) {
    const c = client(handle, store, { ip: "203.0.113.7" }); // everyone on the same network
    const pow = await c("GET", `pow?school=${school.id}`);
    const t = await c("POST", "token", { school: school.id, voter_id: `device-wifi-${String(i).padStart(4, "0")}`, challenge: pow.body.challenge, nonce: solve(pow.body.challenge, pow.body.bits) });
    if (t.status === 201) joined++;
  }
  assert.equal(joined, 60);
});

test("the master code signs in as the owner, only when set, and wrong codes are refused", async () => {
  const store = memStore();
  const c = client(handle, store, { ip: "7.7.7.7" });
  delete process.env.MASTER_CODE;
  assert.equal((await c("POST", "auth/master", { code: "anything-long" })).status, 403, "off unless MASTER_CODE is set");
  process.env.MASTER_CODE = "correct-horse-battery";
  process.env.MASTER_EMAIL = "owner@example.org";
  assert.equal((await c("POST", "auth/master", { code: "wrong-wrong-wrong" })).status, 401);
  const ok = await c("POST", "auth/master", { code: "correct-horse-battery" });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.email, "owner@example.org");
  assert.equal(ok.body.created.name, "Irvine High School");
  assert.ok(ok.headers.get("set-cookie").includes("HttpOnly"));
  assert.equal((await c("GET", "auth/me")).body.schools[0].role, "owner");
  const again = await c("POST", "auth/master", { code: "correct-horse-battery" });
  assert.equal(again.body.created, null, "second use signs in to the same school");
  delete process.env.MASTER_CODE; delete process.env.MASTER_EMAIL;
});
