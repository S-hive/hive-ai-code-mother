import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/page/HomePage.vue'
import UserManagePage from '@/page/admin/UserManagePage.vue'
import UserRegisterPage from '@/page/user/UserRegisterPage.vue'
import UserLoginPage from '@/page/user/UserLoginPage.vue'

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
    }
  ],
})

export default router
