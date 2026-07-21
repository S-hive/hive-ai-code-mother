<template>
  <div id="appManagePage">
    <a-form layout="inline" :model="searchParams" @finish="doSearch">
      <a-form-item label="应用名称">
        <a-input v-model:value="searchParams.appName" placeholder="输入应用名称" />
      </a-form-item>
      <a-form-item label="生成类型">
        <a-input v-model:value="searchParams.codeGenType" placeholder="codeGenType" />
      </a-form-item>
      <a-form-item label="用户ID">
        <a-input-number v-model:value="searchParams.userId" :controls="false" />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>
    <a-divider />
    <a-table
      :columns="columns"
      :data-source="data"
      :pagination="pagination"
      row-key="id"
      @change="doTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'cover'">
          <a-image v-if="record.cover" :src="record.cover" :width="80" />
          <span v-else>-</span>
        </template>
        <template v-else-if="column.dataIndex === 'user'">
          {{ record.user?.userName || record.userId }}
        </template>
        <template v-else-if="column.dataIndex === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="link" @click="doEdit(record.id)">编辑</a-button>
            <a-button type="link" @click="doFeature(record.id)">精选</a-button>
            <a-button type="link" danger @click="doDelete(record.id)">删除</a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  deleteAppByAdmin,
  listAppVoByPageByAdmin,
  updateAppByAdmin,
} from '@/api/appController'

const router = useRouter()

const columns = [
  { title: 'id', dataIndex: 'id' },
  { title: '名称', dataIndex: 'appName' },
  { title: '封面', dataIndex: 'cover' },
  { title: '生成类型', dataIndex: 'codeGenType' },
  { title: '优先级', dataIndex: 'priority' },
  { title: '用户', dataIndex: 'user' },
  { title: '创建时间', dataIndex: 'createTime' },
  { title: '操作', key: 'action' },
]

const data = ref<API.AppVO[]>([])
const total = ref(0)

const searchParams = reactive<API.AppQueryRequest>({
  pageNum: 1,
  pageSize: 10,
})

const fetchData = async () => {
  const res = await listAppVoByPageByAdmin({ ...searchParams })
  if (res.data.code === 0 && res.data.data) {
    data.value = res.data.data.records ?? []
    total.value = res.data.data.totalRow ?? 0
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
}

const pagination = computed(() => ({
  current: searchParams.pageNum ?? 1,
  pageSize: searchParams.pageSize ?? 10,
  total: total.value,
  showSizeChanger: true,
  showTotal: (t: number) => `共 ${t} 条`,
}))

const doTableChange = (page: { current: number; pageSize: number }) => {
  searchParams.pageNum = page.current
  searchParams.pageSize = page.pageSize
  fetchData()
}

const doSearch = () => {
  searchParams.pageNum = 1
  fetchData()
}

const doEdit = (id?: number) => {
  if (id == null) return
  router.push(`/app/edit/${id}`)
}

const doFeature = (id?: number) => {
  if (id == null) return
  Modal.confirm({
    title: '设为精选？',
    content: '将把该应用优先级设置为 99',
    onOk: async () => {
      const res = await updateAppByAdmin({ id, priority: 99 })
      if (res.data.code === 0) {
        message.success('已设为精选')
        fetchData()
      } else {
        message.error('操作失败，' + res.data.message)
      }
    },
  })
}

const doDelete = (id?: number) => {
  if (id == null) return
  Modal.confirm({
    title: '确认删除该应用？',
    onOk: async () => {
      const res = await deleteAppByAdmin({ id })
      if (res.data.code === 0) {
        message.success('删除成功')
        fetchData()
      } else {
        message.error('删除失败，' + res.data.message)
      }
    },
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
#appManagePage {
  padding: 24px;
  background: white;
  margin-top: 16px;
}
</style>
