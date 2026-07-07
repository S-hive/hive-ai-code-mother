# 全局基础布局设计规范

**日期：** 2026-07-07  
**状态：** 待审阅  
**范围：** `hive-ai-code-mother-frontend` 全局布局

## 背景与目标

为前端项目建立通用的上中下全局布局，使用 Ant Design Vue Layout 组件，支持路由切换内容区域，导航菜单通过配置文件驱动。

## 需求摘要

| 决策项 | 结论 |
|--------|------|
| 菜单项 | 仅「首页」（`/`），关于页不进菜单 |
| 页脚行为 | 粘性页脚：内容少时贴视口底部，内容多时随页面滚动 |
| 响应式 | 暂不处理小屏汉堡菜单 |
| 全局样式 | 删除 `main.css`，保留并单独引入 `base.css` |
| 网站标题 | AI 零代码应用生成平台（与 `index.html` 一致） |

## 架构方案

采用**独立菜单配置文件**（方案 A）：

- `src/config/menu.ts` 维护菜单项
- 组件读取配置渲染，与路由路径手动保持一致
- 结构清晰，后续扩展菜单只需修改配置文件

## 文件结构

```
hive-ai-code-mother-frontend/src/
├── config/
│   └── menu.ts              # 菜单配置
├── layouts/
│   └── BasicLayout.vue      # 上中下整体布局
├── components/
│   ├── GlobalHeader.vue     # 顶部导航栏
│   └── GlobalFooter.vue     # 底部版权
├── App.vue                  # 引入 BasicLayout（已存在）
└── main.ts                  # 移除 main.css，改为引入 base.css
```

## 组件设计

### BasicLayout.vue

使用 `a-layout` 实现上中下结构：

```
┌─────────────────────────────────────┐
│  GlobalHeader（a-layout-header）     │
├─────────────────────────────────────┤
│  Content（a-layout-content）         │
│  <router-view />                    │
├─────────────────────────────────────┤
│  GlobalFooter（a-layout-footer）     │
└─────────────────────────────────────┘
```

- 外层 `a-layout`：`min-height: 100vh`，flex 纵向排列
- `a-layout-content`：`flex: 1`，实现粘性页脚
- 内容区内边距：`padding: 24px`

### GlobalHeader.vue

```
┌──────────────────────────────────────────────────┐
│ [logo] 网站标题    首页          [ 登录 ]        │
└──────────────────────────────────────────────────┘
```

| 区域 | 实现 |
|------|------|
| 左侧 | `logo.png`（高度约 32px）+ 标题，点击跳转首页 |
| 中间 | `a-menu` 横向模式，从 `menu.ts` 读取配置 |
| 右侧 | `a-button type="primary"` 登录按钮占位 |
| 路由同步 | 根据 `route.path` 高亮菜单项，`router.push` 处理点击 |

### GlobalFooter.vue

- 内容：`by S-hive`，`S-hive` 链接至 `https://github.com/S-hive`（新标签页打开）
- 粘性页脚，非 `position: fixed`
- 居中、灰色小字（`#888`，14px）

### menu.ts

```ts
export interface MenuItem {
  key: string
  label: string
  path: string
}

export const menuItems: MenuItem[] = [
  { key: 'home', label: '首页', path: '/' },
]
```

## 样式策略

| 项目 | 处理方式 |
|------|----------|
| `main.css` | 删除文件，移除 `main.ts` 引用 |
| `base.css` | 保留，在 `main.ts` 单独引入 |
| Ant Design | 继续使用 `ant-design-vue/dist/reset.css` |
| 组件样式 | 各组件 `<style scoped>` 内编写 |
| Header | 白底 + 底部细边框，flex 左中右三区 |
| Content | 浅灰背景 `#f5f5f5` |
| Footer | 白底 + 顶部细边框 |

## 变更清单

| 操作 | 文件 |
|------|------|
| 新增 | `src/config/menu.ts` |
| 新增 | `src/layouts/BasicLayout.vue` |
| 新增 | `src/components/GlobalHeader.vue` |
| 新增 | `src/components/GlobalFooter.vue` |
| 修改 | `src/main.ts` |
| 删除 | `src/assets/main.css` |

## 不在本次范围

- 小屏汉堡菜单响应式
- 登录功能实现
- 关于页菜单入口
- 页面内容（`HomeView` 等）改造

## 验证方式

1. `npm run dev` 启动前端
2. 确认上中下布局正常，页脚在内容少时贴底
3. 点击「首页」菜单和 Logo 可跳转 `/`
4. 页脚 `S-hive` 链接可打开 GitHub
5. `npm run type-check` 无类型错误
