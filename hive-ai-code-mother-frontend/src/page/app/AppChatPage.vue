<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {message, Modal} from 'ant-design-vue'
import axios from 'axios'
import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  HighlightOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'
import logoUrl from '@/assets/logo.png'
import AiMessageContent from '@/components/AiMessageContent.vue'
import AppCodeViewer from '@/components/AppCodeViewer.vue'
import AppPromptInput from '@/components/AppPromptInput.vue'
import {deleteApp, deleteAppByAdmin, deployApp, getAppVoById} from '@/api/appController'
import {listAppChatHistory} from '@/api/chatHistoryController'
import {DEPLOY_REQUEST_TIMEOUT, PREVIEW_POLL_INTERVAL, PREVIEW_POLL_TIMEOUT,} from '@/config/env'
import {useTypewriterDisplay} from '@/composables/useTypewriterDisplay'
import {useLoginUserStore} from '@/stores/loginUser'
import {collectGeneratedFilePaths} from '@/utils/aiMessage'
import {buildAppPreviewPath, buildAppSourceUrl} from '@/utils/appPreview'
import {CodeGenTypeEnum, formatCodeGenType} from '@/utils/CodeGenType'
import {downloadAppCodeZip} from '@/utils/downloadAppCode'
import {streamChatToGenCode} from '@/utils/sse'
import {
  appendSelectedElementToMessage,
  formatSelectedElementSummary,
  useVisualEdit,
} from '@/utils/visualEdit'

type ChatMessage = {
  id?: API.Id
  role: 'user' | 'ai'
  content: string
  createTime?: string
}

const HISTORY_PAGE_SIZE = 10

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
const downloading = ref(false)
const deploying = ref(false)
const deployModalOpen = ref(false)
const detailModalOpen = ref(false)
const deployedUrl = ref('')
const previewUrl = ref('')
const sourceBaseUrl = ref('')
const generatedFiles = ref<string[]>([])
const buildingPreview = ref(false)
const previewKey = ref(0)
const rightMode = ref<'preview' | 'code'>('preview')
const messagesEl = ref<HTMLElement | null>(null)
const previewIframe = ref<HTMLIFrameElement | null>(null)
const hasMoreHistory = ref(false)
const loadingHistory = ref(false)
const loadingMoreHistory = ref(false)
const historyLoadSucceeded = ref(false)
const totalHistoryCount = ref(0)
let cancelStream: (() => void) | null = null
let previewToken = 0

const {
  editMode: visualEditMode,
  selectedElement,
  toggleEditMode,
  clearSelection,
  resetVisualEdit,
  onPreviewFrameLoad,
} = useVisualEdit(previewIframe)

const isAdmin = computed(() => loginUserStore.loginUser.userRole === 'admin')
const isVueProject = computed(() => app.value?.codeGenType === CodeGenTypeEnum.VUE_PROJECT)
const isOwner = computed(() => {
  const loginUserId = loginUserStore.loginUser.id
  const ownerId = app.value?.userId
  return loginUserId != null && ownerId != null && String(loginUserId) === String(ownerId)
})
const canManageApp = computed(() => isAdmin.value || isOwner.value)
const shouldShowPreview = computed(() => messages.value.length >= 2)

const streamingAiContent = computed(() => {
  const last = messages.value[messages.value.length - 1]
  return last?.role === 'ai' ? last.content : ''
})

const {displayed: displayedStreamContent} = useTypewriterDisplay(
  streamingAiContent,
  generating,
)

/** 贴底时才自动滚动；用户上滑后暂停，滚回底部再恢复 */
const STICK_BOTTOM_PX = 24
const stickToBottom = ref(true)

const isNearBottom = (el: HTMLElement) =>
  el.scrollHeight - el.scrollTop - el.clientHeight <= STICK_BOTTOM_PX

const onMessagesWheel = (event: WheelEvent) => {
  if (event.deltaY < 0) {
    stickToBottom.value = false
  }
}

const onMessagesScroll = () => {
  const el = messagesEl.value
  if (!el) return
  stickToBottom.value = isNearBottom(el)
}

watch(displayedStreamContent, () => {
  if (generating.value && stickToBottom.value) {
    void scrollToBottom()
  }
})

const scrollToBottom = async () => {
  await nextTick()
  const el = messagesEl.value
  if (!el || !stickToBottom.value) return
  el.scrollTop = el.scrollHeight
}

const isPreviewReady = async (url: string) => {
  try {
    const response = await fetch(`${url}index.html?t=${Date.now()}`, {
      credentials: 'include',
      cache: 'no-store',
    })
    return response.ok
  } catch {
    return false
  }
}

const pollPreviewReady = async (url: string, token: number) => {
  const deadline = Date.now() + PREVIEW_POLL_TIMEOUT
  while (Date.now() < deadline) {
    if (token !== previewToken) return false
    if (await isPreviewReady(url)) return true
    await new Promise((resolve) => setTimeout(resolve, PREVIEW_POLL_INTERVAL))
  }
  return false
}

const showPreview = async (waitForBuild = false) => {
  const type = app.value?.codeGenType
  const id = app.value?.id
  if (!type || id == null) return

  const token = ++previewToken
  sourceBaseUrl.value = buildAppSourceUrl(type, id)
  const url = buildAppPreviewPath(type, id)

  // Vue 工程的 dist 由后端在对话结束后异步构建，就绪前加载 iframe 只会拿到 404
  if (type === CodeGenTypeEnum.VUE_PROJECT) {
    buildingPreview.value = waitForBuild
    const ready = waitForBuild ? await pollPreviewReady(url, token) : await isPreviewReady(url)
    if (token !== previewToken) return
    buildingPreview.value = false
    if (!ready) {
      if (waitForBuild) {
        message.warning('Vue 项目构建尚未完成，可稍后点击刷新预览')
      }
      return
    }
  }

  previewUrl.value = url
  previewKey.value += 1
}

const updatePreviewIfNeeded = (waitForBuild = false) => {
  if (shouldShowPreview.value) {
    void showPreview(waitForBuild)
  }
}

const refreshGeneratedFiles = () => {
  generatedFiles.value = collectGeneratedFilePaths(
    messages.value.filter((msg) => msg.role === 'ai').map((msg) => msg.content),
  )
}

const toChatMessage = (item: API.ChatHistory): ChatMessage => ({
  id: item.id,
  role: item.messageType === 'user' ? 'user' : 'ai',
  content: item.message ?? '',
  createTime: item.createTime,
})

const mergeHistoryMessages = (records: API.ChatHistory[], prepend = false) => {
  const batch = [...records].reverse().map(toChatMessage)
  if (batch.length === 0) return

  if (prepend) {
    const existingIds = new Set(messages.value.map((item) => item.id).filter((id) => id != null))
    const uniqueBatch = batch.filter((item) => item.id == null || !existingIds.has(item.id))
    messages.value = [...uniqueBatch, ...messages.value]
  } else {
    messages.value = batch
  }

  refreshGeneratedFiles()
}

const loadChatHistory = async (loadMore = false) => {
  const id = appId.value
  if (id === null || (!loadMore && loadingHistory.value) || (loadMore && loadingMoreHistory.value)) {
    return false
  }

  if (loadMore) {
    loadingMoreHistory.value = true
  } else {
    loadingHistory.value = true
  }

  try {
    const params: API.listAppChatHistoryParams = {
      appId: id,
      pageSize: HISTORY_PAGE_SIZE,
    }
    if (loadMore && messages.value.length > 0) {
      const oldestMessage = messages.value[0]
      if (oldestMessage.createTime) {
        params.lastCreateTime = oldestMessage.createTime
      }
    }

    const res = await listAppChatHistory(params)
    if (res.data.code !== 0 || !res.data.data) {
      if (!loadMore) {
        message.error('加载对话历史失败，' + (res.data.message || '请稍后重试'))
      }
      return false
    }

    if (!loadMore) {
      historyLoadSucceeded.value = true
      totalHistoryCount.value = res.data.data.totalRow ?? 0
    }

    const records = res.data.data.records ?? []
    hasMoreHistory.value = records.length === HISTORY_PAGE_SIZE

    if (loadMore) {
      const prevScrollHeight = messagesEl.value?.scrollHeight ?? 0
      mergeHistoryMessages(records, true)
      await nextTick()
      if (messagesEl.value) {
        messagesEl.value.scrollTop = messagesEl.value.scrollHeight - prevScrollHeight
      }
      return true
    }

    mergeHistoryMessages(records)
    await scrollToBottom()
    return true
  } catch {
    if (!loadMore) {
      message.error('加载对话历史失败，请稍后重试')
    }
    return false
  } finally {
    if (loadMore) {
      loadingMoreHistory.value = false
    } else {
      loadingHistory.value = false
    }
  }
}

const loadApp = async () => {
  const id = appId.value
  if (id === null) return

  const res = await getAppVoById({id})
  if (res.data.code === 0 && res.data.data) {
    app.value = res.data.data
  } else {
    message.error('获取应用失败，' + res.data.message)
  }
}

const sendMessage = (text: string) => {
  const content = text.trim()
  const id = appId.value
  if (!content || generating.value || id === null) return

  messages.value.push({role: 'user', content})
  messages.value.push({role: 'ai', content: ''})
  generating.value = true
  stickToBottom.value = true
  void scrollToBottom()

  const aiIndex = messages.value.length - 1
  cancelStream?.()
  cancelStream = streamChatToGenCode({
    appId: id,
    message: content,
    onMessage: (chunk) => {
      messages.value[aiIndex].content += chunk
    },
    onDone: async () => {
      generating.value = false
      cancelStream = null
      refreshGeneratedFiles()
      await loadApp()
      updatePreviewIfNeeded(true)
    },
    onError: (err) => {
      generating.value = false
      cancelStream = null
      const errorMessage = err.message || '生成过程中出现错误'
      messages.value[aiIndex].content = `❌ ${errorMessage}`
      refreshGeneratedFiles()
      message.error(errorMessage)
    },
  })
}

const onSubmit = () => {
  const text = input.value
  if (!text.trim()) return

  const messageToSend = appendSelectedElementToMessage(text, selectedElement.value)
  input.value = ''
  resetVisualEdit()
  sendMessage(messageToSend)
}

const onToggleVisualEdit = async () => {
  if (!previewUrl.value) {
    message.warning('请先生成网站后再进行可视化编辑')
    return
  }
  if (rightMode.value !== 'preview') {
    rightMode.value = 'preview'
    await nextTick()
  }
  await toggleEditMode()
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
          ? await deleteAppByAdmin({id})
          : await deleteApp({id})
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

const onDownload = async () => {
  const id = appId.value
  if (id === null || downloading.value) return

  downloading.value = true
  try {
    await downloadAppCodeZip(id)
    message.success('代码下载成功')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error('下载失败，' + errorMessage)
  } finally {
    downloading.value = false
  }
}

const onDeploy = async () => {
  const id = appId.value
  if (id === null || deploying.value) return

  deploying.value = true
  if (isVueProject.value) {
    message.info('Vue 项目需要先完成构建，部署可能耗时数分钟，请耐心等待')
  }
  try {
    // Vue 工程部署会在后端同步执行 npm install 与 npm run build，远超默认超时
    const res = await deployApp({appId: id}, {timeout: DEPLOY_REQUEST_TIMEOUT})
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
  await loadChatHistory()
  updatePreviewIfNeeded()

  // 仅在自己的应用且确认无历史对话时，才自动发送 initPrompt
  if (
    isOwner.value &&
    historyLoadSucceeded.value &&
    totalHistoryCount.value === 0 &&
    app.value?.initPrompt
  ) {
    sendMessage(app.value.initPrompt)
  }
})

onBeforeUnmount(() => {
  cancelStream?.()
  previewToken += 1
})

watch(rightMode, (mode) => {
  if (mode !== 'preview' && visualEditMode.value) {
    resetVisualEdit()
  }
})
</script>

<template>
  <div id="appChatPage">
    <header class="chat-header">
      <div class="header-left" @click="router.push('/')">
        <img :src="logoUrl" alt="logo" class="logo"/>
        <span class="app-name">{{ app?.appName || '应用对话' }}</span>
        <a-tag v-if="app?.codeGenType" class="code-gen-tag">
          {{ formatCodeGenType(app.codeGenType) }}
        </a-tag>
      </div>
      <a-segmented
        v-model:value="rightMode"
        :options="[
          { label: '代码', value: 'code' },
          { label: '预览', value: 'preview' },
        ]"
      />
      <a-space class="header-actions">
        <a-button :loading="buildingPreview" title="刷新预览" @click="showPreview(true)">
          <template #icon>
            <ReloadOutlined/>
          </template>
        </a-button>
        <a-button @click="openDetail">
          <template #icon>
            <InfoCircleOutlined/>
          </template>
          应用详情
        </a-button>
        <a-button :disabled="downloading" :loading="downloading" @click="onDownload">
          <template #icon>
            <DownloadOutlined/>
          </template>
          下载代码
        </a-button>
        <a-button :disabled="deploying" :loading="deploying" type="primary" @click="onDeploy">
          <template #icon>
            <CloudUploadOutlined/>
          </template>
          部署
        </a-button>
      </a-space>
    </header>

    <div class="chat-body">
      <section class="chat-pane">
        <div
          ref="messagesEl"
          class="messages"
          @scroll.passive="onMessagesScroll"
          @wheel.passive="onMessagesWheel"
        >
          <div v-if="hasMoreHistory" class="load-more">
            <a-button
              :disabled="loadingMoreHistory"
              :loading="loadingMoreHistory"
              type="link"
              @click="loadChatHistory(true)"
            >
              加载更多
            </a-button>
          </div>
          <div
            v-for="(msg, idx) in messages"
            :key="msg.id ?? idx"
            :class="msg.role"
            class="msg"
          >
            <div class="bubble">
              <AiMessageContent
                v-if="msg.role === 'ai'"
                :content="generating && idx === messages.length - 1 ? displayedStreamContent : msg.content"
                :streaming="generating && idx === messages.length - 1"
              />
              <template v-else>{{ msg.content }}</template>
            </div>
          </div>
          <a-spin v-if="loadingHistory" class="history-loading" tip="加载对话历史中..."/>
        </div>
        <div class="input-wrap">
          <a-alert
            v-if="selectedElement"
            class="selected-element-alert"
            closable
            show-icon
            type="info"
            @close="clearSelection"
          >
            <template #message>已选中页面元素</template>
            <template #description>
              {{ formatSelectedElementSummary(selectedElement) }}
            </template>
          </a-alert>
          <AppPromptInput
            v-model="input"
            :loading="generating"
            placeholder="描述越详细，页面越具体，可以一步一步完善生成效果"
            variant="chat"
            @submit="onSubmit"
          >
            <template #actions>
              <a-button
                :disabled="!previewUrl || generating"
                :type="visualEditMode ? 'primary' : 'default'"
                size="small"
                @click="onToggleVisualEdit"
              >
                <template #icon>
                  <HighlightOutlined/>
                </template>
                {{ visualEditMode ? '退出编辑' : '可视化编辑' }}
              </a-button>
            </template>
          </AppPromptInput>
        </div>
      </section>

      <section :class="{ 'preview-pane-editing': visualEditMode }" class="preview-pane">
        <div v-if="rightMode === 'preview' && buildingPreview" class="preview-state">
          <a-spin tip="Vue 项目构建中，请稍候..."/>
        </div>
        <iframe
          v-else-if="rightMode === 'preview' && previewUrl"
          :key="previewKey"
          ref="previewIframe"
          :class="{ 'preview-frame-editing': visualEditMode }"
          :src="previewUrl"
          class="preview-frame"
          title="网站预览"
          @load="onPreviewFrameLoad"
        />
        <AppCodeViewer
          v-else-if="rightMode === 'code' && sourceBaseUrl"
          :base-url="sourceBaseUrl"
          :code-gen-type="app?.codeGenType"
          :files="generatedFiles"
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

    <a-modal v-model:open="detailModalOpen" :footer="null" title="应用详情" width="450px">
      <div class="app-detail">
        <div class="detail-row">
          <span class="detail-label">生成类型：</span>
          <a-tag v-if="app?.codeGenType">{{ formatCodeGenType(app.codeGenType) }}</a-tag>
          <span v-else>-</span>
        </div>
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
            <template #icon>
              <EditOutlined/>
            </template>
            修改
          </a-button>
          <a-button danger @click="onDelete">
            <template #icon>
              <DeleteOutlined/>
            </template>
            删除
          </a-button>
        </a-space>
      </div>
    </a-modal>

    <a-modal v-model:open="deployModalOpen" :footer="null" title="部署成功" width="600px">
      <div class="deploy-success">
        <CheckCircleOutlined class="success-icon"/>
        <h2>网站部署成功！</h2>
        <p>你的网站已经成功部署，可以通过以下链接访问：</p>
        <a-input :value="deployedUrl" readonly size="large">
          <template #suffix>
            <CopyOutlined class="copy-icon" @click="copyDeployedUrl"/>
          </template>
        </a-input>
        <a-space class="deploy-actions">
          <a-button size="large" type="primary" @click="openDeployedSite">访问网站</a-button>
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

.code-gen-tag {
  flex: none;
  margin: 0;
  cursor: pointer;
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

.load-more {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.history-loading {
  display: flex;
  justify-content: center;
  padding: 24px 0;
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

/* AI 回复包含工具调用与代码块，需要更大的展示宽度 */
.msg.ai .bubble {
  max-width: 95%;
  min-width: 0;
  white-space: normal;
}

.input-wrap {
  padding: 12px 16px 16px;
  border-top: 1px solid #f0f0f0;
}

.selected-element-alert {
  margin-bottom: 10px;
}

.preview-pane-editing {
  box-shadow: inset 0 0 0 2px #1677ff;
}

.preview-frame-editing {
  cursor: crosshair;
}

.preview-pane {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
  background: #fafafa;
}

.preview-pane > * {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

.preview-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
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
