<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const props = defineProps<{
  app: API.AppVO
  variant: 'mine' | 'good'
}>()

const router = useRouter()

const timeText = computed(() => {
  if (!props.app.createTime) return ''
  return dayjs(props.app.createTime).fromNow()
})

const goChat = () => {
  if (props.app.id == null) return
  router.push(`/app/chat/${props.app.id}`)
}
</script>

<template>
  <div class="app-card" @click="goChat">
    <div class="cover-wrap">
      <img
        v-if="app.cover"
        :src="app.cover"
        :alt="app.appName"
        class="cover"
      />
      <div v-else class="cover cover-placeholder">暂无封面</div>
    </div>
    <template v-if="variant === 'mine'">
      <div class="title">{{ app.appName || '未命名应用' }}</div>
      <div class="meta">{{ timeText }}</div>
    </template>
    <template v-else>
      <div class="good-footer">
        <a-avatar :src="app.user?.userAvatar" :size="28" />
        <div class="good-text">
          <div class="title">{{ app.appName || '未命名应用' }}</div>
          <div class="meta">{{ app.user?.userName || '未知作者' }}</div>
        </div>
        <a-tag v-if="app.codeGenType">{{ app.codeGenType }}</a-tag>
      </div>
    </template>
  </div>
</template>

<style scoped>
.app-card {
  cursor: pointer;
}

.cover-wrap {
  border-radius: 12px;
  overflow: hidden;
  background: #f0f0f0;
  aspect-ratio: 16 / 10;
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  height: 100%;
  min-height: 140px;
}

.title {
  margin-top: 10px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.meta {
  margin-top: 4px;
  font-size: 13px;
  color: #8c8c8c;
}

.good-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.good-text {
  flex: 1;
  min-width: 0;
}

.good-text .title {
  margin-top: 0;
}
</style>
