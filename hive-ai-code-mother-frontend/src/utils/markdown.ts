import { marked } from 'marked'

marked.setOptions({
  breaks: true,
  gfm: true,
})

/** 将 Markdown 文本渲染为 HTML */
export function renderMarkdown(source: string): string {
  const text = source.trim()
  if (!text) return ''
  return marked.parse(text, { async: false }) as string
}
