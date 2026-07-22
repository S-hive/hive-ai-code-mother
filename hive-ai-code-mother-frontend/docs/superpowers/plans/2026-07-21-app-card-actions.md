# App Card Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为所有应用卡片增加统一的“查看对话 / 查看作品”悬浮操作。

**Architecture:** 部署地址使用独立工具函数构造；共享 `AppCard` 组件负责悬浮遮罩和按钮事件，因此我的作品与精选案例自动保持一致。

**Tech Stack:** Vue 3、TypeScript、Vue Router、Ant Design Vue

## Global Constraints

- 卡片主体继续进入对话页。
- 查看对话始终显示。
- 查看作品仅在 `deployKey` 非空时显示。
- 部署地址严格为 `http://localhost/{deployKey}`。
- 不修改生成预览地址逻辑。

---

### Task 1: 独立部署地址构造

**Files:**
- Modify: `src/utils/appPreview.ts`

- [ ] 导出：

```ts
export function buildAppDeployUrl(deployKey: string): string {
  return `http://localhost/${encodeURIComponent(deployKey)}`
}
```

- [ ] 保持 `buildAppPreviewUrl` 不变。
- [ ] 运行 `npm run type-check`，预期通过。

### Task 2: 卡片悬浮操作

**Files:**
- Modify: `src/components/AppCard.vue`

- [ ] 封面区域增加悬浮遮罩。
- [ ] “查看对话”调用现有 `goChat`，始终展示。
- [ ] “查看作品”使用 `v-if="app.deployKey"`，调用 `window.open(buildAppDeployUrl(app.deployKey), '_blank', 'noopener,noreferrer')`。
- [ ] 两个按钮使用 `@click.stop`，避免触发卡片主体点击。
- [ ] 遮罩默认隐藏，hover 时淡入；按钮纵向排列并符合参考图视觉。
- [ ] 运行 `npm run build`，预期通过。

## Self-Review

- 两种卡片变体共享同一组件，无重复逻辑。
- 部署地址和预览地址函数独立。
- 未部署应用不会出现查看作品按钮。
