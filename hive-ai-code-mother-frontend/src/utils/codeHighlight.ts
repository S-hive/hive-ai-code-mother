import hljs from 'highlight.js/lib/core'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('css', css)
hljs.registerLanguage('xml', xml)

const EXT_LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  json: 'json',
  css: 'css',
  html: 'xml',
  htm: 'xml',
  vue: 'xml',
  xml: 'xml',
  svg: 'xml',
}

/** 根据文件名推断 highlight.js 语言标识 */
export function getLanguageFromFileName(fileName: string): string | undefined {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (!ext) return undefined
  return EXT_LANGUAGE_MAP[ext]
}

/** 将源码高亮为 HTML 字符串 */
export function highlightCode(code: string, fileName: string): string {
  if (!code) return ''

  const language = getLanguageFromFileName(fileName)
  if (language && hljs.getLanguage(language)) {
    try {
      return hljs.highlight(code, { language, ignoreIllegals: true }).value
    } catch {
      // fall through
    }
  }

  return hljs.highlightAuto(code, ['javascript', 'typescript', 'json', 'css', 'xml']).value
}
