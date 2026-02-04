// src/utils/format.ts
import dayjs from 'dayjs';

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | Date | number, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return '';
  return dayjs(date).format(format);
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date | number, format = 'YYYY-MM-DD'): string {
  if (!date) return '';
  return dayjs(date).format(format);
}

/**
 * 格式化数字（千分位）
 */
export function formatNumber(value: number | string, decimals?: number): string {
  if (value === null || value === undefined || value === '') return '';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '';

  if (decimals !== undefined) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  return num.toLocaleString('en-US');
}

/**
 * 格式化金额（带货币符号）
 */
export function formatCurrency(value: number | string, currency = 'USD'): string {
  if (value === null || value === undefined || value === '') return '';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '';

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' ' + currency;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取当前日期范围描述
 */
export function getDateRangeLabel(type: 'today' | 'month' | 'total'): string {
  const today = dayjs();
  
  switch (type) {
    case 'today':
      return today.format('YYYY-MM-DD') + ' ' + ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][today.day()];
    case 'month':
      return today.format('YYYY年MM月');
    case 'total':
      return '历史累计';
    default:
      return '';
  }
}
