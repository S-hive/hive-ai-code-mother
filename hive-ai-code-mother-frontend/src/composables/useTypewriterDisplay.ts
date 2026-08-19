import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

type UseTypewriterDisplayOptions = {
  /** 每帧最少追加字符数 */
  minStep?: number
  /** 缓冲区落后超过该阈值时加速追赶 */
  catchUpThreshold?: number
}

/**
 * 将实时增长的文本以打字机方式逐字显示。
 * SSE 推送到 source，displayed 以动画方式追赶 source。
 */
export function useTypewriterDisplay(
  source: Ref<string>,
  active: Ref<boolean>,
  options: UseTypewriterDisplayOptions = {},
) {
  const { minStep = 2, catchUpThreshold = 60 } = options
  const displayed = ref('')
  let rafId = 0

  const cancel = () => {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  const computeStep = (behind: number) => {
    if (behind > catchUpThreshold * 4) return Math.ceil(behind / 6)
    if (behind > catchUpThreshold) return Math.ceil(behind / 12)
    return minStep
  }

  const tick = () => {
    rafId = 0
    const target = source.value
    let current = displayed.value

    // 新一轮回复会把 source 换成空串或另一段文本；displayed 若不是其前缀，必须清掉旧内容
    if (current.length > 0 && !target.startsWith(current)) {
      current = ''
      displayed.value = ''
    }

    if (current.length < target.length) {
      const step = computeStep(target.length - current.length)
      displayed.value = target.slice(0, current.length + step)
    }

    if (active.value) {
      rafId = requestAnimationFrame(tick)
    }
  }

  const sync = () => {
    cancel()
    if (!active.value) {
      displayed.value = source.value
      return
    }
    if (displayed.value.length > 0 && !source.value.startsWith(displayed.value)) {
      displayed.value = ''
    }
    rafId = requestAnimationFrame(tick)
  }

  watch(source, sync)
  watch(active, sync, { immediate: true })

  onBeforeUnmount(cancel)

  return { displayed }
}
