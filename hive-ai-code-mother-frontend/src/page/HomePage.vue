<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import logoUrl from '@/assets/logo.png'
import AppPromptInput from '@/components/AppPromptInput.vue'
import AppCard from '@/components/AppCard.vue'
import { addApp, listGoodAppVoByPage, listMyAppVoByPage } from '@/api/appController'
import { useLoginUserStore } from '@/stores/loginUser'

const router = useRouter()
const loginUserStore = useLoginUserStore()
const isLogin = computed(() => !!loginUserStore.loginUser.id)

const prompt = ref('')
const creating = ref(false)

const SUGGESTIONS = ['波普风电商页面', '企业网站', '电商运营后台', '暗黑话题社区']

const myApps = ref<API.AppVO[]>([])
const myTotal = ref(0)
const myQuery = reactive<API.AppQueryRequest>({
  pageNum: 1,
  pageSize: 6,
  appName: '',
})

const goodApps = ref<API.AppVO[]>([])
const goodTotal = ref(0)
const goodQuery = reactive<API.AppQueryRequest>({
  pageNum: 1,
  pageSize: 6,
  appName: '',
})

const fetchMyApps = async () => {
  if (!isLogin.value) {
    myApps.value = []
    myTotal.value = 0
    return
  }
  const res = await listMyAppVoByPage({ ...myQuery })
  if (res.data.code === 0 && res.data.data) {
    myApps.value = res.data.data.records ?? []
    myTotal.value = res.data.data.totalRow ?? 0
  } else {
    message.error('获取我的作品失败，' + res.data.message)
  }
}

const fetchGoodApps = async () => {
  const res = await listGoodAppVoByPage({ ...goodQuery })
  if (res.data.code === 0 && res.data.data) {
    goodApps.value = res.data.data.records ?? []
    goodTotal.value = res.data.data.totalRow ?? 0
  } else {
    message.error('获取精选案例失败，' + res.data.message)
  }
}

const onCreate = async () => {
  if (!isLogin.value) {
    router.push('/user/login')
    return
  }
  const initPrompt = prompt.value.trim()
  if (!initPrompt) {
    message.warning('请输入提示词')
    return
  }
  creating.value = true
  try {
    const res = await addApp({ initPrompt })
    if (res.data.code === 0 && res.data.data) {
      const appId = res.data.data
      await router.push(`/app/chat/${appId}?init=1`)
    } else {
      message.error('创建应用失败，' + res.data.message)
    }
  } finally {
    creating.value = false
  }
}

const fillSuggestion = (text: string) => {
  prompt.value = text
}

watch(isLogin, () => {
  fetchMyApps()
})

onMounted(() => {
  fetchMyApps()
  fetchGoodApps()
})
</script>

<template>
  <div id="homePage">
    <section class="hero">
      <h1 class="hero-title">
        一句话
        <img :src="logoUrl" alt="logo" class="hero-logo" />
        呈所想
      </h1>
      <p class="hero-subtitle">与 AI 对话轻松创建应用和网站</p>
      <div class="prompt-wrap">
        <AppPromptInput
          v-model="prompt"
          :loading="creating"
          variant="home"
          @submit="onCreate"
        />
        <div class="suggestions">
          <button
            v-for="item in SUGGESTIONS"
            :key="item"
            type="button"
            class="suggestion-tag"
            @click="fillSuggestion(item)"
          >
            {{ item }}
          </button>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>我的作品</h2>
        <a-input-search
          v-model:value="myQuery.appName"
          placeholder="按名称搜索"
          style="width: 220px"
          allow-clear
          @search="() => { myQuery.pageNum = 1; fetchMyApps() }"
        />
      </div>
      <a-empty v-if="!isLogin" description="登录后查看我的作品" />
      <a-empty v-else-if="myApps.length === 0" description="暂无作品，试试上方创建" />
      <div v-else class="card-grid">
        <AppCard v-for="app in myApps" :key="app.id" :app="app" variant="mine" />
      </div>
      <div v-if="isLogin && myTotal > 0" class="pager">
        <a-pagination
          v-model:current="myQuery.pageNum"
          :page-size="myQuery.pageSize"
          :total="myTotal"
          @change="fetchMyApps"
        />
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>精选案例</h2>
        <a-input-search
          v-model:value="goodQuery.appName"
          placeholder="按名称搜索"
          style="width: 220px"
          allow-clear
          @search="() => { goodQuery.pageNum = 1; fetchGoodApps() }"
        />
      </div>
      <a-empty v-if="goodApps.length === 0" description="暂无精选案例" />
      <div v-else class="card-grid">
        <AppCard v-for="app in goodApps" :key="app.id" :app="app" variant="good" />
      </div>
      <div v-if="goodTotal > 0" class="pager">
        <a-pagination
          v-model:current="goodQuery.pageNum"
          :page-size="goodQuery.pageSize"
          :total="goodTotal"
          @change="fetchGoodApps"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
#homePage {
  max-width: 1100px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  padding: 48px 16px 32px;
  background: linear-gradient(180deg, #f7fafc 0%, #e8f6f8 55%, #e3eef8 100%);
  border-radius: 16px;
}

.hero-title {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 40px;
  font-weight: 700;
  margin: 0;
}

.hero-logo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.hero-subtitle {
  margin: 12px 0 28px;
  color: #8c8c8c;
}

.prompt-wrap {
  max-width: 720px;
  margin: 0 auto;
  text-align: left;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
  justify-content: center;
}

.suggestion-tag {
  border: none;
  background: #9aa3ad;
  color: #fff;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
}

.section {
  margin-top: 40px;
  padding: 0 8px 24px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-head h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.pager {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

@media (max-width: 900px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
  .hero-title {
    font-size: 28px;
  }
}
</style>
