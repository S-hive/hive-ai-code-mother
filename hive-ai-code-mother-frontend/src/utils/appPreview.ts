const STATIC_BASE = 'http://localhost:8123/api/static'

export function buildAppPreviewUrl(codeGenType: string, appId: API.Id): string {
  return `${STATIC_BASE}/${codeGenType}_${appId}/`
}

export function buildAppDeployUrl(deployKey: string): string {
  return `http://localhost/${encodeURIComponent(deployKey)}`
}
