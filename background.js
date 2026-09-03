import {
  ADOBE_WRAPPER_PREFIX,
  alphaxivAbsUrl,
  parseArxivUrl,
} from "./lib/arxiv.js";
import { ALL_RULE_IDS } from "./lib/rules.js";
// Static rules are active as soon as Chrome loads the extension. Remove only
// the dynamic IDs used by versions <=1.2 during an upgrade.
chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ALL_RULE_IDS,
    addRules: [],
  }).catch((error) => {
    console.warn("toAlphaXiv: failed to remove legacy rules", error);
  });
});

// Acrobat can rewrite a clicked PDF into its own chrome-extension:// URL
// before DNR sees it. Intercept that navigation and send it directly to the
// alphaXiv abstract page instead of touching Acrobat's blocked internal URL.
const pendingRedirects = new Map();
const PENDING_REDIRECT_TTL_MS = 10000;
const PDF_URL_PREFIXES = [
  "http://arxiv.org/pdf/",
  "https://arxiv.org/pdf/",
  "http://www.arxiv.org/pdf/",
  "https://www.arxiv.org/pdf/",
  "http://export.arxiv.org/pdf/",
  "https://export.arxiv.org/pdf/",
];

function isPotentialPdfNavigation(url) {
  return (
    url.startsWith(ADOBE_WRAPPER_PREFIX) ||
    PDF_URL_PREFIXES.some((prefix) => url.startsWith(prefix))
  );
}

function markPendingRedirect(tabId) {
  const previous = pendingRedirects.get(tabId);
  if (previous) clearTimeout(previous);
  const timer = setTimeout(() => pendingRedirects.delete(tabId), PENDING_REDIRECT_TTL_MS);
  pendingRedirects.set(tabId, timer);
}

function consumePendingRedirect(tabId) {
  const timer = pendingRedirects.get(tabId);
  if (!timer) return false;
  clearTimeout(timer);
  pendingRedirects.delete(tabId);
  return true;
}

chrome.tabs.onRemoved.addListener((tabId) => {
  consumePendingRedirect(tabId);
});

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  if (consumePendingRedirect(details.tabId)) return;
  if (!isPotentialPdfNavigation(details.url)) return;

  const parsed = parseArxivUrl(details.url);
  if (!parsed || parsed.kind !== "pdf") return;

  const isAcrobatWrapper = details.url.startsWith(ADOBE_WRAPPER_PREFIX);
  const target = alphaxivAbsUrl(parsed.paperId);
  if (!isAcrobatWrapper && target === details.url) return;

  markPendingRedirect(details.tabId);
  try {
    await chrome.tabs.update(details.tabId, { url: target });
  } catch {
    consumePendingRedirect(details.tabId);
  }
});

// Some Chrome versions do not deliver webNavigation events for blocked
// chrome-extension:// pages. tabs.onUpdated still exposes the attempted URL,
// so keep a second, lightweight guard for Acrobat's wrapper URL.
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  const url = changeInfo.url;
  if (!url || !url.startsWith(ADOBE_WRAPPER_PREFIX)) return;
  if (pendingRedirects.has(tabId)) return;

  const parsed = parseArxivUrl(url);
  if (!parsed || parsed.kind !== "pdf") return;

  markPendingRedirect(tabId);
  void chrome.tabs.update(tabId, { url: alphaxivAbsUrl(parsed.paperId) }).catch(() => {
    consumePendingRedirect(tabId);
  });
});
