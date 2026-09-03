import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ALL_RULE_IDS, buildRedirectRules } from "../lib/rules.js";

test("DNR rules only match real arXiv main-frame URLs", () => {
  const rules = buildRedirectRules(false);
  const abs = new RegExp(rules[0].condition.regexFilter);
  const pdf = new RegExp(rules[2].condition.regexFilter);
  assert.match("https://arxiv.org/abs/2301.12345", abs);
  assert.doesNotMatch("https://example.com/?next=https://arxiv.org/abs/2301.12345", abs);
  assert.doesNotMatch("https://arxiv.org/abs/2301.12345/extra", abs);
  assert.match("https://arxiv.org/pdf/2301.12345.pdf?download=1", pdf);
  assert.doesNotMatch("https://arxiv.org/pdf/2301.12345.pdf/extra", pdf);
});

test("PDF rules remain active regardless of Acrobat", () => {
  assert.equal(buildRedirectRules(true).length, 3);
  assert.equal(buildRedirectRules(false).length, 3);
  assert.deepEqual(buildRedirectRules().map((rule) => rule.id), [1001, 1002, 1003]);
  assert.deepEqual(ALL_RULE_IDS, [1, 2, 3, 4]);
});

test("checked-in static rules match the generator", async () => {
  const staticRules = JSON.parse(
    await readFile(new URL("../rules.json", import.meta.url), "utf8")
  );
  assert.deepEqual(staticRules, buildRedirectRules());
});
