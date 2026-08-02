import { DEPLOY_ORIGIN, STATIC_BASE_URL } from '@/config/env'
import { CodeGenTypeEnum } from '@/utils/CodeGenType'

/**
 * 生成结果的源码目录地址，对应后端 tmp/code_output/{codeGenType}_{appId}
 */
export function buildAppSourceUrl(codeGenType: string, appId: API.Id): string {
  return `${STATIC_BASE_URL}/${codeGenType}_${appId}/`
}

/**
 * 可直接在 iframe 中打开的页面地址。
 * Vue 工程模式的源码无法直接运行，需要访问构建产物 dist 目录。
 */
export function buildAppPreviewUrl(codeGenType: string, appId: API.Id): string {
  const sourceUrl = buildAppSourceUrl(codeGenType, appId)
  return codeGenType === CodeGenTypeEnum.VUE_PROJECT ? `${sourceUrl}dist/` : sourceUrl
}

// 结尾的斜杠不能省略，否则页面内的相对资源路径会解析到上一级
export function buildAppDeployUrl(deployKey: string): string {
  return `${DEPLOY_ORIGIN}/${encodeURIComponent(deployKey)}/`
}
