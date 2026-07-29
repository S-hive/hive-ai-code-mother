export const CHAT_MESSAGE_TYPE_OPTIONS = [
  { label: '用户', value: 'user' },
  { label: 'AI', value: 'ai' },
] as const

export const getChatMessageTypeLabel = (messageType?: string) => {
  if (!messageType) {
    return '-'
  }

  return (
    CHAT_MESSAGE_TYPE_OPTIONS.find((option) => option.value === messageType)?.label ?? messageType
  )
}
