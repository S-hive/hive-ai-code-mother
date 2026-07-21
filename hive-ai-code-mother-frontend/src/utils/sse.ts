export type StreamChatParams = {
  appId: API.Id
  message: string
  onMessage: (chunk: string) => void
  onDone: () => void
  onError: (err: Error) => void
}

/**
 * 连接后端 SSE 对话接口，返回取消函数。
 */
export function streamChatToGenCode(params: StreamChatParams): () => void {
  const { appId, message, onMessage, onDone, onError } = params
  const url =
    `http://localhost:8123/api/app/chat/gen/code` +
    `?appId=${encodeURIComponent(String(appId))}` +
    `&message=${encodeURIComponent(message)}`

  const es = new EventSource(url, { withCredentials: true })
  let settled = false

  const finish = (fn: () => void) => {
    if (settled) return
    settled = true
    es.close()
    fn()
  }

  es.onmessage = (ev) => {
    if (!ev.data) return
    try {
      const parsed = JSON.parse(ev.data) as { d?: string }
      if (typeof parsed.d === 'string' && parsed.d.length > 0) {
        onMessage(parsed.d)
      }
    } catch {
      // 非 JSON 时忽略或按纯文本追加
      if (ev.data !== '[DONE]') {
        onMessage(ev.data)
      }
    }
  }

  es.addEventListener('done', () => {
    finish(() => onDone())
  })

  es.onerror = () => {
    finish(() => onError(new Error('SSE 连接失败')))
  }

  return () => {
    finish(() => {})
  }
}
