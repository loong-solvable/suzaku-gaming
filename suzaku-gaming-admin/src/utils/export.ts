// src/utils/export.ts
import dayjs from 'dayjs';

interface ExportColumn {
  label: string;
  prop: string;
  formatter?: (value: unknown, row: Record<string, unknown>) => string;
}

/**
 * 导出CSV文件（UTF-8 BOM编码）
 */
export function exportCSV(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename?: string
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // 生成表头
  const headers = columns.map(col => `"${col.label}"`).join(',');

  // 生成数据行
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.prop];
      
      // 使用格式化函数
      if (col.formatter) {
        value = col.formatter(value, row);
      }

      // 处理特殊字符
      if (value === null || value === undefined) {
        return '""';
      }
      
      const strValue = String(value);
      // 如果包含逗号、引号或换行符，需要用引号包裹并转义内部引号
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      
      return `"${strValue}"`;
    }).join(',');
  });

  // 添加BOM头（UTF-8）
  const BOM = '\uFEFF';
  const csvContent = BOM + headers + '\n' + rows.join('\n');

  // 创建Blob并下载
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `导出_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * 生成导出文件名
 */
export function generateExportFilename(prefix: string, extension = 'csv'): string {
  return `${prefix}_${dayjs().format('YYYYMMDD_HHmmss')}.${extension}`;
}
