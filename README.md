# arXiv → alphaXiv

Chrome 扩展：打开 / 点击 arXiv 链接时跳转到 alphaXiv。

## 行为

| 链接 | 条件 | 目标 |
|------|------|------|
| `/abs/{id}`、`/html/{id}` | 始终 | `https://www.alphaxiv.org/abs/{id}` |
| `/pdf/{id}` | 无 Adobe Acrobat | 同上 |
| `/pdf/{id}` | 已启用 Acrobat | Acrobat 查看器包装的 arXiv PDF |

## 性能

- `abs` / `html`（以及无 Acrobat 时的 `pdf`）走 **declarativeNetRequest**，在浏览器网络层重定向，不经过页面 JS。
- 点击路径在 content script 内 **同步** `location.assign`，不等待 background。
- Acrobat 启用状态缓存在 `storage.session`，启动时预热。

## 安装

1. 打开 `chrome://extensions`
2. 开启「开发者模式」
3. 「加载已解压的扩展程序」→ 选择本目录
4. 允许「管理扩展程序」权限（用于检测 Acrobat）
