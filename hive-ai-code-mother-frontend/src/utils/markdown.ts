import { marked } from 'marked'
import { highlightCodeByLanguage } from '@/utils/codeHighlight'

const renderer = new marked.Renderer()

renderer.code = ({ text, lang }) => {
  const highlighted = highlightCodeByLanguage(text, lang)
  return `<pre class="hljs"><code class="hljs">${highlighted}</code></pre>`
}

marked.setOptions({
  breaks: true,
  gfm: true,
  renderer,
})

/** 将 Markdown 文本渲染为 HTML */
export function renderMarkdown(source: string): string {
  const text = source.trim()
  if (!text) return ''
  return marked.parse(text, { async: false }) as string
}
