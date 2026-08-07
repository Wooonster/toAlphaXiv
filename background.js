import {
  ADOBE_EXTENSION_ID,
  adobeArxivPdfUrl,
  parseArxivUrl,
} from "./lib/arxiv.js";

const RULE_ABS = 1;
const RULE_HTML = 2;
const RULE_PDF = 3;
const RULE_PDF_EXT = 4;

/** Host pattern shared by DNR rules (RE2). */
const ARXIV_HOST = String.raw`https?://(?:www\.|export\.)?arxiv\.org`;

/**
 * Browser-native redirects — fastest path (no JS on navigation).
 * PDF→alphaXiv rules are toggled off when Adobe Acrobat is enabled.
 */
function buildStaticRules(adobeEnabled) {
  /** @type {chrome.declarativeNetRequest.Rule[]} */
  const rules = [
    {
      id: RULE_ABS,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          regexSubstitution: "https://www.alphaxiv.org/abs/\\1",
        },
      },
      condition: {
        regexFilter: `${ARXIV_HOST}/abs/([^?#]+)`,
        resourceTypes: ["main_frame"],
      },
    },
    {
      id: RULE_HTML,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          regexSubstitution: "https://www.alphaxiv.org/abs/\\1",
        },
      },
      condition: {
        regexFilter: `${ARXIV_HOST}/html/([^?#]+)`,
        resourceTypes: ["main_frame"],
      },
    },
  ];

  if (!adobeEnabled) {
    // Higher priority so `…/pdf/ID.pdf` does not capture the `.pdf` suffix.
    rules.push(
      {
        id: RULE_PDF_EXT,
        priority: 2,
        action: {
          type: "redirect",
          redirect: {
            regexSubstitution: "https://www.alphaxiv.org/abs/\\1",
          },
        },
        condition: {
          regexFilter: `${ARXIV_HOST}/pdf/([^?#]+)\\.pdf`,
          resourceTypes: ["main_frame"],
        },
      },
      {
        id: RULE_PDF,
        priority: 1,
        action: {
          type: "redirect",
          redirect: {
            regexSubstitution: "https://www.alphaxiv.org/abs/\\1",
          },
        },
        condition: {
          regexFilter: `${ARXIV_HOST}/pdf/([^?#]+)`,
          resourceTypes: ["main_frame"],
        },
      }
    );
  }

  return rules;
}

/** @type {boolean | null} */
let adobeEnabledCache = null;

async function isAdobeAcrobatEnabled() {
  if (adobeEnabledCache !== null) return adobeEnabledCache;

  try {
    const ext = await chrome.management.get(ADOBE_EXTENSION_ID);
    adobeEnabledCache = Boolean(ext?.enabled);
  } catch {
    adobeEnabledCache = false;
  }

  await chrome.storage.session.set({ adobeEnabled: adobeEnabledCache });
  return adobeEnabledCache;
}

const ALL_RULE_IDS = [RULE_ABS, RULE_HTML, RULE_PDF, RULE_PDF_EXT];

async function applyRedirectRules(adobeEnabled) {
  // Always remove our fixed IDs (removing missing IDs is a no-op).
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ALL_RULE_IDS,
    addRules: buildStaticRules(adobeEnabled),
  });
}

/** Serialize refreshes — onInstalled + SW boot used to race and duplicate rule IDs. */
let refreshChain = Promise.resolve(false);

/**
 * @returns {Promise<boolean>}
 */
function refreshAdobeState() {
  refreshChain = refreshChain
    .catch(() => false)
    .then(async () => {
      adobeEnabledCache = null;
      const enabled = await isAdobeAcrobatEnabled();
      await applyRedirectRules(enabled);
      return enabled;
    });
  return refreshChain;
}

chrome.runtime.onInstalled.addListener(() => {
  void refreshAdobeState();
});

chrome.runtime.onStartup.addListener(() => {
  void refreshAdobeState();
});

// Warm cache when the service worker starts (deduped via refreshChain).
void refreshAdobeState();

chrome.management.onEnabled.addListener((info) => {
  if (info.id === ADOBE_EXTENSION_ID) void refreshAdobeState();
});

chrome.management.onDisabled.addListener((info) => {
  if (info.id === ADOBE_EXTENSION_ID) void refreshAdobeState();
});

chrome.management.onInstalled.addListener((info) => {
  if (info.id === ADOBE_EXTENSION_ID) void refreshAdobeState();
});

chrome.management.onUninstalled.addListener((id) => {
  if (id === ADOBE_EXTENSION_ID) void refreshAdobeState();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "get-adobe-enabled") {
    isAdobeAcrobatEnabled()
      .then((adobeEnabled) => sendResponse({ adobeEnabled }))
      .catch(() => sendResponse({ adobeEnabled: false }));
    return true;
  }
});

/** Avoid redirect loops when we update the tab for Acrobat PDF. */
const pendingRedirects = new Set();

/**
 * Only used when Adobe is enabled: DNR cannot target chrome-extension://.
 * abs/html/pdf(no-Adobe) are handled by declarativeNetRequest.
 */
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  if (pendingRedirects.has(details.tabId)) {
    pendingRedirects.delete(details.tabId);
    return;
  }

  const adobeEnabled = await isAdobeAcrobatEnabled();
  if (!adobeEnabled) return;

  const parsed = parseArxivUrl(details.url);
  if (!parsed || parsed.kind !== "pdf") return;
  if (details.url.startsWith(`chrome-extension://${ADOBE_EXTENSION_ID}/`)) {
    return;
  }

  const target = adobeArxivPdfUrl(parsed.paperId);
  if (target === details.url) return;

  pendingRedirects.add(details.tabId);
  try {
    await chrome.tabs.update(details.tabId, { url: target });
  } catch {
    pendingRedirects.delete(details.tabId);
    // Fall back to raw PDF so Acrobat can intercept natively.
    pendingRedirects.add(details.tabId);
    try {
      await chrome.tabs.update(details.tabId, {
        url: `https://arxiv.org/pdf/${parsed.paperId}`,
      });
    } catch {
      pendingRedirects.delete(details.tabId);
    }
  }
});
