# 对话页应用详情弹窗 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在应用对话详情页增加应用详情弹窗，并为创建者和管理员提供修改、删除入口。

**Architecture:** 功能直接集成到 `AppChatPage.vue`，复用页面已加载的 `AppVO` 和全局登录用户 Store。权限由前端计算属性控制可见性，修改复用现有编辑路由，删除根据管理员或创建者身份调用现有接口。

**Tech Stack:** Vue 3 Composition API、TypeScript、Pinia、Vue Router、Ant Design Vue

## Global Constraints

- 不新增依赖和后端接口。
- 打开详情弹窗时不发起额外请求。
- 只有应用创建者或管理员可以看到操作栏。
- 删除必须二次确认；成功后返回首页，失败时停留当前页面。
- 当前仓库没有自动化测试框架，本次使用类型检查、生产构建和手动交互检查验证。
- 未经用户明确要求，不创建 Git 提交。

---

### Task 1: 应用详情弹窗与权限操作

**Files:**
- Modify: `src/page/app/AppChatPage.vue:1-388`

**Interfaces:**
- Consumes: `API.AppVO.userId`、`API.AppVO.user`、`API.AppVO.createTime`、`useLoginUserStore().loginUser`
- Consumes: `deleteApp(body)`、`deleteAppByAdmin(body)`、现有 `/app/edit/:appId` 路由
- Produces: `canManageApp: ComputedRef<boolean>`、`openDetail()`、`onEdit()`、`onDelete()`

- [ ] **Step 1: 扩展依赖、状态与权限计算**

在 `<script setup>` 中：

```ts
import { Modal, message } from 'ant-design-vue'
import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue'
import { deleteApp, deleteAppByAdmin, deployApp, getAppVoById } from '@/api/appController'
import { useLoginUserStore } from '@/stores/loginUser'
```

在路由实例附近初始化登录用户 Store，并在页面状态中加入弹窗状态：

```ts
const loginUserStore = useLoginUserStore()
const detailModalOpen = ref(false)
```

增加权限计算。ID 使用字符串归一化，避免后端返回 `number` 或 `string` 时误判：

```ts
const isAdmin = computed(() => loginUserStore.loginUser.userRole === 'admin')
const isOwner = computed(() => {
  const loginUserId = loginUserStore.loginUser.id
  const ownerId = app.value?.userId
  return loginUserId != null && ownerId != null && String(loginUserId) === String(ownerId)
})
const canManageApp = computed(() => isAdmin.value || isOwner.value)
```

- [ ] **Step 2: 实现打开、修改和删除行为**

在部署方法前加入：

```ts
const openDetail = () => {
  detailModalOpen.value = true
}

const onEdit = async () => {
  const id = appId.value
  if (id === null) return
  detailModalOpen.value = false
  await router.push(`/app/edit/${id}`)
}

const onDelete = () => {
  const id = appId.value
  if (id === null || !canManageApp.value) return

  Modal.confirm({
    title: '确认删除该应用？',
    content: '删除后将无法恢复。',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = isAdmin.value
          ? await deleteAppByAdmin({ id })
          : await deleteApp({ id })
        if (res.data.code === 0) {
          detailModalOpen.value = false
          message.success('删除成功')
          await router.replace('/')
        } else {
          message.error('删除失败，' + res.data.message)
        }
      } catch {
        message.error('删除失败，请稍后重试')
      }
    },
  })
}
```

- [ ] **Step 3: 调整顶栏按钮布局**

将原部署按钮替换为右侧操作组：

```vue
<a-space class="header-actions">
  <a-button @click="openDetail">
    <template #icon><InfoCircleOutlined /></template>
    应用详情
  </a-button>
  <a-button type="primary" :loading="deploying" :disabled="deploying" @click="onDeploy">
    <template #icon><CloudUploadOutlined /></template>
    部署
  </a-button>
</a-space>
```

- [ ] **Step 4: 增加应用详情弹窗**

在部署成功弹窗之前加入：

```vue
<a-modal v-model:open="detailModalOpen" title="应用详情" :footer="null" width="450px">
  <div class="app-detail">
    <div class="detail-row">
      <span class="detail-label">创建者：</span>
      <div class="creator">
        <a-avatar :src="app?.user?.userAvatar">
          {{ app?.user?.userName?.slice(0, 1) || '用' }}
        </a-avatar>
        <span>{{ app?.user?.userName || '无名' }}</span>
      </div>
    </div>
    <div class="detail-row">
      <span class="detail-label">创建时间：</span>
      <span>{{ app?.createTime || '-' }}</span>
    </div>
    <a-space v-if="canManageApp" class="detail-actions">
      <a-button type="primary" @click="onEdit">
        <template #icon><EditOutlined /></template>
        修改
      </a-button>
      <a-button danger @click="onDelete">
        <template #icon><DeleteOutlined /></template>
        删除
      </a-button>
    </a-space>
  </div>
</a-modal>
```

- [ ] **Step 5: 增加弹窗样式并保持移动端可用**

在 `<style scoped>` 中加入：

```css
.header-actions {
  min-width: 180px;
  justify-content: flex-end;
}

.app-detail {
  padding: 4px 0;
}

.detail-row {
  display: flex;
  align-items: center;
  min-height: 40px;
}

.detail-label {
  width: 74px;
  flex: none;
  color: #8c8c8c;
}

.creator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-actions {
  margin-top: 18px;
}
```

在现有 `@media (max-width: 900px)` 中加入：

```css
.header-left {
  min-width: 0;
}

.app-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- [ ] **Step 6: 执行静态验证**

运行：

```bash
npm run type-check
```

预期：命令退出码为 `0`，没有 Vue 或 TypeScript 错误。

运行：

```bash
npm run build-only
```

预期：命令退出码为 `0`，Vite 成功生成生产构建。

- [ ] **Step 7: 手动验收**

启动：

```bash
npm run dev
```

依次验证：

1. 打开 `/app/chat/:appId`，确认“应用详情”位于“部署”左侧。
2. 点击后确认头像、昵称、创建时间与接口数据一致。
3. 使用非创建者普通账号访问，确认没有“修改”和“删除”按钮。
4. 使用创建者账号访问，确认“修改”进入 `/app/edit/:appId`。
5. 取消删除确认，确认应用未删除且页面不跳转。
6. 创建者确认删除，确认调用普通删除接口并在成功后返回首页。
7. 管理员确认删除，确认调用管理员删除接口并在成功后返回首页。
8. 模拟删除接口失败，确认仍停留对话页且详情弹窗保持打开。
