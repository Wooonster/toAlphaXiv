# toAlphaXiv

[English](README.md) · [中文](README.zh-CN.md)

Chrome 扩展：打开 arXiv 论文时自动跳转到 [alphaXiv](https://www.alphaxiv.org)。

## 行为

| 链接 | 条件 | 目标 |
|------|------|------|
| `arxiv.org/abs/{id}` | 始终 | `https://www.alphaxiv.org/abs/{id}` |
| `arxiv.org/html/{id}` | 始终 | `https://www.alphaxiv.org/abs/{id}` |
| `arxiv.org/pdf/{id}` | **未**安装 Adobe Acrobat | `https://www.alphaxiv.org/abs/{id}` |
| `arxiv.org/pdf/{id}` | **已启用** Adobe Acrobat | `chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/https://arxiv.org/pdf/{id}` |

同时匹配 `www.arxiv.org`、`export.arxiv.org`。  
支持新版 ID（`2301.12345`，可选 `vN`）与旧版 ID（`hep-th/9901001`）。

## 安装

1. 打开 `chrome://extensions`
2. 开启 **开发者模式**
3. **加载已解压的扩展程序** → 选择本仓库目录
4. 允许 **管理扩展程序** 权限（用于检测 Adobe Acrobat）

## 原理

- **`declarativeNetRequest`**：在浏览器网络层重定向 `/abs`、`/html`，以及未安装 Acrobat 时的 PDF，热路径不跑页面 JS。
- **Content script**：同步处理点击（`location.assign`），覆盖新标签 / 修饰键点击，以及 DNR 无法表达的 Acrobat PDF 目标。
- **Background**：将 Acrobat 启用状态缓存到 `storage.session`；启用 Acrobat 时，PDF 导航走 Acrobat 查看器 URL。

## 权限

| 权限 | 用途 |
|------|------|
| `declarativeNetRequest` | 快速 URL 重定向 |
| `management` | 检测 Adobe Acrobat 扩展 |
| `storage` | 缓存 Acrobat 状态，供同步点击使用 |
| `tabs` / `webNavigation` | Acrobat PDF 导航兜底 |

## 开发

Manifest V3。修改后在 `chrome://extensions` 重新加载扩展。

```
manifest.json
background.js      # DNR 规则 + Acrobat 检测
content.js         # 点击拦截
lib/arxiv.js       # URL 解析 / 目标构造
icons/
```
