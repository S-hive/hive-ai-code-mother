/**
 * 规范化封面图 URL。
 * COS 上传后可能缺少 https:// 协议头，浏览器会将其当作相对路径导致加载失败。
 */
export function normalizeCoverUrl(cover?: string): string | undefined {
  if (!cover) return undefined
  const trimmed = cover.trim()
  if (!trimmed) return undefined
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  // 形如 xxx.cos.ap-guangzhou.myqcloud.com/screenshots/...
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\//.test(trimmed)) {
    return `https://${trimmed}`
  }
  return trimmed
}
