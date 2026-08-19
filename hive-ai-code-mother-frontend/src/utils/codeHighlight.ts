import hljs from 'highlight.js/lib/core'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import 'highlight.js/styles/github.min.css'

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

const LANGUAGE_ALIAS_MAP: Record<string, string> = {
  ...EXT_LANGUAGE_MAP,
  javascript: 'javascript',
  typescript: 'typescript',
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

/** 规范化 Markdown 围栏 / 文件后缀语言标识 */
export function normalizeHighlightLanguage(language?: string): string | undefined {
  if (!language) return undefined
  const key = language.trim().toLowerCase()
  return LANGUAGE_ALIAS_MAP[key] ?? (hljs.getLanguage(key) ? key : undefined)
}

function highlightWithLanguage(code: string, language?: string): string {
  if (language && hljs.getLanguage(language)) {
    try {
      return hljs.highlight(code, { language, ignoreIllegals: true }).value
    } catch {
      // fall through
    }
  }
  return hljs.highlightAuto(code, ['javascript', 'typescript', 'json', 'css', 'xml']).value
}

/** 将源码高亮为 HTML 字符串（按语言名或文件名） */
export function highlightCodeByLanguage(
  code: string,
  language?: string,
  fileName?: string,
): string {
  if (!code) return ''
  const normalized =
    normalizeHighlightLanguage(language) ??
    (fileName ? getLanguageFromFileName(fileName) : undefined)
  return highlightWithLanguage(code, normalized)
}

/** 将源码高亮为 HTML 字符串（按文件名） */
export function highlightCode(code: string, fileName: string): string {
  return highlightCodeByLanguage(code, undefined, fileName)
}
