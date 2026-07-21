# Chat Code/Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在应用对话页右侧增加真实生成文件的只读代码查看器，并支持与网站预览切换。

**Architecture:** 新建独立 `AppCodeViewer` 组件负责文件标签、静态文件读取、行号、复制和错误状态；`AppChatPage` 只负责代码/预览模式与生成完成后的刷新信号。

**Tech Stack:** Vue 3、TypeScript、Ant Design Vue、Fetch API

## Global Constraints

- 不新增文件树。
- 不允许编辑或保存源码。
- 不新增后端接口或编辑器依赖。
- `html` 只展示 `index.html`。
- `multi_file` 展示 `index.html`、`style.css`、`script.js`。
- 默认展示预览；SSE 完成后预览与源码均刷新。

---

### Task 1: 只读代码查看器

**Files:**
- Create: `src/components/AppCodeViewer.vue`

**Interfaces:**
- Props: `baseUrl: string`、`codeGenType?: string`、`refreshKey: number`
- Produces: 文件标签、真实文件读取、行号、复制、加载与错误状态

- [ ] 创建组件，根据 `codeGenType` 计算文件列表：

```ts
const files = computed(() =>
  props.codeGenType === 'html'
    ? ['index.html']
    : ['index.html', 'style.css', 'script.js'],
)
```

- [ ] 使用 `fetch(`${baseUrl}${file}?t=${refreshKey}`, { credentials: 'include', cache: 'no-store' })` 读取文件，非 2xx 抛出错误。
- [ ] 监听 `baseUrl`、当前文件和 `refreshKey`，任一变化时重新读取。
- [ ] 使用行号列和 `<pre><code>` 展示只读源码，支持横向滚动。
- [ ] 复制按钮调用 `navigator.clipboard.writeText(sourceCode)` 并显示成功/失败消息。
- [ ] 运行 `npm run type-check`，预期通过。

### Task 2: 对话页集成切换

**Files:**
- Modify: `src/page/app/AppChatPage.vue`

**Interfaces:**
- Consumes: `AppCodeViewer`
- Produces: 顶部“代码/预览”切换与右侧模式渲染

- [ ] 增加 `rightMode = ref<'preview' | 'code'>('preview')`。
- [ ] 顶栏中间使用 `a-segmented`，选项为“代码”和“预览”。
- [ ] `rightMode === 'preview'` 时渲染现有 iframe；代码模式渲染：

```vue
<AppCodeViewer
  v-if="previewUrl"
  :base-url="previewUrl"
  :code-gen-type="app?.codeGenType"
  :refresh-key="previewKey"
/>
```

- [ ] SSE 完成后的 `loadApp()` 继续递增 `previewKey`，同时触发 iframe 与代码刷新。
- [ ] 调整桌面布局为左 34%、右 66%，移动端保持上下布局。
- [ ] 运行 `npm run build`，预期类型检查和 Vite 构建均通过。

## Self-Review

- 覆盖代码/预览切换、真实文件、文件标签、行号、复制、刷新和错误状态。
- 类型与组件接口一致。
- 无占位项、无新增后端能力、无编辑功能。
