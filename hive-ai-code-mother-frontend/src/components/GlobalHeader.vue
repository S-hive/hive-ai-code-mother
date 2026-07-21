<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface'
import { LogoutOutlined } from '@ant-design/icons-vue'
import { menuItems as originMenuItems, type MenuItem } from '@/config/menu'
import logoUrl from '@/assets/logo.png'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { userLogout } from '@/api/userController.ts'
import { message } from 'ant-design-vue'

const SITE_TITLE = 'AI 零代码应用生成平台'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

const filterMenus = (menus: MenuItem[]) => {
  return menus.filter((menu) => {
    if (menu.key.startsWith('/admin')) {
      const loginUser = loginUserStore.loginUser
      if (!loginUser.id || loginUser.userRole !== 'admin') {
        return false
      }
    }
    return true
  })
}

const visibleMenuItems = computed(() => filterMenus(originMenuItems))

const selectedKeys = computed(() => {
  const match = visibleMenuItems.value.find((item) => item.path === route.path)
  return match ? [match.key] : []
})

const handleMenuClick = (info: MenuInfo) => {
  const item = visibleMenuItems.value.find((m) => m.key === info.key)
  if (item) {
    router.push(item.path)
  }
}

const goHome = () => {
  router.push('/')
}

const doLogout = async () => {
  const res = await userLogout()
  if (res.data.code === 0) {
    loginUserStore.setLoginUser({
      userName: '未登录',
    })
    message.success('退出登录成功')
    await router.push('/user/login')
  } else {
    message.error('退出登录失败, ' + res.data.message)
  }
}
</script>

<template>
  <a-layout-header class="global-header" :class="{ 'home-header': route.path === '/' }">
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
      <a-menu-item v-for="item in visibleMenuItems" :key="item.key">
        {{ item.label }}
      </a-menu-item>
    </a-menu>
    <div class="header-right">
      <div v-if="loginUserStore.loginUser.id">
        <a-dropdown>
          <a-space>
            <a-avatar :src="loginUserStore.loginUser.userAvatar" />
            {{ loginUserStore.loginUser.userName ?? '无名' }}
          </a-space>
          <template #overlay>
            <a-menu>
              <a-menu-item @click="doLogout">
                <LogoutOutlined />
                退出登录
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
      <div v-else>
        <a-button type="primary" href="/user/login">登录</a-button>
      </div>
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

.home-header {
  background: transparent;
  border-bottom-color: transparent;
}

.global-header :deep(.ant-menu-item:hover),
.global-header :deep(.ant-menu-item-selected) {
  color: #1677ff;
  background: transparent;
}

.global-header :deep(.ant-menu-item::after) {
  border-bottom: none !important;
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
