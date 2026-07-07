# 全局基础布局 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `hive-ai-code-mother-frontend` 中实现 Ant Design Vue 驱动的上中下全局布局（Header / Content / Footer），菜单配置化，替换 Vue 脚手架默认样式。

**Architecture:** 独立 `menu.ts` 配置驱动 `GlobalHeader` 中的 `a-menu`；`BasicLayout.vue` 用 `a-layout` 组合 `GlobalHeader`、`<router-view />`、`GlobalFooter`；通过 flex + `min-height: 100vh` 实现粘性页脚。全局样式仅保留 `base.css` 与 Ant Design reset。

**Tech Stack:** Vue 3, TypeScript, Vue Router, Ant Design Vue 4, Vite 7

**Spec:** `docs/superpowers/specs/2026-07-07-basic-layout-design.md`

**Note on testing:** 项目尚无 Vitest/组件测试框架。各 Task 以 `npm run type-check` 作为自动化门禁，`npm run build` 作为最终集成验证，视觉行为按 spec 手动检查。

---

## File Map

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/config/menu.ts` | 新增 | 菜单项类型与配置数组 |
| `src/components/GlobalFooter.vue` | 新增 | 版权页脚 |
| `src/components/GlobalHeader.vue` | 新增 | Logo、标题、菜单、登录按钮 |
| `src/layouts/BasicLayout.vue` | 新增 | 上中下布局骨架 |
| `src/main.ts` | 修改 | `main.css` → `base.css` |
| `src/assets/main.css` | 删除 | 移除脚手架默认布局样式 |
| `src/App.vue` | 无需修改 | 已引用 `BasicLayout` |

---

### Task 1: 切换全局样式入口

**Files:**
- Modify: `hive-ai-code-mother-frontend/src/main.ts`
- Delete: `hive-ai-code-mother-frontend/src/assets/main.css`

- [ ] **Step 1: 确认 type-check 当前状态（基线）**

```bash
cd hive-ai-code-mother-frontend
npm run type-check
```

Expected: FAIL — `Cannot find module '@/layouts/BasicLayout.vue'`（`App.vue` 已引用但文件不存在）

- [ ] **Step 2: 修改 main.ts，将 main.css 替换为 base.css**

将 `hive-ai-code-mother-frontend/src/main.ts` 第一行改为：

```typescript
import './assets/base.css'
```

完整文件应为：

```typescript
import './assets/base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Antd)

app.mount('#app')
```

- [ ] **Step 3: 删除 main.css**

```bash
rm hive-ai-code-mother-frontend/src/assets/main.css
```

Windows PowerShell:

```powershell
Remove-Item hive-ai-code-mother-frontend/src/assets/main.css
```

- [ ] **Step 4: 验证无残留引用**

```bash
cd hive-ai-code-mother-frontend
rg "main\.css" src/
```

Expected: 无匹配结果

- [ ] **Step 5: Commit**

```bash
git add hive-ai-code-mother-frontend/src/main.ts hive-ai-code-mother-frontend/src/assets/main.css
git commit -m "refactor(frontend): replace main.css with base.css global styles"
```

---

### Task 2: 创建菜单配置

**Files:**
- Create: `hive-ai-code-mother-frontend/src/config/menu.ts`

- [ ] **Step 1: 创建 menu.ts**

```typescript
export interface MenuItem {
  key: string
  label: string
  path: string
}

export const menuItems: MenuItem[] = [
  { key: 'home', label: '首页', path: '/' },
]
```

- [ ] **Step 2: 验证类型检查通过（menu 模块本身）**

```bash
cd hive-ai-code-mother-frontend
npm run type-check
```

Expected: 仍 FAIL（`BasicLayout.vue` 缺失），但无 `menu.ts` 相关错误

- [ ] **Step 3: Commit**

```bash
git add hive-ai-code-mother-frontend/src/config/menu.ts
git commit -m "feat(frontend): add configurable menu items"
```

---

### Task 3: 创建 GlobalFooter 组件

**Files:**
- Create: `hive-ai-code-mother-frontend/src/components/GlobalFooter.vue`

- [ ] **Step 1: 创建 GlobalFooter.vue**

```vue
<script setup lang="ts"></script>

<template>
  <a-layout-footer class="global-footer">
    by
    <a href="https://github.com/S-hive" target="_blank" rel="noopener noreferrer"> S-hive </a>
  </a-layout-footer>
</template>

<style scoped>
.global-footer {
  text-align: center;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  color: #888;
  font-size: 14px;
  padding: 16px 24px;
}

.global-footer a {
  color: #888;
}

.global-footer a:hover {
  color: #1677ff;
}
</style>
```

- [ ] **Step 2: 验证类型检查**

```bash
cd hive-ai-code-mother-frontend
npm run type-check
```

Expected: 仍 FAIL（`BasicLayout.vue` 缺失），无 `GlobalFooter.vue` 相关错误

- [ ] **Step 3: Commit**

```bash
git add hive-ai-code-mother-frontend/src/components/GlobalFooter.vue
git commit -m "feat(frontend): add GlobalFooter with S-hive credit link"
```

---

### Task 4: 创建 GlobalHeader 组件

**Files:**
- Create: `hive-ai-code-mother-frontend/src/components/GlobalHeader.vue`

- [ ] **Step 1: 创建 GlobalHeader.vue**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface'
import { menuItems } from '@/config/menu'
import logoUrl from '@/assets/logo.png'

const SITE_TITLE = 'AI 零代码应用生成平台'

const route = useRoute()
const router = useRouter()

const selectedKeys = computed(() => {
  const match = menuItems.find((item) => item.path === route.path)
  return match ? [match.key] : []
})

const handleMenuClick = (info: MenuInfo) => {
  const item = menuItems.find((m) => m.key === info.key)
  if (item) {
    router.push(item.path)
  }
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <a-layout-header class="global-header">
    <div class="header-left" @click="goHome">
      <img :src="logoUrl" alt="logo" class="logo" />
      <span class="site-title">{{ SITE_TITLE }}</span>
    </div>
    <a-menu
      mode="horizontal"
      :selected-keys="selectedKeys"
      class="header-menu"
      @click="handleMenuClick"
    >
      <a-menu-item v-for="item in menuItems" :key="item.key">
        {{ item.label }}
      </a-menu-item>
    </a-menu>
    <div class="header-right">
      <a-button type="primary">登录</a-button>
    </div>
  </a-layout-header>
</template>

<style scoped>
.global-header {
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  height: 64px;
  line-height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
}

.logo {
  height: 32px;
  margin-right: 12px;
}

.site-title {
  font-size: 18px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
  white-space: nowrap;
}

.header-menu {
  flex: 1;
  min-width: 0;
  margin-left: 24px;
  border-bottom: none;
  background: transparent;
}

.header-right {
  flex-shrink: 0;
  margin-left: 24px;
}
</style>
```

- [ ] **Step 2: 验证类型检查**

```bash
cd hive-ai-code-mother-frontend
npm run type-check
```

Expected: 仍 FAIL（`BasicLayout.vue` 缺失），无 `GlobalHeader.vue` 相关错误

> 若 `MenuInfo` 导入路径报错，改用内联类型：`(info: { key: string }) => { ... }`

- [ ] **Step 3: Commit**

```bash
git add hive-ai-code-mother-frontend/src/components/GlobalHeader.vue
git commit -m "feat(frontend): add GlobalHeader with logo, menu, and login button"
```

---

### Task 5: 创建 BasicLayout 布局

**Files:**
- Create: `hive-ai-code-mother-frontend/src/layouts/BasicLayout.vue`

- [ ] **Step 1: 创建 BasicLayout.vue**

```vue
<script setup lang="ts">
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
</script>

<template>
  <a-layout class="basic-layout">
    <GlobalHeader />
    <a-layout-content class="main-content">
      <router-view />
    </a-layout-content>
    <GlobalFooter />
  </a-layout>
</template>

<style scoped>
.basic-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 24px;
  background: #f5f5f5;
}
</style>
```

- [ ] **Step 2: 运行 type-check 验证全部通过**

```bash
cd hive-ai-code-mother-frontend
npm run type-check
```

Expected: PASS（exit code 0）

- [ ] **Step 3: Commit**

```bash
git add hive-ai-code-mother-frontend/src/layouts/BasicLayout.vue
git commit -m "feat(frontend): add BasicLayout with header, content, and footer"
```

---

### Task 6: 最终集成验证

**Files:**
- 无新文件

- [ ] **Step 1: 生产构建验证**

```bash
cd hive-ai-code-mother-frontend
npm run build
```

Expected: PASS，输出 `dist/` 目录

- [ ] **Step 2: 启动开发服务器**

```bash
cd hive-ai-code-mother-frontend
npm run dev
```

Expected: 本地 URL 可访问（通常 `http://localhost:5173`）

- [ ] **Step 3: 手动视觉检查清单**

| 检查项 | 预期 |
|--------|------|
| 页面结构 | 上方导航栏、中间内容区、下方页脚 |
| 导航栏左侧 | 显示 logo.png 与「AI 零代码应用生成平台」 |
| 导航栏菜单 | 仅显示「首页」，当前路由为 `/` 时高亮 |
| 导航栏右侧 | 显示蓝色「登录」按钮 |
| Logo/标题点击 | 跳转至 `/` |
| 内容区 | 显示 `HomeView` 内容，背景 `#f5f5f5` |
| 页脚 | 居中显示 `by S-hive`，链接指向 GitHub |
| 粘性页脚 | 内容少时页脚贴在视口底部，非悬浮遮挡 |
| 脚手架样式 | `#app` 无 `max-width: 1280px` 居中限制 |

- [ ] **Step 4: 运行 lint（可选但推荐）**

```bash
cd hive-ai-code-mother-frontend
npm run lint
```

Expected: PASS 或仅与本次无关的既有 warning

---

## Spec Coverage Checklist

| Spec 要求 | 对应 Task |
|-----------|-----------|
| `layouts/BasicLayout.vue` + App.vue 引入 | Task 5（App.vue 已引入） |
| 移除 `main.css` 及引用 | Task 1 |
| 保留 `base.css` 单独引入 | Task 1 |
| 上中下 `a-layout` 结构 | Task 5 |
| `GlobalHeader` 独立组件 | Task 4 |
| Logo + 标题 + Menu + 登录按钮 | Task 4 |
| 菜单配置化 | Task 2 + Task 4 |
| 仅「首页」菜单项 | Task 2 |
| `<router-view />` 内容区 | Task 5 |
| `GlobalFooter` 独立组件 | Task 3 |
| 粘性页脚 + S-hive 链接 | Task 3 + Task 5 |
| `npm run type-check` 验证 | Task 5, Task 6 |

## Self-Review Notes

- 所有步骤均含完整代码，无 TBD/TODO
- 类型名 `MenuItem`、`MenuInfo` 在 Task 2 与 Task 4 间一致
- 未引入 Vitest（YAGNI，spec 未要求）
- 小屏响应式、登录功能、HomeView 改造均不在范围
