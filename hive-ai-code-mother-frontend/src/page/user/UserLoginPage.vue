<template>
  <div id="userLoginPage" class="flex flex-col items-center">
    <h1 class="title">hive AI 应用生成 - 用户登录</h1>
    <div class="desc">无手工, 纯添加, 写网站</div>
    <a-form :model="formState" :style="{ width: '600px', margin: '0 auto' }" @finish="handleSubmit">
      <a-form-item
        name="userAccount"
        label="账号"
        :rules="[{ required: true, message: '请输入账号' }]"
      >
        <a-input v-model:value="formState.userAccount" placeholder="请输入账号" />
      </a-form-item>
      <a-form-item
        name="userPassword"
        label="密码"
        :rules="[
          { required: true, message: '请输入密码' },
          { min: 8, type: 'string', message: '密码长度不小于8位' },
        ]"
      >
        <a-input-password v-model:value="formState.userPassword" placeholder="请输入密码" />
      </a-form-item>
      <div class="tips">
        没有账号
        <RouterLink to="/user/register">去注册</RouterLink>
      </div>
      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%">登录</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<style>
.title {
  text-align: center;
  margin-bottom: 16px;
  font-size: 28px;
}

.desc {
  text-align: center;
  color: #888;
  margin-bottom: 16px;
}

.tips {
  text-align: right;
  color: #888;
  margin-bottom: 16px;
}
</style>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue'
import { userLogin } from '@/api/userController.ts'
import { useRoute, useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { message } from 'ant-design-vue'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()
const formState = reactive<API.UserLoginRequest>({
  userAccount: '',
  userPassword: '',
})

onMounted(() => {
  const account = route.query.account
  if (typeof account === 'string' && account) {
    formState.userAccount = account
  }
})
const handleSubmit = async (values: API.UserLoginRequest) => {
  const res = await userLogin(values)
  if (res.data.code === 0 && res.data.data) {
    await loginUserStore.fetchLoginUser()
    message.success('登录成功')
    router.push({
      path: '/',
      replace: true,
    })
  } else {
    message.error('登录失败, ' + res.data.message)
  }
}
</script>
