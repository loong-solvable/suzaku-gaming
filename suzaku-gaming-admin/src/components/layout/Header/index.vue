<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useUserStore } from "@/stores/user";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const userStore = useUserStore();

const breadcrumbs = computed(() => {
  return (route.meta.breadcrumb as string[]) || [];
});

// 是否显示返回按钮（非首页时显示）
const showBack = computed(() => {
  return route.path !== '/dashboard';
});

// 当前 Tab（用于高亮）
const currentTab = computed(() => {
  if (route.path.startsWith('/player-data')) return 'player-data';
  if (route.path.startsWith('/audit')) return 'audit';
  return 'dashboard';
});

const goBack = () => {
  router.back();
};

const goToDashboard = () => {
  router.push('/dashboard');
};

const handleLogout = () => {
  userStore.logout();
  router.push('/login');
};
</script>

<template>
  <header class="app-header">
    <div class="header-main">
      <div class="header-top">
        <div class="header-left">
          <span v-if="showBack" class="back-btn" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回</span>
          </span>
          <el-breadcrumb separator=">">
            <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
              <span class="breadcrumb-text">{{ item }}</span>
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click">
            <span class="more-action">
              更多操作 <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>刷新数据</el-dropdown-item>
                <el-dropdown-item>导出报表</el-dropdown-item>
                <el-dropdown-item>设置</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button size="small">
            <el-icon><Printer /></el-icon>
            <span>打印</span>
          </el-button>
          <el-dropdown>
            <div class="user-info">
              <el-avatar :size="32" :icon="'User'" />
              <div class="user-detail">
                <span class="username">{{ userStore.userInfo?.username || '3kadmin' }}</span>
                <span class="user-role">{{ userStore.roleName }}</span>
              </div>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人中心</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div class="header-tabs">
        <div 
          class="tab-item"
          :class="{ active: currentTab === 'dashboard' }"
          @click="goToDashboard"
        >
          概要面板
        </div>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  position: fixed;
  top: 0;
  right: 0;
  left: v-bind('appStore.sidebarWidth + "px"');
  min-height: 56px;
  display: flex;
  flex-direction: column;
  padding: 8px 20px;
  background-color: #FFFFFF;
  border-bottom: 1px solid #E4E7ED;
  z-index: 99;
  transition: left 0.3s ease;
}

.header-main {
  width: 100%;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    color: #409EFF;
    background: #F0F2F5;
  }

  .el-icon {
    font-size: 16px;
  }
}

.breadcrumb-text {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

:deep(.el-breadcrumb__separator) {
  color: #909399;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.more-action {
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    color: #409EFF;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-detail {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.3;
}

.username {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.user-role {
  font-size: 11px;
  color: #909399;
}

.header-tabs {
  margin-top: 8px;
  display: flex;
  gap: 0;
}

.tab-item {
  padding: 6px 16px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  border: 1px solid #DCDFE6;
  border-radius: 4px 4px 0 0;
  background: #F5F7FA;
  position: relative;
  transition: all 0.2s;

  &:hover {
    color: #409EFF;
  }

  &.active {
    color: #409EFF;
    background: #FFFFFF;
    border-bottom-color: #FFFFFF;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: #409EFF;
      border-radius: 4px 4px 0 0;
    }
  }
}
</style>
