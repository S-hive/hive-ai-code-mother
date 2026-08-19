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
import { highlightCodeByLanguage } from '@/utils/codeHighlight'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps<{
  content: string
  /** 流式输出中：未闭合的文件卡片不高亮，避免每个 chunk 全量重算 */
  streaming?: boolean
}>()

const segments = computed(() => parseAiMessage(props.content))
const collapsedFiles = ref<Set<string>>(new Set())

const isCollapsed = (path: string) => collapsedFiles.value.has(path)

const isUnclosedStreamingFile = (index: number) => {
  const segment = segments.value[index]
  return Boolean(props.streaming && segment?.kind === 'file' && !segment.closed)
}

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

const highlightSegmentCode = (
  code: string,
  language?: string,
  filePath?: string,
) => highlightCodeByLanguage(code, language, filePath)
</script>

<template>
  <div class="ai-message">
    <template v-for="(segment, index) in segments" :key="index">
      <div
        v-if="segment.kind === 'markdown'"
        class="segment-markdown markdown-body"
        v-html="renderMarkdown(segment.content)"
      />

      <div v-else-if="segment.kind === 'tool-select'" class="segment-tool">
        <ToolOutlined />
        <span>选择工具：{{ segment.toolName }}</span>
      </div>

      <div v-else-if="segment.kind === 'tool-call'" class="segment-tool-call">
        <div class="tool-call-header">
          <ToolOutlined />
          <span>[工具调用] {{ segment.header }}</span>
        </div>
        <div
          v-if="segment.body"
          class="tool-call-body markdown-body"
          v-html="renderMarkdown(segment.body)"
        />
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
        <pre v-show="!isCollapsed(segment.path)" class="code-block">
          <code v-if="isUnclosedStreamingFile(index)" class="hljs streaming-code">{{
            segment.code
          }}</code>
          <code
            v-else
            class="hljs"
            v-html="highlightSegmentCode(segment.code, segment.language, segment.path)"
          />
        </pre>
      </div>
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

.streaming-code {
  white-space: pre;
}

.segment-markdown,
.tool-call-body {
  word-break: break-word;
  font-size: 14px;
  line-height: 1.6;
  color: #262626;
}

.segment-markdown :deep(p),
.tool-call-body :deep(p) {
  margin: 0 0 8px;
}

.segment-markdown :deep(p:last-child),
.tool-call-body :deep(p:last-child) {
  margin-bottom: 0;
}

.segment-markdown :deep(h1),
.segment-markdown :deep(h2),
.segment-markdown :deep(h3),
.segment-markdown :deep(h4),
.tool-call-body :deep(h1),
.tool-call-body :deep(h2),
.tool-call-body :deep(h3),
.tool-call-body :deep(h4) {
  margin: 12px 0 8px;
  font-weight: 600;
  line-height: 1.4;
}

.segment-markdown :deep(ul),
.segment-markdown :deep(ol),
.tool-call-body :deep(ul),
.tool-call-body :deep(ol) {
  margin: 0 0 8px;
  padding-left: 20px;
}

.segment-markdown :deep(li),
.tool-call-body :deep(li) {
  margin-bottom: 4px;
}

.segment-markdown :deep(code),
.tool-call-body :deep(code) {
  padding: 1px 4px;
  border-radius: 4px;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.06);
}

.segment-markdown :deep(pre),
.tool-call-body :deep(pre) {
  margin: 8px 0;
  padding: 10px 12px;
  overflow: auto;
  border-radius: 8px;
  background: #f6f8fa;
}

.segment-markdown :deep(pre.hljs),
.segment-markdown :deep(pre code.hljs),
.tool-call-body :deep(pre.hljs),
.tool-call-body :deep(pre code.hljs) {
  background: #f6f8fa;
}

.segment-markdown :deep(pre code),
.tool-call-body :deep(pre code) {
  padding: 0;
  background: transparent;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre;
}

.segment-markdown :deep(blockquote),
.tool-call-body :deep(blockquote) {
  margin: 8px 0;
  padding-left: 12px;
  border-left: 3px solid #d9d9d9;
  color: #595959;
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

.segment-tool-call {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.tool-call-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 500;
  color: #262626;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.tool-call-body {
  padding: 10px 12px;
  font-size: 13px;
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
  background: #f6f8fa;
  white-space: pre;
}

.code-block code {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  background: transparent;
}
</style>
