/**
 * 解析后端流式返回的 AI 消息。
 *
 * Vue 工程模式带 [选择工具] / [工具调用] 标记；
 * HTML / 多文件模式则是说明文字 + Markdown 代码块。
 * 两类输出都拆成同一套片段：Markdown 说明、工具提示、文件卡片。
 */

export type AiMessageSegment =
  | { kind: 'markdown'; content: string }
  | { kind: 'tool-select'; toolName: string }
  | { kind: 'tool-call'; header: string; body: string }
  | { kind: 'file'; path: string; language: string; code: string; closed: boolean }

const FENCE = '```'
const TOOL_SELECT_PREFIX = '[选择工具]'
const TOOL_CALL_PREFIX = '[工具调用]'
const HAS_TOOL_MARKER = /\[选择工具\]|\[工具调用\]/
const HTML_DOCUMENT_PATTERN = /<!DOCTYPE\s+html|<html[\s>]/i

const FILE_WRITE_HEADER_PATTERN = /^写入文件[ \t]+(?<path>.+)$/
const FILE_WRITE_BODY_PATTERN = new RegExp(
  `^${FENCE}(?<language>[^\\n]*)\\n(?<code>[\\s\\S]*?)(?:\\n${FENCE}|$)`,
)
const FENCE_OPEN_PATTERN = /^```([^\n]*)\n/gm
const FENCE_CLOSE_PATTERN = /^```[ \t]*(?:\n|$)/gm
const DANGLING_FENCE_PATTERN = /^```([^\n]*)$/m

const DEFAULT_PATH_BY_LANGUAGE: Record<string, string> = {
  html: 'index.html',
  htm: 'index.html',
  css: 'style.css',
  javascript: 'script.js',
  js: 'script.js',
  mjs: 'script.js',
  vue: 'App.vue',
  json: 'package.json',
  typescript: 'index.ts',
  ts: 'index.ts',
}

const looksLikePath = (token: string) => /[\\/]/.test(token) || /\.\w+$/.test(token)

const resolveFileMeta = (info: string) => {
  const tokens = info.trim().split(/\s+/).filter(Boolean)
  const language = tokens[0] ?? ''
  const pathFromInfo = tokens.find((token, index) => index > 0 && looksLikePath(token))
  const path =
    pathFromInfo ??
    DEFAULT_PATH_BY_LANGUAGE[language.toLowerCase()] ??
    (language ? language : 'file')
  return { language, path }
}

const appendFileWrite = (
  segments: AiMessageSegment[],
  path: string,
  language: string,
  code: string,
  closed: boolean,
) => {
  segments.push({ kind: 'tool-select', toolName: '写入文件' })
  segments.push({ kind: 'file', path, language, code, closed })
}

const appendMarkdown = (segments: AiMessageSegment[], raw: string) => {
  const content = raw.replace(/^\n+/, '').replace(/\n+$/, '')
  if (content.trim().length > 0) {
    segments.push({ kind: 'markdown', content })
  }
}

const appendMarkdownOrHtmlDocument = (segments: AiMessageSegment[], raw: string) => {
  if (!raw.trim()) return

  const htmlIndex = raw.search(HTML_DOCUMENT_PATTERN)
  if (htmlIndex >= 0 && !raw.includes(FENCE)) {
    appendMarkdown(segments, raw.slice(0, htmlIndex))
    appendFileWrite(
      segments,
      'index.html',
      'html',
      raw.slice(htmlIndex).replace(/^\n+/, '').replace(/\n+$/, ''),
      true,
    )
    return
  }

  appendMarkdown(segments, raw)
}

const appendFencedContent = (segments: AiMessageSegment[], raw: string) => {
  if (!raw) return

  let lastIndex = 0
  let searchFrom = 0
  FENCE_OPEN_PATTERN.lastIndex = 0

  while (searchFrom < raw.length) {
    FENCE_OPEN_PATTERN.lastIndex = searchFrom
    const open = FENCE_OPEN_PATTERN.exec(raw)
    if (!open) break

    const openStart = open.index
    appendMarkdownOrHtmlDocument(segments, raw.slice(lastIndex, openStart))

    const info = open[1] ?? ''
    const codeStart = open.index + open[0].length
    FENCE_CLOSE_PATTERN.lastIndex = codeStart
    const close = FENCE_CLOSE_PATTERN.exec(raw)

    if (close) {
      const { language, path } = resolveFileMeta(info)
      appendFileWrite(segments, path, language, raw.slice(codeStart, close.index), true)
      lastIndex = close.index + close[0].length
      searchFrom = lastIndex
    } else {
      const { language, path } = resolveFileMeta(info)
      appendFileWrite(segments, path, language, raw.slice(codeStart), false)
      return
    }
  }

  const rest = raw.slice(lastIndex)
  const dangling = rest.match(DANGLING_FENCE_PATTERN)
  if (dangling && dangling.index != null) {
    appendMarkdownOrHtmlDocument(segments, rest.slice(0, dangling.index))
    const { language, path } = resolveFileMeta(dangling[1] ?? '')
    appendFileWrite(segments, path, language, '', false)
    return
  }

  appendMarkdownOrHtmlDocument(segments, rest)
}

const parseToolCallPart = (segments: AiMessageSegment[], part: string) => {
  const normalized = part.trimStart()
  const firstLineBreak = normalized.indexOf('\n')
  const headerLine =
    firstLineBreak === -1 ? normalized : normalized.slice(0, firstLineBreak)
  const body = firstLineBreak === -1 ? '' : normalized.slice(firstLineBreak + 1)

  const header = headerLine.slice(TOOL_CALL_PREFIX.length).trim()

  const fileWriteMatch = header.match(FILE_WRITE_HEADER_PATTERN)
  if (fileWriteMatch?.groups?.path) {
    const trimmedBody = body.trimStart()
    const bodyMatch = trimmedBody.match(FILE_WRITE_BODY_PATTERN)
    if (bodyMatch?.groups) {
      const closed = bodyMatch[0].trimEnd().endsWith(FENCE)
      segments.push({
        kind: 'file',
        path: fileWriteMatch.groups.path.trim(),
        language: (bodyMatch.groups.language ?? '').trim(),
        code: bodyMatch.groups.code ?? '',
        closed,
      })
      appendFencedContent(segments, trimmedBody.slice(bodyMatch[0].length))
      return
    }
  }

  segments.push({
    kind: 'tool-call',
    header,
    body: body.trimEnd(),
  })
}

const parseToolSelectPart = (segments: AiMessageSegment[], part: string) => {
  const normalized = part.trimStart()
  const firstLineBreak = normalized.indexOf('\n')
  const headerLine =
    firstLineBreak === -1 ? normalized : normalized.slice(0, firstLineBreak)
  const rest = firstLineBreak === -1 ? '' : normalized.slice(firstLineBreak + 1)

  const toolName = headerLine.slice(TOOL_SELECT_PREFIX.length).trim() || '工具'
  segments.push({ kind: 'tool-select', toolName })
  appendFencedContent(segments, rest)
}

export function parseAiMessage(content: string): AiMessageSegment[] {
  if (!content) return []

  const normalized = content.replace(/\r\n/g, '\n')
  const segments: AiMessageSegment[] = []

  if (!HAS_TOOL_MARKER.test(normalized)) {
    appendFencedContent(segments, normalized)
    return segments
  }

  const parts = normalized.split(/(?=\[(?:选择工具|工具调用)\])/)

  for (const part of parts) {
    const trimmedStart = part.trimStart()
    if (!trimmedStart) continue

    if (trimmedStart.startsWith(TOOL_SELECT_PREFIX)) {
      parseToolSelectPart(segments, trimmedStart)
    } else if (trimmedStart.startsWith(TOOL_CALL_PREFIX)) {
      parseToolCallPart(segments, trimmedStart)
    } else {
      appendFencedContent(segments, part)
    }
  }

  return segments
}

/** 从若干条 AI 消息中提取写入过的文件路径 */
export function collectGeneratedFilePaths(contents: string[]): string[] {
  const paths = new Set<string>()
  for (const content of contents) {
    for (const segment of parseAiMessage(content)) {
      if (segment.kind === 'file' && segment.path) {
        paths.add(segment.path)
      }
    }
  }
  return [...paths]
}
