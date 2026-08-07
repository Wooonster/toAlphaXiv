# toAlphaXiv

Chrome extension that opens arXiv papers on [alphaXiv](https://www.alphaxiv.org) instead.

Chrome 扩展：打开 arXiv 论文时自动跳转到 [alphaXiv](https://www.alphaxiv.org)。

## Behavior / 行为

| Link / 链接 | Condition / 条件 | Destination / 目标 |
|-------------|------------------|-------------------|
| `arxiv.org/abs/{id}` | always / 始终 | `https://www.alphaxiv.org/abs/{id}` |
| `arxiv.org/html/{id}` | always / 始终 | `https://www.alphaxiv.org/abs/{id}` |
| `arxiv.org/pdf/{id}` | Adobe Acrobat **not** installed / **未**安装 | `https://www.alphaxiv.org/abs/{id}` |
| `arxiv.org/pdf/{id}` | Adobe Acrobat **enabled** / **已启用** | `chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://arxiv.org/pdf/{id}` |

Also matches `www.arxiv.org` and `export.arxiv.org`.  
Paper IDs: modern (`2301.12345`, optional `vN`) and legacy (`hep-th/9901001`).

同时匹配 `www.arxiv.org`、`export.arxiv.org`。  
支持新版 ID（`2301.12345`，可选 `vN`）与旧版 ID（`hep-th/9901001`）。

## Install / 安装

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this repository folder
4. Allow the **management** permission (used to detect Adobe Acrobat)

---

1. 打开 `chrome://extensions`
2. 开启 **开发者模式**
3. **加载已解压的扩展程序** → 选择本仓库目录
4. 允许 **管理扩展程序** 权限（用于检测 Adobe Acrobat）

## How it works / 原理

- **`declarativeNetRequest`**: redirects `/abs`, `/html`, and PDF (when Acrobat is off) at the browser network layer — no page JS on the hot path.
- **Content script**: sync click handling (`location.assign`) for new-tab / modifier clicks and Acrobat PDF targets that DNR cannot express.
- **Background**: caches Acrobat enablement in `storage.session`; when Acrobat is on, PDF navigations go through the Acrobat viewer URL.

---

- **`declarativeNetRequest`**：在浏览器网络层重定向 `/abs`、`/html`，以及未安装 Acrobat 时的 PDF，热路径不跑页面 JS。
- **Content script**：同步处理点击（`location.assign`），覆盖新标签 / 修饰键点击，以及 DNR 无法表达的 Acrobat PDF 目标。
- **Background**：将 Acrobat 启用状态缓存到 `storage.session`；启用 Acrobat 时，PDF 导航走 Acrobat 查看器 URL。

## Permissions / 权限

| Permission | Why / 用途 |
|------------|------------|
| `declarativeNetRequest` | Fast URL redirects / 快速 URL 重定向 |
| `management` | Detect Adobe Acrobat extension / 检测 Adobe Acrobat 扩展 |
| `storage` | Cache Acrobat state for sync clicks / 缓存 Acrobat 状态供同步点击 |
| `tabs` / `webNavigation` | Acrobat PDF navigation fallback / Acrobat PDF 导航兜底 |

## Development / 开发

Manifest V3. Reload the extension on `chrome://extensions` after edits.

Manifest V3。修改后在 `chrome://extensions` 重新加载扩展。

```
manifest.json
background.js      # DNR rules + Acrobat detection
content.js         # click interceptor
lib/arxiv.js       # URL parse / target builders
icons/
```
