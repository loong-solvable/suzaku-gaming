// src/stores/user.ts
import { defineStore } from 'pinia';

interface UserInfo {
  id: number;
  username: string;
  realName: string;
  role: string;
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

    roleName(): string {
      const roleMap: Record<string, string> = {
        admin: '管理员',
        operator: '运营',
        viewer: '访客'
      };
      return roleMap[this.userInfo?.role || ''] || '未知角色';
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

    // 开发阶段使用
    mockLogin() {
      this.setToken('mock-token-12345');
      this.setUserInfo({
        id: 1,
        username: '3kadmin',
        realName: '管理员',
        role: 'admin',
        avatar: ''
      });
    },

    logout() {
      this.token = null;
      this.userInfo = null;
      localStorage.removeItem('token');
    }
  }
});
