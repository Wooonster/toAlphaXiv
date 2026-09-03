/** @typedef {"abs" | "html" | "pdf"} ArxivKind */

/**
 * arXiv paper id: modern (2301.12345[vN]) or legacy (hep-th/9901001[vN]).
 * @type {RegExp}
 */
export const PAPER_ID_SOURCE =
  String.raw`(?:\d{4}\.\d{4,5}(?:v\d+)?|[a-z-]+(?:\.[A-Za-z]{2})?/\d{7}(?:v\d+)?)`;

export const PAPER_ID_RE = new RegExp(PAPER_ID_SOURCE, "i");

const ARXIV_PATH_RE = new RegExp(
  String.raw`^/(abs|html|pdf)/(${PAPER_ID_SOURCE})(?:\.pdf)?/?$`,
  "i"
);

export const ADOBE_EXTENSION_ID = "efaidnbmnnnibpcajpcglclefindmkaj";

export const ADOBE_WRAPPER_PREFIX =
  `chrome-extension://${ADOBE_EXTENSION_ID}/`;

/**
 * @param {string} urlString
 * @returns {{ kind: ArxivKind, paperId: string, href: string } | null}
 */
export function parseArxivUrl(urlString) {
  if (!urlString) return null;

  let raw = urlString.trim();

  if (raw.startsWith(ADOBE_WRAPPER_PREFIX)) {
    raw = raw.slice(ADOBE_WRAPPER_PREFIX.length);
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  if (host !== "arxiv.org" && host !== "export.arxiv.org") {
    return null;
  }

  const path = decodeURIComponent(url.pathname);
  const match = path.match(ARXIV_PATH_RE);
  if (!match) return null;

  const kind = /** @type {ArxivKind} */ (match[1].toLowerCase());
  const paperId = match[2];

  return { kind, paperId, href: url.href };
}

/**
 * @param {string} paperId
 * @returns {string}
 */
export function alphaxivAbsUrl(paperId) {
  return `https://www.alphaxiv.org/abs/${paperId}`;
}

/**
 * @param {string} url
 * @param {boolean} _adobeEnabled Kept for API compatibility.
 * @returns {string | null}
 */
export function resolveRedirectSync(url, _adobeEnabled) {
  const parsed = parseArxivUrl(url);
  if (!parsed) return null;

  return alphaxivAbsUrl(parsed.paperId);
}
