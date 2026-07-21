import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/page/HomePage.vue'
import UserManagePage from '@/page/admin/UserManagePage.vue'
import AppManagePage from '@/page/admin/AppManagePage.vue'
import UserRegisterPage from '@/page/user/UserRegisterPage.vue'
import UserLoginPage from '@/page/user/UserLoginPage.vue'
import AppChatPage from '@/page/app/AppChatPage.vue'
import AppEditPage from '@/page/app/AppEditPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/user/login',
      name: '用户登录',
      component: UserLoginPage,
    },
    {
      path: '/user/register',
      name: '用户注册',
      component: UserRegisterPage,
    },
    {
      path: '/admin/userManage',
      name: '用户管理',
      component: UserManagePage,
    },
    {
      path: '/admin/appManage',
      name: '应用管理',
      component: AppManagePage,
    },
    {
      path: '/app/chat/:appId',
      name: '应用对话',
      component: AppChatPage,
      meta: { hideLayout: true },
    },
    {
      path: '/app/edit/:appId',
      name: '应用编辑',
      component: AppEditPage,
    },
  ],
})

export default router
