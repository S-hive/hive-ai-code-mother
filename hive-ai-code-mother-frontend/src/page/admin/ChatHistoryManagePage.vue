<template>
  <div id="chatHistoryManagePage">
    <a-form layout="inline" :model="searchParams" @finish="doSearch">
      <a-form-item label="消息内容">
        <a-input v-model:value="searchParams.message" placeholder="输入消息内容" />
      </a-form-item>
      <a-form-item label="消息类型">
        <a-select
          v-model:value="searchParams.messageType"
          :options="CHAT_MESSAGE_TYPE_OPTIONS"
          placeholder="请选择消息类型"
          allow-clear
          style="width: 160px"
        />
      </a-form-item>
      <a-form-item label="应用ID">
        <a-input-number v-model:value="searchParams.appId" :controls="false" />
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
        <template v-if="column.dataIndex === 'messageType'">
          {{ getChatMessageTypeLabel(record.messageType) }}
        </template>
        <template v-else-if="column.dataIndex === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { listAllChatHistoryByPageForAdmin } from '@/api/chatHistoryController'
import {
  CHAT_MESSAGE_TYPE_OPTIONS,
  getChatMessageTypeLabel,
} from '@/constants/chatMessageType'

const columns = [
  { title: 'id', dataIndex: 'id', width: 80 },
  { title: '消息内容', dataIndex: 'message', ellipsis: true },
  { title: '消息类型', dataIndex: 'messageType', width: 100 },
  { title: '应用ID', dataIndex: 'appId', width: 100 },
  { title: '用户ID', dataIndex: 'userId', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
]

const data = ref<API.ChatHistory[]>([])
const total = ref(0)

const searchParams = reactive<API.ChatHistoryQueryRequest>({
  pageNum: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
})

const fetchData = async () => {
  const res = await listAllChatHistoryByPageForAdmin({ ...searchParams })
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

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
#chatHistoryManagePage {
  padding: 24px;
  background: white;
  margin-top: 16px;
}
</style>
