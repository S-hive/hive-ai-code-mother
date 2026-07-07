<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface'
import { menuItems } from '@/config/menu'
import logoUrl from '@/assets/logo.png'

const SITE_TITLE = 'AI 零代码应用生成平台'

const route = useRoute()
const router = useRouter()

const selectedKeys = computed(() => {
  const match = menuItems.find((item) => item.path === route.path)
  return match ? [match.key] : []
})

const handleMenuClick = (info: MenuInfo) => {
  const item = menuItems.find((m) => m.key === info.key)
  if (item) {
    router.push(item.path)
  }
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <a-layout-header class="global-header">
    <div class="header-left" @click="goHome">
      <img :src="logoUrl" alt="logo" class="logo" />
      <span class="site-title">{{ SITE_TITLE }}</span>
    </div>
    <a-menu
      mode="horizontal"
      :selected-keys="selectedKeys"
      class="header-menu"
      @click="handleMenuClick"
    >
      <a-menu-item v-for="item in menuItems" :key="item.key">
        {{ item.label }}
      </a-menu-item>
    </a-menu>
    <div class="header-right">
      <a-button type="primary">登录</a-button>
    </div>
  </a-layout-header>
</template>

<style scoped>
.global-header {
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  height: 64px;
  line-height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
}

.logo {
  height: 32px;
  margin-right: 12px;
}

.site-title {
  font-size: 18px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
  white-space: nowrap;
}

.header-menu {
  flex: 1;
  min-width: 0;
  margin-left: 24px;
  border-bottom: none;
  background: transparent;
}

.header-right {
  flex-shrink: 0;
  margin-left: 24px;
}
</style>
