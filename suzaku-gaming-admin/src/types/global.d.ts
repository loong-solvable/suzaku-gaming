// src/types/global.d.ts

// 扩展Window类型
declare interface Window {
  // 可添加全局属性
}

// 环境变量类型
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_BASE_API: string;
  readonly VITE_APP_MOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 路由meta类型
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    icon?: string;
    breadcrumb?: string[];
    hidden?: boolean;
    keepAlive?: boolean;
  }
}
