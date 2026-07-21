<script setup lang="ts">
import { message } from 'ant-design-vue'
import { PaperClipOutlined, ThunderboltOutlined, ArrowUpOutlined } from '@ant-design/icons-vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    loading?: boolean
    variant?: 'home' | 'chat'
  }>(),
  {
    placeholder: '使用 NoCode 创建一个高效的小工具，帮我计算......',
    loading: false,
    variant: 'home',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()

const onUpload = () => message.info('功能开发中')
const onOptimize = () => message.info('功能开发中')

const onSubmit = () => {
  if (props.loading) return
  if (!props.modelValue.trim()) {
    message.warning('请输入提示词')
    return
  }
  emit('submit')
}
</script>

<template>
  <div class="app-prompt-input" :class="variant">
    <a-textarea
      :value="modelValue"
      :placeholder="placeholder"
      :auto-size="{ minRows: variant === 'home' ? 4 : 3, maxRows: 8 }"
      :bordered="false"
      @update:value="emit('update:modelValue', $event)"
      @pressEnter.exact.prevent="onSubmit"
    />
    <div class="toolbar">
      <div class="toolbar-left">
        <a-button size="small" @click="onUpload">
          <template #icon><PaperClipOutlined /></template>
          上传
        </a-button>
        <a-button size="small" @click="onOptimize">
          <template #icon><ThunderboltOutlined /></template>
          优化
        </a-button>
      </div>
      <a-button
        type="primary"
        shape="circle"
        :loading="loading"
        :disabled="loading"
        @click="onSubmit"
      >
        <template #icon><ArrowUpOutlined /></template>
      </a-button>
    </div>
  </div>
</template>

<style scoped>
.app-prompt-input {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  padding: 12px 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}
</style>
