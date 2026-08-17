import { API_BASE_URL, DEFAULT_REQUEST_TIMEOUT } from '@/config/env'

type DownloadErrorResponse = {
  code?: number
  message?: string
}

/**
 * 从 Content-Disposition 响应头解析下载文件名。
 * 兼容 attachment; filename="xxx.zip" 与 filename*=UTF-8''xxx.zip
 */
const parseFilenameFromDisposition = (disposition: string | null, fallback: string): string => {
  if (!disposition) return fallback

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;\n]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }

  const quotedMatch = disposition.match(/filename="([^"]+)"/i)
  if (quotedMatch?.[1]) return quotedMatch[1]

  const plainMatch = disposition.match(/filename=([^;\n]+)/i)
  if (plainMatch?.[1]) return plainMatch[1].trim()

  return fallback
}

/**
 * 下载应用源码 ZIP 包。
 * 使用 fetch 直接处理二进制响应，并根据 Content-Disposition 触发浏览器下载。
 */
export async function downloadAppCodeZip(appId: number | string): Promise<void> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT)

  try {
    const response = await fetch(
      `${API_BASE_URL}/app/download/${encodeURIComponent(String(appId))}`,
      {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal,
      },
    )

    const contentType = response.headers.get('content-type') ?? ''

    // 后端业务异常会返回 JSON，而非 application/zip
    if (!response.ok || contentType.includes('application/json')) {
      let errorMessage = '下载失败，请稍后重试'
      try {
        const payload = (await response.json()) as DownloadErrorResponse
        if (payload?.message) {
          errorMessage = payload.message
        }
      } catch {
        // 忽略 JSON 解析失败
      }
      throw new Error(errorMessage)
    }

    const blob = await response.blob()
    const disposition = response.headers.get('content-disposition')
    const filename = parseFilenameFromDisposition(disposition, `${appId}.zip`)

    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  } finally {
    window.clearTimeout(timeoutId)
  }
}
