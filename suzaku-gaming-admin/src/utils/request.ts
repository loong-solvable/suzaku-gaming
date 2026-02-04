// src/utils/request.ts
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;

    // 后端统一响应格式: { code, message, data, timestamp }
    // code === 0 或 code === 200 表示成功
    if (res.code === 0 || res.code === 200) {
      return res.data;
    }

    // 直接返回数据（用于 Mock 或不标准响应）
    if (res.list !== undefined || res.token !== undefined) {
      return res;
    }

    ElMessage.error(res.message || '请求失败');
    return Promise.reject(new Error(res.message));
  },
  (error) => {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        ElMessage.error('请求超时，请重试');
      } else if (error.code === 'ERR_CANCELED') {
        // 请求被取消，不显示错误
        return Promise.reject(error);
      } else {
        ElMessage.error('网络连接失败，请检查网络');
      }
      return Promise.reject(error);
    }

    const status = error.response.status;
    const errorMap: Record<number, string> = {
      400: '请求参数错误',
      401: '登录已过期，请重新登录',
      403: '没有权限访问',
      404: '请求的资源不存在',
      500: '服务器繁忙，请稍后重试',
      502: '网关错误',
      503: '服务暂时不可用'
    };

    ElMessage.error(errorMap[status] || `请求失败 (${status})`);

    return Promise.reject(error);
  }
);

// 请求重试封装
export const requestWithRetry = async <T>(
  config: AxiosRequestConfig,
  retries = 3,
  delay = 1000
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await service(config) as T;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
};

// 通用请求方法
export const request = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, config) as Promise<T>;
  },

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.post(url, data, config) as Promise<T>;
  },

  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.put(url, data, config) as Promise<T>;
  },

  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete(url, config) as Promise<T>;
  }
};

export default service;
