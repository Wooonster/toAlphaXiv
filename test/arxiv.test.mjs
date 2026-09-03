import test from "node:test";
import assert from "node:assert/strict";
import { parseArxivUrl, resolveRedirectSync } from "../lib/arxiv.js";

test("parses supported arXiv URL forms", () => {
  assert.equal(parseArxivUrl("https://www.arxiv.org/abs/2301.12345?v=1")?.paperId, "2301.12345");
  assert.equal(parseArxivUrl("https://export.arxiv.org/pdf/hep-th/9901001.pdf")?.kind, "pdf");
  assert.equal(parseArxivUrl("https://arxiv.org/abs/2301.12345/extra"), null);
});

test("PDF redirects to alphaXiv regardless of Acrobat", () => {
  const url = "https://arxiv.org/pdf/2606.18023.pdf";
  assert.equal(resolveRedirectSync(url, true), "https://www.alphaxiv.org/abs/2606.18023");
  assert.equal(resolveRedirectSync(url, false), "https://www.alphaxiv.org/abs/2606.18023");
});

test("parses Acrobat's wrapped PDF URL", () => {
  assert.equal(
    parseArxivUrl(
      "chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://arxiv.org/pdf/2607.16051"
    )?.paperId,
    "2607.16051"
  );
});
