# toAlphaXiv

[English](README.md) · [中文](README.zh-CN.md)

Chrome 扩展：打开 arXiv 论文时自动跳转到 [alphaXiv](https://www.alphaxiv.org)。

## 行为

| 链接 | 条件 | 目标 |
|------|------|------|
| `arxiv.org/abs/{id}` | 始终 | `https://www.alphaxiv.org/abs/{id}` |
| `arxiv.org/html/{id}` | 始终 | `https://www.alphaxiv.org/abs/{id}` |
| `arxiv.org/pdf/{id}` | 始终 | `https://www.alphaxiv.org/abs/{id}` |

同时匹配 `www.arxiv.org`、`export.arxiv.org`。  
支持新版 ID（`2301.12345`，可选 `vN`）与旧版 ID（`hep-th/9901001`）。
只重定向标签页顶层导航，嵌入式 iframe 保持不变。

## 安装

1. 打开 `chrome://extensions`
2. 开启 **开发者模式**
3. **加载已解压的扩展程序** → 选择本仓库目录
4. 修改代码后在扩展管理页重新加载

## 原理

- **`declarativeNetRequest`**：静态规则在浏览器加载扩展时就重定向 `/abs`、`/html` 和 PDF，热路径不需要唤醒 service worker。
- **Background**：只在 Acrobat wrapper URL 出现时做兜底替换；普通 arXiv URL 完全由静态 DNR 规则处理。

## 权限

| 权限 | 用途 |
|------|------|
| `declarativeNetRequest` | 快速静态 URL 重定向 |
| `tabs` / `webNavigation` | 捕获 Acrobat wrapper 导航 |

## 开发

Manifest V3。修改后在 `chrome://extensions` 重新加载扩展。

修改重定向规则后，重新生成静态规则并运行测试：

```bash
npm run generate-rules
npm test
```

```
manifest.json
background.js      # DNR 规则 + Acrobat 地址兜底
rules.json         # 静态浏览器原生重定向规则
lib/arxiv.js       # URL 解析 / 目标构造
lib/rules.js       # 严格的 DNR 规则生成
scripts/            # 静态规则生成脚本
test/               # URL 与 DNR 回归测试
icons/
```
