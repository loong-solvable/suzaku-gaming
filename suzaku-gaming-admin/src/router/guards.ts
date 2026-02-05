// src/router/guards.ts
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { useUserStore } from '@/stores/user';

const WHITE_LIST = ['/login', '/403', '/404'];

export function setupRouterGuards(router: { beforeEach: (guard: (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => void) => void }) {
  router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    const userStore = useUserStore();

    // 白名单直接放行
    if (WHITE_LIST.includes(to.path)) {
      // 已登录用户访问 /login 时跳转首页
      if (to.path === '/login' && userStore.token) {
        next('/');
        return;
      }
      next();
      return;
    }

    // 未登录跳转登录页
    if (!userStore.token) {
      next({ path: '/login', query: { redirect: to.fullPath } });
      return;
    }

    // 有 token 但无 userInfo 时获取用户信息
    if (!userStore.userInfo) {
      try {
        await userStore.fetchUserInfo();
      } catch (error) {
        next({ path: '/login', query: { redirect: to.fullPath } });
        return;
      }
    }

    // 检查路由权限
    const requiredRoles = to.meta?.roles as string[] | undefined;
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = userStore.userInfo?.role;
      if (!userRole || !requiredRoles.includes(userRole)) {
        next('/403');
        return;
      }
    }

    next();
  });
}
