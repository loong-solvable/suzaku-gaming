// src/stores/index.ts
import { createPinia } from 'pinia';

const pinia = createPinia();

export { pinia };
export { useAppStore } from './app';
export { useUserStore } from './user';
