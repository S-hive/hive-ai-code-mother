<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import axios from 'axios'
import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue'
import logoUrl from '@/assets/logo.png'
import AppCodeViewer from '@/components/AppCodeViewer.vue'
import AppPromptInput from '@/components/AppPromptInput.vue'
import { deleteApp, deleteAppByAdmin, deployApp, getAppVoById } from '@/api/appController'
import { useLoginUserStore } from '@/stores/loginUser'
import { buildAppPreviewUrl } from '@/utils/appPreview'
import { streamChatToGenCode } from '@/utils/sse'

type ChatMessage = {
  role: 'user' | 'ai'
  content: string
}

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

const appId = computed(() => {
  const rawAppId = route.params.appId
  if (typeof rawAppId !== 'string' || !/^[1-9]\d*$/.test(rawAppId)) {
    return null
  }
  return rawAppId
})
const app = ref<API.AppVO>()
const messages = ref<ChatMessage[]>([])
const input = ref('')
const generating = ref(false)
const deploying = ref(false)
const deployModalOpen = ref(false)
const detailModalOpen = ref(false)
const deployedUrl = ref('')
const previewUrl = ref('')
const previewKey = ref(0)
const rightMode = ref<'preview' | 'code'>('preview')
const messagesEl = ref<HTMLElement | null>(null)
let cancelStream: (() => void) | null = null

const isAdmin = computed(() => loginUserStore.loginUser.userRole === 'admin')
const isOwner = computed(() => {
  const loginUserId = loginUserStore.loginUser.id
  const ownerId = app.value?.userId
  return loginUserId != null && ownerId != null && String(loginUserId) === String(ownerId)
})
const canManageApp = computed(() => isAdmin.value || isOwner.value)

const scrollToBottom = async () => {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}

const showPreview = () => {
  const type = app.value?.codeGenType
  if (!type || !app.value?.id) return
  previewUrl.value = buildAppPreviewUrl(type, app.value.id)
  previewKey.value += 1
}

const loadApp = async () => {
  const id = appId.value
  if (id === null) return

  const res = await getAppVoById({ id })
  if (res.data.code === 0 && res.data.data) {
    app.value = res.data.data
    if (app.value.codeGenType) {
      showPreview()
    }
  } else {
    message.error('获取应用失败，' + res.data.message)
  }
}

const sendMessage = (text: string) => {
  const content = text.trim()
  const id = appId.value
  if (!content || generating.value || id === null) return

  messages.value.push({ role: 'user', content })
  messages.value.push({ role: 'ai', content: '' })
  generating.value = true
  scrollToBottom()

  const aiIndex = messages.value.length - 1
  cancelStream?.()
  cancelStream = streamChatToGenCode({
    appId: id,
    message: content,
    onMessage: (chunk) => {
      messages.value[aiIndex].content += chunk
      scrollToBottom()
    },
    onDone: async () => {
      generating.value = false
      cancelStream = null
      await loadApp()
      if (route.query.init === '1') {
        router.replace({ path: route.path, query: {} })
      }
    },
    onError: (err) => {
      generating.value = false
      cancelStream = null
      messages.value[aiIndex].content += `\n[错误] ${err.message}`
      message.error(err.message)
    },
  })
}

const onSubmit = () => {
  const text = input.value
  input.value = ''
  sendMessage(text)
}

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

const onDeploy = async () => {
  const id = appId.value
  if (id === null || deploying.value) return

  deploying.value = true
  try {
    const res = await deployApp({ appId: id })
    if (res.data.code === 0 && res.data.data) {
      deployedUrl.value = res.data.data
      deployModalOpen.value = true
    } else {
      message.error('部署失败，' + res.data.message)
    }
  } catch (error) {
    const errorMessage = axios.isAxiosError<API.BaseResponseString>(error)
      ? error.response?.data?.message
      : undefined
    message.error('部署失败，' + (errorMessage || '请稍后重试'))
  } finally {
    deploying.value = false
  }
}

const copyDeployedUrl = async () => {
  try {
    await navigator.clipboard.writeText(deployedUrl.value)
    message.success('部署地址已复制')
  } catch {
    message.error('复制部署地址失败')
  }
}

const openDeployedSite = () => {
  window.open(deployedUrl.value, '_blank', 'noopener,noreferrer')
}

onMounted(async () => {
  if (appId.value === null) {
    message.error('应用 ID 无效')
    await router.replace('/')
    return
  }

  await loadApp()
  if (route.query.init === '1' && app.value?.initPrompt) {
    sendMessage(app.value.initPrompt)
  }
})

onBeforeUnmount(() => {
  cancelStream?.()
})
</script>

<template>
  <div id="appChatPage">
    <header class="chat-header">
      <div class="header-left" @click="router.push('/')">
        <img :src="logoUrl" alt="logo" class="logo" />
        <span class="app-name">{{ app?.appName || '应用对话' }}</span>
      </div>
      <a-segmented
        v-model:value="rightMode"
        :options="[
          { label: '代码', value: 'code' },
          { label: '预览', value: 'preview' },
        ]"
      />
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
    </header>

    <div class="chat-body">
      <section class="chat-pane">
        <div ref="messagesEl" class="messages">
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            class="msg"
            :class="msg.role"
          >
            <div class="bubble">{{ msg.content }}</div>
          </div>
        </div>
        <div class="input-wrap">
          <AppPromptInput
            v-model="input"
            variant="chat"
            placeholder="描述越详细，页面越具体，可以一步一步完善生成效果"
            :loading="generating"
            @submit="onSubmit"
          />
        </div>
      </section>

      <section class="preview-pane">
        <iframe
          v-if="rightMode === 'preview' && previewUrl"
          :key="previewKey"
          class="preview-frame"
          :src="previewUrl"
          title="网站预览"
        />
        <AppCodeViewer
          v-else-if="rightMode === 'code' && previewUrl"
          :base-url="previewUrl"
          :code-gen-type="app?.codeGenType"
          :refresh-key="previewKey"
        />
        <a-empty
          v-else
          :description="
            rightMode === 'code' ? '生成完成后将在此展示源码' : '生成完成后将在此展示网站效果'
          "
        />
      </section>
    </div>

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

    <a-modal v-model:open="deployModalOpen" title="部署成功" :footer="null" width="600px">
      <div class="deploy-success">
        <CheckCircleOutlined class="success-icon" />
        <h2>网站部署成功！</h2>
        <p>你的网站已经成功部署，可以通过以下链接访问：</p>
        <a-input :value="deployedUrl" readonly size="large">
          <template #suffix>
            <CopyOutlined class="copy-icon" @click="copyDeployedUrl" />
          </template>
        </a-input>
        <a-space class="deploy-actions">
          <a-button type="primary" size="large" @click="openDeployedSite">访问网站</a-button>
          <a-button size="large" @click="deployModalOpen = false">关闭</a-button>
        </a-space>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
#appChatPage {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.chat-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  min-width: 180px;
}

.logo {
  width: 28px;
  height: 28px;
}

.app-name {
  font-weight: 600;
}

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

.chat-body {
  flex: 1;
  display: grid;
  grid-template-columns: 34% minmax(0, 66%);
  min-height: 0;
}

.chat-pane {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f0f0f0;
  min-height: 0;
}

.messages {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.msg {
  display: flex;
  margin-bottom: 12px;
}

.msg.user {
  justify-content: flex-end;
}

.msg.ai {
  justify-content: flex-start;
}

.bubble {
  max-width: 85%;
  padding: 10px 12px;
  border-radius: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  background: #f5f5f5;
}

.msg.user .bubble {
  background: #1677ff;
  color: #fff;
}

.input-wrap {
  padding: 12px 16px 16px;
  border-top: 1px solid #f0f0f0;
}

.preview-pane {
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
  overflow: hidden;
  background: #fafafa;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

.deploy-success {
  padding: 16px 24px 8px;
  text-align: center;
}

.success-icon {
  color: #52c41a;
  font-size: 56px;
}

.deploy-success h2 {
  margin: 20px 0 12px;
}

.deploy-success p {
  margin-bottom: 20px;
  color: #8c8c8c;
}

.copy-icon {
  cursor: pointer;
}

.deploy-actions {
  margin-top: 24px;
}

@media (max-width: 900px) {
  .header-left {
    min-width: 0;
  }

  .app-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chat-body {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
}
</style>
