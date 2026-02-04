<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push('/dashboard');
};
</script>

<template>
  <div class="not-found">
    <div class="not-found__content">
      <h1 class="not-found__code">404</h1>
      <p class="not-found__message">页面不存在</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f0f2f5;

  &__content {
    text-align: center;
  }

  &__code {
    font-size: 120px;
    font-weight: 600;
    color: #409eff;
    margin: 0;
    line-height: 1;
  }

  &__message {
    font-size: 24px;
    color: #606266;
    margin: 20px 0 40px;
  }
}
</style>
