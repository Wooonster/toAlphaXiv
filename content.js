/**
 * Click interceptor: sync redirect using a cached Adobe flag.
 * Main-frame navigations are primarily handled by declarativeNetRequest
 * (near-instant). This path avoids a round-trip for modified clicks /
 * Adobe PDF targets that DNR cannot express.
 */
(function () {
  const ADOBE_PREFIX =
    "chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/";

  const PAPER_ID_RE =
    /(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Za-z]{2})?\/\d{7})(?:v\d+)?/i;
  const PATH_RE = new RegExp(
    `^/(abs|html|pdf)/(${PAPER_ID_RE.source})(?:\\.pdf)?/?$`,
    "i"
  );

  /** @type {boolean} */
  let adobeEnabled = false;

  // Warm from session storage (filled by background on startup).
  try {
    chrome.storage.session.get("adobeEnabled", (result) => {
      if (typeof result?.adobeEnabled === "boolean") {
        adobeEnabled = result.adobeEnabled;
      }
    });
  } catch {
    /* ignore */
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "session" && changes.adobeEnabled) {
      adobeEnabled = Boolean(changes.adobeEnabled.newValue);
    }
  });

  // One-shot ask if storage was empty (SW may still be starting).
  try {
    chrome.runtime.sendMessage({ type: "get-adobe-enabled" }, (response) => {
      if (chrome.runtime.lastError) return;
      if (typeof response?.adobeEnabled === "boolean") {
        adobeEnabled = response.adobeEnabled;
      }
    });
  } catch {
    /* ignore */
  }

  /**
   * @param {string} href
   * @returns {{ kind: string, paperId: string } | null}
   */
  function parse(href) {
    if (!href) return null;
    try {
      const raw = href.startsWith(ADOBE_PREFIX)
        ? href.slice(ADOBE_PREFIX.length)
        : href;
      const url = new URL(raw, location.href);
      const host = url.hostname.replace(/^www\./, "");
      if (host !== "arxiv.org" && host !== "export.arxiv.org") return null;
      const match = decodeURIComponent(url.pathname).match(PATH_RE);
      if (!match) return null;
      return { kind: match[1].toLowerCase(), paperId: match[2] };
    } catch {
      return null;
    }
  }

  /**
   * @param {string} href
   * @returns {string | null}
   */
  function resolve(href) {
    const parsed = parse(href);
    if (!parsed) return null;
    if (parsed.kind === "pdf" && href.startsWith(ADOBE_PREFIX)) return null;
    if (parsed.kind === "pdf" && adobeEnabled) {
      return `${ADOBE_PREFIX}https://arxiv.org/pdf/${parsed.paperId}`;
    }
    return `https://www.alphaxiv.org/abs/${parsed.paperId}`;
  }

  /**
   * @param {MouseEvent} event
   */
  function onClick(event) {
    if (event.defaultPrevented) return;
    if (event.button !== 0 && event.button !== 1) return;

    const anchor =
      event.target instanceof Element
        ? event.target.closest("a[href]")
        : null;
    if (!anchor) return;

    const target = resolve(anchor.href);
    if (!target) return;

    const newTab =
      event.button === 1 ||
      event.metaKey ||
      event.ctrlKey ||
      anchor.target === "_blank";

    event.preventDefault();
    event.stopImmediatePropagation();

    if (newTab) {
      window.open(target, "_blank", "noopener");
    } else {
      // Sync navigation — no background round-trip.
      location.assign(target);
    }
  }

  document.addEventListener("click", onClick, true);
  document.addEventListener("auxclick", onClick, true);
})();
