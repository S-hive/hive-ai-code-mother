<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { CloudUploadOutlined } from '@ant-design/icons-vue'
import logoUrl from '@/assets/logo.png'
import AppPromptInput from '@/components/AppPromptInput.vue'
import { deployApp, getAppVoById } from '@/api/appController'
import { buildAppPreviewUrl } from '@/utils/appPreview'
import { streamChatToGenCode } from '@/utils/sse'

type ChatMessage = {
  role: 'user' | 'ai'
  content: string
}

const route = useRoute()
const router = useRouter()

const appId = computed(() => {
  const rawAppId = route.params.appId
  if (typeof rawAppId !== 'string' || !/^[1-9]\d*$/.test(rawAppId)) {
    return null
  }

  const id = Number(rawAppId)
  return Number.isSafeInteger(id) ? id : null
})
const app = ref<API.AppVO>()
const messages = ref<ChatMessage[]>([])
const input = ref('')
const generating = ref(false)
const deploying = ref(false)
const previewUrl = ref('')
const previewKey = ref(0)
const messagesEl = ref<HTMLElement | null>(null)
let cancelStream: (() => void) | null = null

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

const onDeploy = async () => {
  const id = appId.value
  if (id === null || deploying.value) return

  deploying.value = true
  try {
    const res = await deployApp({ appId: id })
    if (res.data.code === 0 && res.data.data) {
      const url = res.data.data
      Modal.confirm({
        title: '部署成功',
        content: url,
        okText: '打开',
        cancelText: '复制 URL',
        onOk: () => {
          window.open(url, '_blank')
        },
        onCancel: async () => {
          try {
            await navigator.clipboard.writeText(url)
            message.success('URL 已复制')
          } catch {
            message.error('复制 URL 失败')
          }
        },
      })
    } else {
      message.error('部署失败，' + res.data.message)
    }
  } finally {
    deploying.value = false
  }
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
      <div class="header-center">生成后的网页展示</div>
      <a-button type="primary" :loading="deploying" :disabled="deploying" @click="onDeploy">
        <template #icon><CloudUploadOutlined /></template>
        部署
      </a-button>
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
          v-if="previewUrl"
          :key="previewKey"
          class="preview-frame"
          :src="previewUrl"
          title="网站预览"
        />
        <a-empty v-else description="生成完成后将在此展示网站效果" />
      </section>
    </div>
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

.header-center {
  color: #8c8c8c;
}

.chat-body {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  min-height: 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
  background: #fafafa;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

@media (max-width: 900px) {
  .chat-body {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
}
</style>
