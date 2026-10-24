import { test } from "node:test";
import assert from "node:assert/strict";
import { similarity, normalize, findSimilar, tidyText, SAME, RELATED, osa } from "../netlify/lib/similarity.mjs";

test("typos, case and plurals all land on one idea", () => {
  for (const v of ["noodle", "noodels", "NOOdLEs", "Noodles!", "  noodles  ", "noodlzzz".slice(0, 6)]) {
    assert.ok(similarity("Noodles", v) >= SAME, `${v} should match Noodles (${similarity("Noodles", v)})`);
  }
});

test("repeated letters and filler words are ignored", () => {
  assert.equal(normalize("Pizzzzza please!"), normalize("pizza"));
  assert.ok(similarity("more tacos", "Tacos") >= SAME);
});

test("word order does not matter", () => {
  assert.ok(similarity("spicy chicken sandwich", "Chicken sandwich spicy") >= SAME);
});

test("different foods stay different", () => {
  assert.ok(similarity("pizza", "pasta") < RELATED);
  assert.ok(similarity("tacos", "salad bar") < RELATED);
  assert.ok(similarity("tea", "pea") < RELATED, "very short words are not confused");
});

test("a part of a longer idea is related but not the same", () => {
  const s = similarity("noodles", "spicy noodles");
  assert.ok(s >= RELATED && s < SAME, String(s));
});

test("osa counts a swap as one edit", () => {
  assert.equal(osa("noodel", "noodle"), 1);
  assert.equal(osa("abc", "abc"), 0);
  assert.equal(osa("", "abc"), 3);
});

test("findSimilar ranks the closest, most-voted idea first", () => {
  const ideas = [{ text: "Noodles", count: 3 }, { text: "Spicy noodles", count: 9 }, { text: "Salad bar", count: 20 }];
  const hits = findSimilar("noodel", ideas);
  assert.equal(hits[0].idea.text, "Noodles");
  assert.ok(!hits.some(h => h.idea.text === "Salad bar"));
});

test("tidyText fixes shouting but leaves real names alone", () => {
  assert.equal(tidyText("NOODLES PLEASE"), "Noodles please");
  assert.equal(tidyText("NOOdLEs"), "Noodles");
  assert.equal(tidyText("korean fried chicken"), "Korean fried chicken");
  assert.equal(tidyText("Korean BBQ wings"), "Korean BBQ wings");
  assert.equal(tidyText("Mac & Cheese"), "Mac & Cheese");
});
