const env = import.meta.env as Record<string, string | undefined>

const readOrigin = (value: string | undefined, fallback: string) => {
  const origin = value?.trim()
  return (origin && origin.length > 0 ? origin : fallback).replace(/\/+$/, '')
}

/** 后端服务地址 */
export const BACKEND_ORIGIN = readOrigin(env.VITE_BACKEND_ORIGIN, 'http://localhost:8123')

/** 后端接口前缀 */
export const API_BASE_URL = `${BACKEND_ORIGIN}/api`

/** 生成结果的静态资源前缀 */
export const STATIC_BASE_URL = `${API_BASE_URL}/static`

/** 已部署应用的访问地址前缀 */
export const DEPLOY_ORIGIN = readOrigin(env.VITE_DEPLOY_ORIGIN, 'http://localhost')

/** 常规接口超时时间 */
export const DEFAULT_REQUEST_TIMEOUT = 60 * 1000

/** 部署 Vue 工程时后端会同步执行 npm install 与 npm run build，需要远大于常规超时 */
export const DEPLOY_REQUEST_TIMEOUT = 10 * 60 * 1000

/** 等待 Vue 工程异步构建产物就绪的轮询配置 */
export const PREVIEW_POLL_INTERVAL = 2 * 1000
export const PREVIEW_POLL_TIMEOUT = 3 * 60 * 1000
