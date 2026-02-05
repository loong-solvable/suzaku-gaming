// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

// 样式导入
import 'element-plus/dist/index.css';
import '@/assets/styles/index.scss';

import App from './App.vue';
import router from './router';
import { setupRouterGuards } from './router/guards';

// 开发环境启用Mock
if (import.meta.env.VITE_APP_MOCK === 'true') {
  import('./mock');
}

const app = createApp(App);

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 使用插件
app.use(createPinia());
app.use(router);
app.use(ElementPlus, {
  locale: zhCn,
  size: 'default'
});

// 启用路由守卫
setupRouterGuards(router);

// 挂载应用
app.mount('#app');
