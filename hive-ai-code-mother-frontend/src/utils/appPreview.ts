import { DEPLOY_ORIGIN, STATIC_BASE_URL } from '@/config/env'
import { CodeGenTypeEnum } from '@/utils/CodeGenType'

/**
 * 生成结果的源码目录地址，对应后端 tmp/code_output/{codeGenType}_{appId}
 */
export function buildAppSourceUrl(codeGenType: string, appId: number | string): string {
  return `${STATIC_BASE_URL}/${codeGenType}_${appId}/`
}

/**
 * 可直接在 iframe 中打开的页面地址（绝对路径，供 fetch 探测等场景使用）。
 * Vue 工程模式的源码无法直接运行，需要访问构建产物 dist 目录。
 */
export function buildAppPreviewUrl(codeGenType: string, appId: number | string): string {
  return `${window.location.origin}${buildAppPreviewPath(codeGenType, appId)}`
}

/**
 * 预览页相对路径。通过 Vite 代理 /api 后与主站同源，便于 iframe 可视化编辑通信。
 */
export function buildAppPreviewPath(codeGenType: string, appId: number | string): string {
  const deployKey = `${codeGenType}_${appId}`
  return codeGenType === CodeGenTypeEnum.VUE_PROJECT
    ? `/api/static/${deployKey}/dist/`
    : `/api/static/${deployKey}/`
}

// 结尾的斜杠不能省略，否则页面内的相对资源路径会解析到上一级
export function buildAppDeployUrl(deployKey: string): string {
  return `${DEPLOY_ORIGIN}/${encodeURIComponent(deployKey)}/`
}
