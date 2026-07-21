const STATIC_BASE = 'http://localhost:8123/api/static'

export function buildAppPreviewUrl(codeGenType: string, appId: number): string {
  return `${STATIC_BASE}/${codeGenType}_${appId}/`
}
