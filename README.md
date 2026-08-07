# toAlphaXiv

[English](README.md) · [中文](README.zh-CN.md)

Chrome extension that opens arXiv papers on [alphaXiv](https://www.alphaxiv.org) instead.

## Behavior

| Link | Condition | Destination |
|------|-----------|-------------|
| `arxiv.org/abs/{id}` | always | `https://www.alphaxiv.org/abs/{id}` |
| `arxiv.org/html/{id}` | always | `https://www.alphaxiv.org/abs/{id}` |
| `arxiv.org/pdf/{id}` | Adobe Acrobat **not** installed | `https://www.alphaxiv.org/abs/{id}` |
| `arxiv.org/pdf/{id}` | Adobe Acrobat **enabled** | `chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://arxiv.org/pdf/{id}` |

Also matches `www.arxiv.org` and `export.arxiv.org`.  
Paper IDs: modern (`2301.12345`, optional `vN`) and legacy (`hep-th/9901001`).

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this repository folder
4. Allow the **management** permission (used to detect Adobe Acrobat)

## How it works

- **`declarativeNetRequest`**: redirects `/abs`, `/html`, and PDF (when Acrobat is off) at the browser network layer — no page JS on the hot path.
- **Content script**: sync click handling (`location.assign`) for new-tab / modifier clicks and Acrobat PDF targets that DNR cannot express.
- **Background**: caches Acrobat enablement in `storage.session`; when Acrobat is on, PDF navigations go through the Acrobat viewer URL.

## Permissions

| Permission | Why |
|------------|-----|
| `declarativeNetRequest` | Fast URL redirects |
| `management` | Detect Adobe Acrobat extension |
| `storage` | Cache Acrobat state for sync clicks |
| `tabs` / `webNavigation` | Acrobat PDF navigation fallback |

## Development

Manifest V3. Reload the extension on `chrome://extensions` after edits.

```
manifest.json
background.js      # DNR rules + Acrobat detection
content.js         # click interceptor
lib/arxiv.js       # URL parse / target builders
icons/
```
