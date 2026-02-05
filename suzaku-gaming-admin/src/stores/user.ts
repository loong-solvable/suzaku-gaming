// src/stores/user.ts
import { defineStore } from 'pinia';

interface UserInfo {
  id: number;
  username: string;
  realName: string;
  role: string;
  level?: number;           // 权限层级: 0=admin, 1=manager, 2=operator
  parentId?: number;        // 上级ID
  cpsGroupCode?: string;    // CPS 分组编码
  avatar?: string;
}

interface UserState {
  token: string | null;
  userInfo: UserInfo | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token'),
    userInfo: null
  }),

  getters: {
    isLoggedIn(): boolean {
      return !!this.token;
    },

    displayName(): string {
      return this.userInfo?.realName || this.userInfo?.username || '管理员';
    },

    // 修复：统一为 admin/manager/operator
    roleName(): string {
      const roleMap: Record<string, string> = {
        admin: '管理员',
        manager: '组长',
        operator: '组员'
      };
      return roleMap[this.userInfo?.role || ''] || '未知角色';
    },

    role(): string {
      return this.userInfo?.role || '';
    },

    level(): number {
      return this.userInfo?.level ?? 2;
    },

    cpsGroupCode(): string | undefined {
      return this.userInfo?.cpsGroupCode;
    },

    isAdmin(): boolean {
      return this.userInfo?.role === 'admin' || this.userInfo?.level === 0;
    },

    isManagerOrAbove(): boolean {
      const level = this.userInfo?.level;
      return typeof level === 'number' && level <= 1;
    }
  },

  actions: {
    setToken(token: string) {
      this.token = token;
      localStorage.setItem('token', token);
    },

    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo;
    },

    async fetchUserInfo() {
      try {
        const { authApi } = await import('@/api/auth');
        const userInfo = await authApi.getProfile();
        this.setUserInfo(userInfo);
        return userInfo;
      } catch (error) {
        this.logout();
        throw error;
      }
    },

    logout() {
      this.token = null;
      this.userInfo = null;
      localStorage.removeItem('token');
    }
  }
});
