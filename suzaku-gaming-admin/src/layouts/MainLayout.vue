<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/stores/app';
import Sidebar from '@/components/layout/Sidebar/index.vue';
import Header from '@/components/layout/Header/index.vue';
import Watermark from '@/components/common/Watermark/index.vue';

const appStore = useAppStore();
const sidebarWidth = computed(() => appStore.sidebarWidth);
</script>

<template>
  <div class="main-layout">
    <Sidebar />
    <div 
      class="main-container" 
      :style="{ marginLeft: sidebarWidth + 'px' }"
    >
      <Header />
      <Watermark text="3kadmin" :font-size="14" color="rgba(0, 0, 0, 0.04)" :rotate="-20" :gap="120">
        <main class="main-content">
          <router-view />
        </main>
      </Watermark>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main-layout {
  min-height: 100vh;
  background: #FFFFFF;
}

.main-container {
  transition: margin-left 0.3s ease;
  background: #FFFFFF;
}

.main-content {
  padding: 12px 16px;
  min-height: calc(100vh - 80px);
  margin-top: 80px;
  background: #FFFFFF;
}
</style>
