# 应用前后端页面设计

日期：2026-07-21  
范围：主页、应用生成对话页、应用管理页、应用信息修改页  
技术栈：Vue 3 + Ant Design Vue + Pinia + Vue Router（沿用现有风格）

## 1. 目标

用户可通过提示词创建应用、与 AI 对话生成网站、预览效果、部署、管理个人应用与查看精选应用；管理员可管理全站应用。

## 2. 已确认决策

| 项 | 决策 |
|----|------|
| 实现结构 | 页面为主 + 少量复用组件 |
| 部署接口 | 前端手写 `POST /app/deploy`（OpenAPI 暂未生成） |
| 对话页布局 | 独立顶栏；隐藏全局 Header/Footer |
| 上传/优化 | 仅 UI，点击提示「功能开发中」 |
| 卡片点击 | 统一进入 `/app/chat/:appId` |
| 再次打开应用 | 不自动 SSE；有 `codeGenType` 则直接预览 |

## 3. 路由与布局

| 路由 | 页面 | 权限 | 布局 |
|------|------|------|------|
| `/` | 主页 | 公开；创建需登录 | 全局 Header + Footer |
| `/app/chat/:appId` | 对话页 | 登录；权限由后端校验 | 全屏自有顶栏 |
| `/app/edit/:appId` | 应用编辑页 | 登录；用户仅改自己的 | 全局布局 |
| `/admin/appManage` | 应用管理页 | 仅管理员 | 全局布局 |

配套：

- `menu.ts` 增加「应用管理」→ `/admin/appManage`（沿用现有 admin 菜单过滤）
- `BasicLayout` 根据路由 meta（如 `hideLayout: true`）隐藏 Header/Footer
- `/admin/*` 继续走现有 `access.ts` 守卫

## 4. 页面设计

### 4.1 主页 `/`

自上而下：

1. **Hero**：标题「一句话 + logo + 呈所想」、副标题、中央提示词输入框
2. **输入框**：上传/优化（占位）、发送；下方快捷标签（仅填入输入框，不直接提交）
3. **我的作品**：登录后 `listMyAppVoByPage`（可按名称搜，pageSize≤20）；卡片含封面、名称、相对时间
4. **精选案例**：`listGoodAppVoByPage`（可按名称搜，pageSize≤20）；卡片含封面、作者、名称、类型标签

创建流程：

1. 未登录 → 跳转 `/user/login`
2. 已登录 → `addApp({ initPrompt })` → 得 `appId`
3. `router.push(/app/chat/:appId?init=1)`

### 4.2 对话页 `/app/chat/:appId`

布局：

- 顶栏：左应用名（可回主页），右「部署」
- 左栏：消息列表（用户右、AI 左）+ 底部输入
- 右栏：iframe 预览（SSE 全部结束后展示/刷新）

进入逻辑：

1. `getAppVoById(appId)` 加载应用信息
2. `init=1`：展示 `initPrompt` 为用户消息并自动 SSE；结束后移除 query，避免刷新重复生成
3. 无 `init`：不自动发消息；若已有 `codeGenType`，右侧直接预览

SSE：

- `GET http://localhost:8123/api/app/chat/gen/code?appId=&message=`（携带 cookie）
- 解析 `data: {"d":"..."}` 追加 AI 内容；`event: done` 结束
- 生成中禁用发送；结束后刷新预览

预览 URL：

```
http://localhost:8123/api/static/{codeGenType}_{appId}/
```

部署：

- 手写 `deployApp({ appId })` → `POST /app/deploy`
- 成功弹窗展示返回的可访问 URL（可复制/打开）

### 4.3 应用管理页 `/admin/appManage`

风格对齐 `UserManagePage`：

- 搜索 + 表格 + 分页
- `listAppVoByPageByAdmin`
- 列：id、名称、封面、生成类型、优先级、用户、创建时间、操作
- 操作：
  - 编辑 → `/app/edit/:appId`
  - 删除 → `deleteAppByAdmin`（二次确认）
  - 精选 → `updateAppByAdmin({ id, priority: 99 })`（二次确认）

### 4.4 应用编辑页 `/app/edit/:appId`

- 拉详情：用户 `getAppVoById`；管理员可用 `getAppVoByIdByAdmin`
- 普通用户：仅改 `appName` → `updateApp`
- 管理员：`appName` + `cover` + `priority` → `updateAppByAdmin`
- 成功后提示并返回上一页

## 5. 组件与工具

| 单元 | 职责 |
|------|------|
| `AppPromptInput` | 提示词输入骨架（主页/对话复用） |
| `AppCard` | 应用卡片（我的作品 / 精选两种变体） |
| `utils/sse.ts`（或同类） | EventSource/流式解析，统一错误处理 |
| `deployApp`（手写 API） | `POST /app/deploy`，返回 URL |

## 6. 数据流（创建 → 生成 → 预览 → 部署）

```
主页输入 initPrompt
  → addApp → appId
  → /app/chat/:appId?init=1
  → chatToGenCode SSE
  → done → iframe 预览 static/{codeGenType}_{appId}/
  → 用户点部署 → deployApp → 展示 URL
```

## 7. 错误处理

- REST 失败：`message.error`
- SSE 失败：消息区展示错误，恢复发送按钮
- 删除/精选：二次确认
- 无权限：展示后端错误信息

## 8. 非目标（本期不做）

- 上传/优化真实功能
- 对话历史持久化拉取（无后端接口）
- 精选案例独立预览页
- 后端 Controller 实现（仅前端按约定对接部署）

## 9. 文件清单（预期）

- `src/page/HomePage.vue`（重写）
- `src/page/app/AppChatPage.vue`
- `src/page/app/AppEditPage.vue`
- `src/page/admin/AppManagePage.vue`
- `src/components/AppPromptInput.vue`
- `src/components/AppCard.vue`
- `src/utils/sse.ts`（或等价）
- `src/api/appController.ts`（追加手写 `deployApp`）
- `src/api/typings.d.ts`（追加部署请求/响应类型）
- `src/router/index.ts`、`src/config/menu.ts`、`src/layouts/BasicLayout.vue`
