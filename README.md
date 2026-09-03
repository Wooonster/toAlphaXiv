# toAlphaXiv

[English](README.md) · [中文](README.zh-CN.md)

Chrome extension that opens arXiv papers on [alphaXiv](https://www.alphaxiv.org) instead.

## Behavior

| Link | Condition | Destination |
|------|-----------|-------------|
| `arxiv.org/abs/{id}` | always | `https://www.alphaxiv.org/abs/{id}` |
| `arxiv.org/html/{id}` | always | `https://www.alphaxiv.org/abs/{id}` |
| `arxiv.org/pdf/{id}` | always | `https://www.alphaxiv.org/abs/{id}` |

Also matches `www.arxiv.org` and `export.arxiv.org`.  
Paper IDs: modern (`2301.12345`, optional `vN`) and legacy (`hep-th/9901001`).
Only top-level tab navigations are redirected; embedded frames are left untouched.

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this repository folder
4. Reload the extension after code changes

## How it works

- **`declarativeNetRequest`**: static rules redirect `/abs`, `/html`, and PDF at browser startup — no service-worker work on the hot path.
- **Background**: only watches for Acrobat's wrapper URL as a fallback and replaces it with alphaXiv; normal arXiv URLs are handled entirely by static DNR rules.

## Permissions

| Permission | Why |
|------------|-----|
| `declarativeNetRequest` | Fast static URL redirects |
| `tabs` / `webNavigation` | Catch Acrobat wrapper navigations |

## Development

Manifest V3. Reload the extension on `chrome://extensions` after edits.

When changing redirect patterns, regenerate the checked-in static rules and run the test suite:

```bash
npm run generate-rules
npm test
```

```
manifest.json
background.js      # DNR rules + Acrobat-wrapper fallback
rules.json         # static browser-native redirect rules
lib/arxiv.js       # URL parse / target builders
lib/rules.js       # strict DNR rule generation
scripts/            # static rule generator
test/               # URL and DNR regression tests
icons/
```
