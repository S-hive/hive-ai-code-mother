import { nextTick, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/** iframe 与主站通信的消息类型 */
export const VISUAL_EDIT_MESSAGE = {
  SELECT: 'VISUAL_EDIT_SELECT',
  ENABLE: 'VISUAL_EDIT_ENABLE',
  DISABLE: 'VISUAL_EDIT_DISABLE',
} as const

/** 用户在预览页选中的元素信息 */
export type VisualEditElementInfo = {
  tagName: string
  selector: string
  id?: string
  className?: string
  text?: string
  outerHTML?: string
}

const SCRIPT_MARKER = '__HIVE_VISUAL_EDIT_INSTALLED__'

/**
 * 注入到预览 iframe 内的可视化编辑脚本。
 * 负责悬浮高亮、点击选中，并通过 postMessage 将元素信息回传主站。
 */
const VISUAL_EDIT_INJECT_SCRIPT = `
(function () {
  if (window.${SCRIPT_MARKER}) return;
  window.${SCRIPT_MARKER} = true;

  var enabled = false;
  var hoveredEl = null;
  var selectedEl = null;
  var hoverOutline = '';
  var selectedOutline = '';

  function saveOutline(el) {
    return el.style.outline;
  }

  function restoreOutline(el, outline) {
    el.style.outline = outline;
  }

  function buildSelector(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return '#' + el.id;
    var parts = [];
    var current = el;
    while (current && current.nodeType === 1 && current.tagName !== 'HTML') {
      var part = current.tagName.toLowerCase();
      if (current.className && typeof current.className === 'string') {
        var classes = current.className.trim().split(/\\s+/).filter(Boolean).slice(0, 2);
        if (classes.length) part += '.' + classes.join('.');
      }
      parts.unshift(part);
      current = current.parentElement;
    }
    return parts.join(' > ');
  }

  function buildElementInfo(el) {
    return {
      tagName: el.tagName.toLowerCase(),
      selector: buildSelector(el),
      id: el.id || undefined,
      className: typeof el.className === 'string' ? el.className : undefined,
      text: (el.innerText || '').trim().slice(0, 120) || undefined,
      outerHTML: (el.outerHTML || '').slice(0, 400) || undefined,
    };
  }

  function clearHover() {
    if (hoveredEl && hoveredEl !== selectedEl) {
      restoreOutline(hoveredEl, hoverOutline);
    }
    hoveredEl = null;
    hoverOutline = '';
  }

  function clearSelected() {
    if (selectedEl) {
      restoreOutline(selectedEl, selectedOutline);
    }
    selectedEl = null;
    selectedOutline = '';
  }

  function setHover(el) {
    if (!el || el === document.documentElement || el === document.body) return;
    if (el === selectedEl) return;
    clearHover();
    hoveredEl = el;
    hoverOutline = saveOutline(el);
    el.style.outline = '2px dashed #1677ff';
    el.style.outlineOffset = '1px';
  }

  function setSelected(el) {
    if (!el || el === document.documentElement || el === document.body) return;
    clearHover();
    clearSelected();
    selectedEl = el;
    selectedOutline = saveOutline(el);
    el.style.outline = '3px solid #0958d9';
    el.style.outlineOffset = '1px';
    window.parent.postMessage(
      { type: '${VISUAL_EDIT_MESSAGE.SELECT}', payload: buildElementInfo(el) },
      window.location.origin,
    );
  }

  function disableEdit() {
    enabled = false;
    clearHover();
    clearSelected();
    document.body.style.cursor = '';
  }

  document.addEventListener(
    'mouseover',
    function (event) {
      if (!enabled) return;
      setHover(event.target);
    },
    true,
  );

  document.addEventListener(
    'mouseout',
    function (event) {
      if (!enabled) return;
      if (event.target === hoveredEl) clearHover();
    },
    true,
  );

  document.addEventListener(
    'click',
    function (event) {
      if (!enabled) return;
      event.preventDefault();
      event.stopPropagation();
      setSelected(event.target);
    },
    true,
  );

  window.addEventListener('message', function (event) {
    if (event.origin !== window.location.origin) return;
    if (!event.data || !event.data.type) return;
    if (event.data.type === '${VISUAL_EDIT_MESSAGE.ENABLE}') {
      enabled = true;
      document.body.style.cursor = 'crosshair';
    }
    if (event.data.type === '${VISUAL_EDIT_MESSAGE.DISABLE}') {
      disableEdit();
    }
  });
})();
`

/** 将选中元素格式化为可追加到提示词中的文本 */
export function formatSelectedElementPrompt(element: VisualEditElementInfo): string {
  const lines = [
    `标签: ${element.tagName}`,
    `选择器: ${element.selector}`,
  ]
  if (element.id) lines.push(`ID: ${element.id}`)
  if (element.className) lines.push(`类名: ${element.className}`)
  if (element.text) lines.push(`文本: ${element.text}`)
  if (element.outerHTML) lines.push(`HTML片段: ${element.outerHTML}`)
  return lines.join('\n')
}

/** Alert 展示用的单行摘要 */
export function formatSelectedElementSummary(element: VisualEditElementInfo): string {
  const label = element.selector || element.tagName
  const text = element.text ? ` · ${element.text.slice(0, 40)}` : ''
  return `<${element.tagName}> ${label}${text}`
}

function getIframeWindow(iframe: HTMLIFrameElement | null): Window | null {
  try {
    return iframe?.contentWindow ?? null
  } catch {
    return null
  }
}

function getIframeDocument(iframe: HTMLIFrameElement | null): Document | null {
  try {
    return iframe?.contentDocument ?? null
  } catch {
    return null
  }
}

/** 向预览 iframe 注入可视化编辑脚本（需同源） */
export function injectVisualEditScript(iframe: HTMLIFrameElement | null): boolean {
  const doc = getIframeDocument(iframe)
  if (!doc || !doc.body) return false
  const iframeWindow = doc.defaultView as (Window & { [key: string]: unknown }) | null
  if (iframeWindow?.[SCRIPT_MARKER]) {
    return true
  }

  const script = doc.createElement('script')
  script.type = 'text/javascript'
  script.text = VISUAL_EDIT_INJECT_SCRIPT
  doc.body.appendChild(script)
  return true
}

/** 向 iframe 发送启用/禁用编辑模式指令 */
export function postVisualEditCommand(
  iframe: HTMLIFrameElement | null,
  type: typeof VISUAL_EDIT_MESSAGE.ENABLE | typeof VISUAL_EDIT_MESSAGE.DISABLE,
): void {
  const target = getIframeWindow(iframe)
  if (!target) return
  target.postMessage({ type }, window.location.origin)
}

/** 在用户消息前追加选中元素上下文 */
export function appendSelectedElementToMessage(
  message: string,
  element: VisualEditElementInfo | null,
): string {
  const trimmed = message.trim()
  if (!element) return trimmed
  return `${trimmed}\n\n[选中元素信息]\n${formatSelectedElementPrompt(element)}`
}

/**
 * 可视化编辑 composable：管理编辑模式、元素选中、iframe 脚本注入与消息监听。
 */
export function useVisualEdit(previewIframe: Ref<HTMLIFrameElement | null>) {
  const editMode = ref(false)
  const selectedElement = ref<VisualEditElementInfo | null>(null)

  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return
    if (event.data?.type !== VISUAL_EDIT_MESSAGE.SELECT) return
    selectedElement.value = event.data.payload as VisualEditElementInfo
  }

  const syncIframeEditor = async () => {
    await nextTick()
    const iframe = previewIframe.value
    if (!iframe || !editMode.value) return

    const activate = () => {
      if (!injectVisualEditScript(iframe)) return
      postVisualEditCommand(iframe, VISUAL_EDIT_MESSAGE.ENABLE)
    }

    if (iframe.contentDocument?.readyState === 'complete') {
      activate()
    } else {
      iframe.addEventListener('load', activate, { once: true })
    }
  }

  const enterEditMode = async () => {
    editMode.value = true
    await syncIframeEditor()
  }

  const exitEditMode = () => {
    postVisualEditCommand(previewIframe.value, VISUAL_EDIT_MESSAGE.DISABLE)
    editMode.value = false
  }

  const toggleEditMode = async () => {
    if (editMode.value) {
      exitEditMode()
    } else {
      await enterEditMode()
    }
  }

  const clearSelection = () => {
    selectedElement.value = null
  }

  const resetVisualEdit = () => {
    clearSelection()
    exitEditMode()
  }

  const onPreviewFrameLoad = () => {
    if (editMode.value) {
      void syncIframeEditor()
    }
  }

  onMounted(() => {
    window.addEventListener('message', handleMessage)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('message', handleMessage)
    exitEditMode()
  })

  return {
    editMode,
    selectedElement,
    enterEditMode,
    exitEditMode,
    toggleEditMode,
    clearSelection,
    resetVisualEdit,
    onPreviewFrameLoad,
  }
}
