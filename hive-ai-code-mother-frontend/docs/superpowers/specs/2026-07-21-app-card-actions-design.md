# 应用卡片悬浮操作设计

日期：2026-07-21

## 目标

统一主页“我的作品”和“精选案例”的应用卡片交互。

## 交互

- 点击卡片主体继续跳转 `/app/chat/{appId}`。
- 鼠标悬浮封面时显示半透明操作遮罩。
- “查看对话”始终显示，点击后进入应用对话页。
- 仅当 `deployKey` 非空时显示“查看作品”。
- “查看作品”在新页面打开 `http://localhost/{deployKey}`。
- 两个按钮阻止事件冒泡，避免同时触发卡片主体点击。

## 地址约束

- 部署作品地址：`http://localhost/{deployKey}`。
- 生成网站预览地址仍为：
  `http://localhost:8123/api/static/{codeGenType}_{appId}/`。
- 两类地址使用独立构造函数，不得混用。

## 实现范围

- 修改 `AppCard.vue`，两种卡片变体共享相同悬浮操作。
- 在 `appPreview.ts` 增加独立的 `buildAppDeployUrl(deployKey)`。
- 不修改应用列表接口、预览 iframe 或部署接口。

## 验收

- 我的作品与精选案例悬浮行为一致。
- 未部署应用只显示“查看对话”。
- 已部署应用显示两个按钮。
- 查看作品新窗口地址严格为 `http://localhost/{deployKey}`。
