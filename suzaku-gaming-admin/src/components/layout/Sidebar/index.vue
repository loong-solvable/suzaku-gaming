<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

const isCollapsed = computed(() => appStore.sidebarCollapsed);

const menuList = [
  {
    path: "/dashboard",
    title: "概要面板",
    icon: "House"
  },
  {
    path: "/player-data",
    title: "玩家数据报表",
    icon: "DataLine",
    children: [
      { path: "/player-data/role-list", title: "角色列表" },
      { path: "/player-data/order-list", title: "订单列表" }
    ]
  },
  {
    path: "/audit",
    title: "审核",
    icon: "Checked",
    children: [
      { path: "/audit/binding-apply", title: "绑定申请" }
    ]
  }
];

const handleMenuSelect = (path: string) => {
  router.push(path);
};

const activeMenu = computed(() => route.path);
</script>

<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-logo">
      <span v-if="!isCollapsed">Suzaku Gaming</span>
      <span v-else>SG</span>
    </div>
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapsed"
      background-color="#1e222d"
      text-color="#FFFFFF"
      active-text-color="#FFFFFF"
      @select="handleMenuSelect"
    >
      <template v-for="item in menuList" :key="item.path">
        <el-sub-menu v-if="item.children" :index="item.path">
          <template #title>
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </template>
          <el-menu-item
            v-for="child in item.children"
            :key="child.path"
            :index="child.path"
          >
            {{ child.title }}
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item v-else :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </template>
    </el-menu>
    <!-- 折叠/展开按钮 -->
    <div class="sidebar-toggle" @click="appStore.toggleSidebar">
      <el-icon v-if="isCollapsed"><Expand /></el-icon>
      <el-icon v-else><Fold /></el-icon>
      <span v-if="!isCollapsed">收起菜单</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 220px;
  background-color: #1e222d;
  transition: width 0.3s ease;
  z-index: 100;
  overflow: hidden;

  &.collapsed {
    width: 64px;
  }
}

.sidebar-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 50px;
}

:deep(.el-menu-item.is-active) {
  background-color: #409EFF !important;
}

.sidebar-toggle {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  cursor: pointer;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;

  &:hover {
    color: #FFFFFF;
    background: rgba(255, 255, 255, 0.1);
  }

  .el-icon {
    font-size: 18px;
  }
}
</style>
