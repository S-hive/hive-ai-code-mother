import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(join(root, 'src/utils/aiMessage.ts'), 'utf8')
  .replace(/export type AiMessageSegment =[\s\S]*?\n\n/, '')
  .replace(/new Set<string>\(\)/g, 'new Set()')
  .replace(/ as const/g, '')
  .replace(/: AiMessageSegment\[\]/g, '')
  .replace(/: Record<string, string>/g, '')
  .replace(/: RegExpExecArray \| null/g, '')
  .replace(/: string\[\]/g, '')
  .replace(/\(segments: AiMessageSegment\[\], /g, '(segments, ')
  .replace(/, part: string/g, ', part')
  .replace(/\(content: string\)/g, '(content)')
  .replace(/\(contents: string\[\]\)/g, '(contents)')
  .replace(/\(token: string\)/g, '(token)')
  .replace(/\(info: string\)/g, '(info)')
  .replace(/, raw: string/g, ', raw')
  .replace(/, path: string/g, ', path')
  .replace(/, language: string/g, ', language')
  .replace(/, code: string/g, ', code')
  .replace(/, closed: boolean/g, ', closed')
  .replace(/: string \| undefined/g, '')
  .replace(/: string/g, '')
  .replace(/: boolean/g, '')
  .replace(/: number/g, '')

const implPath = join(root, 'scripts/ai-message-parse-impl.mjs')
writeFileSync(implPath, source)

try {
  const { parseAiMessage, collectGeneratedFilePaths } = await import(
    `./ai-message-parse-impl.mjs?t=${Date.now()}`
  )

const kinds = (content) => parseAiMessage(content).map((s) => s.kind)

{
  const html = `这是一个登录页。\n\n\`\`\`html\n<!DOCTYPE html>\n<html><body>hi</body></html>\n\`\`\`\n\n以上为完整页面。`
  const segments = parseAiMessage(html)
  assert.deepEqual(
    segments.map((s) => s.kind),
    ['markdown', 'tool-select', 'file', 'markdown'],
    `HTML 模式应拆成说明 + 选择工具 + 文件卡片 + 说明，实际: ${JSON.stringify(segments)}`,
  )
  assert.equal(segments[1].toolName, '写入文件')
  assert.equal(segments[2].path, 'index.html')
  assert.equal(segments[2].language, 'html')
  assert.match(segments[2].code, /<!DOCTYPE html>/)
  assert.equal(segments[2].closed, true)
}

{
  const multi = [
    '生成三个文件。',
    '```html',
    '<!DOCTYPE html><html></html>',
    '```',
    '```css',
    'body { margin: 0; }',
    '```',
    '```javascript',
    'console.log(1)',
    '```',
  ].join('\n')
  const segments = parseAiMessage(multi)
  const files = segments.filter((s) => s.kind === 'file')
  assert.deepEqual(
    files.map((f) => f.path),
    ['index.html', 'style.css', 'script.js'],
  )
  assert.equal(segments.filter((s) => s.kind === 'tool-select').length, 3)
}

{
  const named = '```html src/pages/home.html\n<div/>\n```'
  const [file] = parseAiMessage(named).filter((s) => s.kind === 'file')
  assert.equal(file.path, 'src/pages/home.html')
}

{
  const streaming = '先写 HTML：\n```html\n<div class="box">'
  const segments = parseAiMessage(streaming)
  assert.deepEqual(kinds(streaming), ['markdown', 'tool-select', 'file'])
  assert.equal(segments[2].path, 'index.html')
  assert.equal(segments[2].closed, false)
  assert.match(segments[2].code, /class="box"/)
}

{
  const rawHtml = `<!DOCTYPE html>\n<html><head></head><body>raw</body></html>`
  const segments = parseAiMessage(rawHtml)
  assert.equal(segments.some((s) => s.kind === 'file' && s.path === 'index.html'), true)
  assert.equal(segments.some((s) => s.kind === 'markdown' && s.content.includes('<html>')), false)
}

{
  const vue = [
    '开始创建项目。',
    '[选择工具] 写入文件',
    '[工具调用] 写入文件 src/App.vue',
    '```vue',
    '<template><div>App</div></template>',
    '```',
  ].join('\n')
  const segments = parseAiMessage(vue)
  assert.deepEqual(
    segments.map((s) => s.kind),
    ['markdown', 'tool-select', 'file'],
  )
  assert.equal(segments[2].path, 'src/App.vue')
  assert.match(segments[2].code, /<template>/)
}

{
  const paths = collectGeneratedFilePaths([
    '```html\n<h1>a</h1>\n```\n```css\nbody{}\n```',
    '[工具调用] 写入文件 src/main.js\n```js\nconsole.log(1)\n```',
  ])
  assert.deepEqual(paths.sort(), ['index.html', 'src/main.js', 'style.css'].sort())
}

  console.log('ai-message-parse-check: all passed')
} finally {
  unlinkSync(implPath)
}
