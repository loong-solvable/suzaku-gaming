// src/utils/storage.ts

const PREFIX = 'suzaku_';

/**
 * 本地存储工具
 */
export const storage = {
  /**
   * 设置localStorage
   */
  set(key: string, value: unknown): void {
    try {
      const data = JSON.stringify(value);
      localStorage.setItem(PREFIX + key, data);
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  /**
   * 获取localStorage
   */
  get<T = unknown>(key: string, defaultValue?: T): T | null {
    try {
      const data = localStorage.getItem(PREFIX + key);
      if (data === null) {
        return defaultValue ?? null;
      }
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue ?? null;
    }
  },

  /**
   * 移除localStorage
   */
  remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  },

  /**
   * 清空所有自定义localStorage
   */
  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
};

/**
 * 会话存储工具
 */
export const sessionStorage = {
  set(key: string, value: unknown): void {
    try {
      const data = JSON.stringify(value);
      window.sessionStorage.setItem(PREFIX + key, data);
    } catch (error) {
      console.error('SessionStorage set error:', error);
    }
  },

  get<T = unknown>(key: string, defaultValue?: T): T | null {
    try {
      const data = window.sessionStorage.getItem(PREFIX + key);
      if (data === null) {
        return defaultValue ?? null;
      }
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('SessionStorage get error:', error);
      return defaultValue ?? null;
    }
  },

  remove(key: string): void {
    window.sessionStorage.removeItem(PREFIX + key);
  },

  clear(): void {
    const keys = Object.keys(window.sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(PREFIX)) {
        window.sessionStorage.removeItem(key);
      }
    });
  }
};
