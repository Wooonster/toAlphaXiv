import { PAPER_ID_SOURCE } from "./arxiv.js";

const ARXIV_HOST = String.raw`https?://(?:www\.|export\.)?arxiv\.org`;

// PAPER_ID_SOURCE is shared with lib/arxiv.js. The anchors are important:
// DNR regexes are matched against the complete URL but are not implicitly
// anchored, so an arXiv URL embedded in another site's query must not match.
const alphaXivRedirect = {
  type: "redirect",
  redirect: {
    regexSubstitution: "https://www.alphaxiv.org/abs/\\1",
  },
};

/**
 * Build the browser-native redirect rules.
 * @param {boolean} _unusedAdobeEnabled Kept for API compatibility.
 * @returns {chrome.declarativeNetRequest.Rule[]}
 */
export function buildRedirectRules(_unusedAdobeEnabled = false) {
  /** @type {chrome.declarativeNetRequest.Rule[]} */
  const rules = [
    {
      id: 1001,
      priority: 1,
      action: alphaXivRedirect,
      condition: {
        regexFilter: `^${ARXIV_HOST}/abs/(${PAPER_ID_SOURCE})(?:[?#]|$)`,
        resourceTypes: ["main_frame"],
      },
    },
    {
      id: 1002,
      priority: 1,
      action: alphaXivRedirect,
      condition: {
        regexFilter: `^${ARXIV_HOST}/html/(${PAPER_ID_SOURCE})(?:[?#]|$)`,
        resourceTypes: ["main_frame"],
      },
    },
  ];

  rules.push({
    id: 1003,
    priority: 1,
    action: alphaXivRedirect,
    condition: {
      regexFilter: `^${ARXIV_HOST}/pdf/(${PAPER_ID_SOURCE})(?:\\.pdf)?(?:[?#]|$)`,
      resourceTypes: ["main_frame"],
    },
  });

  return rules;
}

// Include the retired rule id 4 so upgrades remove the old `.pdf` rule.
export const ALL_RULE_IDS = [1, 2, 3, 4];
