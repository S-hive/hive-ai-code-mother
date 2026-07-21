<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'

const route = useRoute()
const hideLayout = computed(() => route.meta.hideLayout === true)
</script>

<template>
  <a-layout class="basic-layout">
    <GlobalHeader v-if="!hideLayout" />
    <a-layout-content :class="hideLayout ? 'main-content-full' : 'main-content'">
      <router-view />
    </a-layout-content>
    <GlobalFooter v-if="!hideLayout" />
  </a-layout>
</template>

<style scoped>
.basic-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 24px;
  background: #f5f5f5;
}

.main-content-full {
  flex: 1;
  padding: 0;
  background: #fff;
  min-height: 100vh;
}
</style>
