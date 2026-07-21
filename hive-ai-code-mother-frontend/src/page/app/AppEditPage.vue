<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  getAppVoById,
  getAppVoByIdByAdmin,
  updateApp,
  updateAppByAdmin,
} from '@/api/appController'
import { useLoginUserStore } from '@/stores/loginUser'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

const appId = computed(() => Number(route.params.appId))
const isAdmin = computed(() => loginUserStore.loginUser.userRole === 'admin')
const loading = ref(false)
const saving = ref(false)

const form = reactive({
  appName: '',
  cover: '',
  priority: 0,
})

const load = async () => {
  loading.value = true
  try {
    const res = isAdmin.value
      ? await getAppVoByIdByAdmin({ id: appId.value })
      : await getAppVoById({ id: appId.value })
    if (res.data.code === 0 && res.data.data) {
      form.appName = res.data.data.appName ?? ''
      form.cover = res.data.data.cover ?? ''
      form.priority = res.data.data.priority ?? 0
    } else {
      message.error('加载失败，' + res.data.message)
    }
  } finally {
    loading.value = false
  }
}

const onSave = async () => {
  if (!form.appName.trim()) {
    message.warning('请输入应用名称')
    return
  }
  saving.value = true
  try {
    const res = isAdmin.value
      ? await updateAppByAdmin({
          id: appId.value,
          appName: form.appName,
          cover: form.cover,
          priority: form.priority,
        })
      : await updateApp({
          id: appId.value,
          appName: form.appName,
        })
    if (res.data.code === 0) {
      message.success('保存成功')
      router.back()
    } else {
      message.error('保存失败，' + res.data.message)
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  load()
})
</script>

<template>
  <div id="appEditPage">
    <h2>编辑应用信息</h2>
    <a-spin :spinning="loading">
      <a-form layout="vertical" style="max-width: 560px" @finish="onSave">
        <a-form-item label="应用名称" required>
          <a-input v-model:value="form.appName" placeholder="请输入应用名称" />
        </a-form-item>
        <template v-if="isAdmin">
          <a-form-item label="封面 URL">
            <a-input v-model:value="form.cover" placeholder="请输入封面地址" />
          </a-form-item>
          <a-form-item label="优先级">
            <a-input-number v-model:value="form.priority" style="width: 100%" />
          </a-form-item>
        </template>
        <a-form-item>
          <a-space>
            <a-button @click="router.back()">取消</a-button>
            <a-button type="primary" html-type="submit" :loading="saving">保存</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-spin>
  </div>
</template>

<style scoped>
#appEditPage {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}
</style>
