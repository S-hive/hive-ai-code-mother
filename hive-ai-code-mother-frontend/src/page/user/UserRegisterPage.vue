<template>
  <div id="userRegisterPage" class="flex flex-col items-center">
    <h1 class="title">hive AI 应用生成 - 用户注册</h1>
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
      <a-form-item
        name="checkPassword"
        label="确认密码"
        :rules="[
          { required: true, message: '请确认密码' },
          { min: 8, type: 'string', message: '密码长度不小于8位' },
          { validator: validateCheckPassword },
        ]"
      >
        <a-input-password v-model:value="formState.checkPassword" placeholder="请再次输入密码" />
      </a-form-item>
      <div class="tips">
        已有账号
        <RouterLink to="/user/login">去登录</RouterLink>
      </div>
      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%">注册</a-button>
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
import { reactive } from 'vue'
import { userRegister } from '@/api/userController.ts'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'

const router = useRouter()
const formState = reactive<API.UserRegisterRequest>({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
})

const validateCheckPassword = async (_rule: Rule, value: string) => {
  if (value && value !== formState.userPassword) {
    return Promise.reject('两次密码不一致')
  }
  return Promise.resolve()
}

const handleSubmit = async (values: API.UserRegisterRequest) => {
  const res = await userRegister(values)
  if (res.data.code === 0) {
    message.success('注册成功')
    router.push({
      path: '/user/login',
      query: { account: values.userAccount },
      replace: true,
    })
  } else {
    message.error('注册失败, ' + res.data.message)
  }
}
</script>
