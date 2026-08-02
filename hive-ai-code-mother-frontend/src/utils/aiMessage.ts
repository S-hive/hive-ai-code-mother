/**
 * 解析后端流式返回的 AI 消息。
 *
 * Vue 工程模式下后端会把工具调用信息一并写进消息文本，格式为：
 *   [选择工具] 写入文件
 *   [工具调用] 写入文件 src/App.vue
 *   ```vue
 *   ...文件内容...
 *   ```
 * 其余模式下 AI 仍可能返回普通的 Markdown 代码块。
 */

export type AiMessageSegment =
  | { kind: 'text'; text: string }
  | { kind: 'tool-select'; toolName: string }
  | { kind: 'file'; path: string; language: string; code: string }
  | { kind: 'code'; language: string; code: string }

const FENCE = '```'

// 流式输出过程中代码块可能尚未闭合，因此结尾允许匹配到字符串末尾
const SEGMENT_PATTERN = new RegExp(
  [
    `\\[工具调用\\][ \\t]*写入文件[ \\t]+(?<filePath>[^\\n]+)\\n${FENCE}(?<fileLang>[^\\n]*)\\n(?<fileCode>[\\s\\S]*?)(?:\\n${FENCE}|$)`,
    '\\[选择工具\\][ \\t]*(?<toolName>[^\\n]*)',
    `${FENCE}(?<codeLang>[^\\n]*)\\n(?<code>[\\s\\S]*?)(?:\\n${FENCE}|$)`,
  ].join('|'),
  'g',
)

const appendText = (segments: AiMessageSegment[], raw: string) => {
  const text = raw.replace(/^\n+/, '').replace(/\n+$/, '')
  if (text.trim().length > 0) {
    segments.push({ kind: 'text', text })
  }
}

export function parseAiMessage(content: string): AiMessageSegment[] {
  if (!content) return []

  const segments: AiMessageSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  SEGMENT_PATTERN.lastIndex = 0
  while ((match = SEGMENT_PATTERN.exec(content)) !== null) {
    // 空匹配会让 exec 原地打转，直接跳过一个字符继续
    if (match[0].length === 0) {
      SEGMENT_PATTERN.lastIndex += 1
      continue
    }

    appendText(segments, content.slice(lastIndex, match.index))
    lastIndex = SEGMENT_PATTERN.lastIndex

    const groups = match.groups ?? {}
    if (groups.filePath !== undefined) {
      segments.push({
        kind: 'file',
        path: groups.filePath.trim(),
        language: (groups.fileLang ?? '').trim(),
        code: groups.fileCode ?? '',
      })
    } else if (groups.toolName !== undefined) {
      segments.push({ kind: 'tool-select', toolName: groups.toolName.trim() || '工具' })
    } else {
      segments.push({
        kind: 'code',
        language: (groups.codeLang ?? '').trim(),
        code: groups.code ?? '',
      })
    }
  }

  appendText(segments, content.slice(lastIndex))
  return segments
}

/**
 * 从若干条 AI 消息中提取本次生成写入过的文件路径（按首次写入顺序去重）
 */
export function collectGeneratedFilePaths(contents: string[]): string[] {
  const paths = new Set<string>()
  for (const content of contents) {
    for (const segment of parseAiMessage(content)) {
      if (segment.kind === 'file') {
        paths.add(segment.path)
      }
    }
  }
  return [...paths]
}
