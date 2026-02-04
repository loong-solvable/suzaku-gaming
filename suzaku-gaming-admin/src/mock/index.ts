// src/mock/index.ts
import Mock from 'mockjs';
import './dashboard';
import './player';
import './audit';

// 设置延迟模拟网络请求
Mock.setup({
  timeout: '200-500'
});

console.log('[Mock] Mock.js initialized');
