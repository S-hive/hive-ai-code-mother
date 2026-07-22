export const CODE_GEN_TYPE_OPTIONS = [
  { label: '原生 HTML 模式', value: 'html' },
  { label: '原生多文件模式', value: 'multi_file' },
] as const

export const getCodeGenTypeLabel = (codeGenType?: string) => {
  if (!codeGenType) {
    return '-'
  }

  return (
    CODE_GEN_TYPE_OPTIONS.find((option) => option.value === codeGenType)?.label ?? codeGenType
  )
}
