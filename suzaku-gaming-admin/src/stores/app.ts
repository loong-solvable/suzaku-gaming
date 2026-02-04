// src/stores/app.ts
import { defineStore } from 'pinia';

interface AppState {
  sidebarCollapsed: boolean;
  loading: boolean;
  networkStatus: 'online' | 'offline';
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    // 默认展开侧边栏（false = 展开）
    sidebarCollapsed: false,
    loading: false,
    networkStatus: 'online'
  }),

  getters: {
    sidebarWidth(): number {
      return this.sidebarCollapsed ? 64 : 220;
    }
  },

  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', String(this.sidebarCollapsed));
    },

    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed;
      localStorage.setItem('sidebarCollapsed', String(collapsed));
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },

    setNetworkStatus(status: 'online' | 'offline') {
      this.networkStatus = status;
    }
  }
});
