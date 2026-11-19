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

test("DNR redirects discard arbitrary query strings and fragments", () => {
  const paperUrls = [
    ["https://www.arxiv.org/abs/2301.12345v2", "2301.12345v2"],
    ["https://arxiv.org/html/2608.07418", "2608.07418"],
    ["https://arxiv.org/pdf/2608.07418", "2608.07418"],
    ["https://export.arxiv.org/pdf/hep-th/9901001.pdf", "hep-th/9901001"],
  ];
  const suffixes = [
    "",
    "?",
    "?utm_source=chatgpt.com",
    "?ref=reader&download=1#page=2",
    "?tag=one&tag=two&flag&next=%2Fabs%2F2301.12345%3Fx%3D1%23intro",
    "#intro",
  ];
  const rules = buildRedirectRules();

  for (const [paperUrl, paperId] of paperUrls) {
    const rule = rules.find(({ condition }) => new RegExp(condition.regexFilter).test(paperUrl));
    assert.ok(rule, `No redirect rule matched ${paperUrl}`);

    const filter = new RegExp(rule.condition.regexFilter);
    // Chrome uses \1 for capture references, while String.replace uses $1.
    const substitution = rule.action.redirect.regexSubstitution.replace(/\\([1-9])/g, "$$$1");
    for (const suffix of suffixes) {
      const url = paperUrl + suffix;
      assert.equal(url.replace(filter, substitution), `https://www.alphaxiv.org/abs/${paperId}`, url);
    }
  }
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
