<script setup lang="ts">
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  CopyOutlined,
  DownOutlined,
  FileTextOutlined,
  RightOutlined,
  ToolOutlined,
} from '@ant-design/icons-vue'
import { parseAiMessage } from '@/utils/aiMessage'

const props = defineProps<{
  content: string
}>()

const segments = computed(() => parseAiMessage(props.content))
const collapsedFiles = ref<Set<string>>(new Set())

const isCollapsed = (path: string) => collapsedFiles.value.has(path)

const toggleFile = (path: string) => {
  const next = new Set(collapsedFiles.value)
  if (next.has(path)) {
    next.delete(path)
  } else {
    next.add(path)
  }
  collapsedFiles.value = next
}

const copyCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    message.success('代码已复制')
  } catch {
    message.error('复制代码失败')
  }
}
</script>

<template>
  <div class="ai-message">
    <template v-for="(segment, index) in segments" :key="index">
      <div v-if="segment.kind === 'text'" class="segment-text">{{ segment.text }}</div>

      <div v-else-if="segment.kind === 'tool-select'" class="segment-tool">
        <ToolOutlined />
        <span>选择工具：{{ segment.toolName }}</span>
      </div>

      <div v-else-if="segment.kind === 'file'" class="segment-file">
        <div class="file-header" @click="toggleFile(segment.path)">
          <component :is="isCollapsed(segment.path) ? RightOutlined : DownOutlined" class="chevron" />
          <FileTextOutlined />
          <span class="file-path" :title="segment.path">{{ segment.path }}</span>
          <a-button
            type="text"
            size="small"
            title="复制文件内容"
            @click.stop="copyCode(segment.code)"
          >
            <template #icon><CopyOutlined /></template>
          </a-button>
        </div>
        <pre v-show="!isCollapsed(segment.path)" class="code-block"><code>{{ segment.code }}</code></pre>
      </div>

      <pre v-else class="code-block standalone"><code>{{ segment.code }}</code></pre>
    </template>
  </div>
</template>

<style scoped>
.ai-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.segment-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.segment-tool {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #1677ff;
  background: #e6f4ff;
}

.segment-file {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 13px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.chevron {
  font-size: 11px;
  color: #8c8c8c;
}

.file-path {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: Consolas, 'Courier New', monospace;
}

.code-block {
  margin: 0;
  padding: 10px 12px;
  max-height: 260px;
  overflow: auto;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #262626;
  background: #f6f8fa;
  white-space: pre;
}

.code-block.standalone {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}
</style>
