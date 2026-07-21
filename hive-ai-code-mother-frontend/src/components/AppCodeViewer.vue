<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CopyOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const props = defineProps<{
  baseUrl: string
  codeGenType?: string
  refreshKey: number
}>()

const files = computed(() =>
  props.codeGenType === 'html'
    ? ['index.html']
    : ['index.html', 'style.css', 'script.js'],
)
const currentFile = ref('index.html')
const sourceCode = ref('')
const loading = ref(false)
const errorMessage = ref('')
let controller: AbortController | null = null
let requestId = 0

const lineNumbers = computed(() =>
  sourceCode.value ? sourceCode.value.split('\n').map((_, index) => index + 1) : [],
)

const loadCode = async () => {
  const file = currentFile.value
  const currentRequestId = ++requestId
  controller?.abort()

  if (!props.baseUrl) {
    sourceCode.value = ''
    errorMessage.value = ''
    loading.value = false
    return
  }

  controller = new AbortController()
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(`${props.baseUrl}${file}?t=${props.refreshKey}`, {
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`加载 ${file} 失败（${response.status}）`)
    }
    const code = await response.text()
    if (currentRequestId === requestId) {
      sourceCode.value = code
    }
  } catch (error) {
    if (currentRequestId !== requestId || (error instanceof DOMException && error.name === 'AbortError')) {
      return
    }
    sourceCode.value = ''
    errorMessage.value = error instanceof Error ? error.message : `加载 ${file} 失败`
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}

const copySourceCode = async () => {
  try {
    await navigator.clipboard.writeText(sourceCode.value)
    message.success('源码已复制')
  } catch {
    message.error('复制源码失败')
  }
}

watch(files, (availableFiles) => {
  if (!availableFiles.includes(currentFile.value)) {
    currentFile.value = availableFiles[0]
  }
})

watch([() => props.baseUrl, currentFile, () => props.refreshKey], loadCode, { immediate: true })

onBeforeUnmount(() => {
  controller?.abort()
})
</script>

<template>
  <div class="app-code-viewer">
    <div class="viewer-toolbar">
      <a-tabs v-model:active-key="currentFile" size="small" class="file-tabs">
        <a-tab-pane v-for="file in files" :key="file" :tab="file" />
      </a-tabs>
      <a-button :disabled="!sourceCode" size="small" @click="copySourceCode">
        <template #icon><CopyOutlined /></template>
        复制源码
      </a-button>
    </div>

    <div v-if="loading" class="viewer-state">
      <a-spin tip="正在加载源码" />
    </div>
    <a-alert
      v-else-if="errorMessage"
      class="viewer-state viewer-error"
      type="error"
      show-icon
      :message="errorMessage"
    />
    <a-empty v-else-if="!sourceCode" class="viewer-state" description="暂无源码内容" />
    <div v-else class="code-scroll">
      <div class="code-content">
        <pre class="line-numbers" aria-hidden="true"><code>{{ lineNumbers.join('\n') }}</code></pre>
        <pre class="source-code"><code>{{ sourceCode }}</code></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-code-viewer {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.viewer-toolbar {
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
}

.file-tabs {
  flex: 1;
  min-width: 0;
}

.file-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}

.viewer-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

.viewer-error {
  padding: 16px;
  border: 0;
  border-radius: 0;
}

.code-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #fafafa;
}

.code-content {
  display: flex;
  width: max-content;
  min-width: 100%;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.code-content pre {
  margin: 0;
  padding: 16px 0;
  white-space: pre;
}

.line-numbers {
  min-width: 52px;
  padding-right: 12px !important;
  color: #8c8c8c;
  text-align: right;
  user-select: none;
  background: #f5f5f5;
  border-right: 1px solid #e8e8e8;
}

.source-code {
  padding-left: 16px !important;
  padding-right: 16px !important;
  color: #262626;
}
</style>
