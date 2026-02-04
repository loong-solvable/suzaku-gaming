// src/types/components.d.ts

// 筛选字段配置
export interface FilterField {
  key: string;
  label: string;
  type: 'input' | 'select' | 'daterange';
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  width?: string;
}

// 表格列配置
export interface TableColumn {
  prop: string;
  label: string;
  width?: string | number;
  minWidth?: string | number;
  sortable?: boolean | 'custom';
  fixed?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  formatter?: (row: Record<string, unknown>, column: TableColumn, cellValue: unknown) => string;
  slot?: string;
}

// 分页配置
export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  pageSizes?: number[];
  layout?: string;
}

// 统计卡片Props
export interface StatCardProps {
  title: string;
  dateRange: string;
  value: number;
  unit: string;
}

// 文件上传项
export interface FileItem {
  uid: string;
  name: string;
  url?: string;
  status: 'uploading' | 'success' | 'error';
  percentage?: number;
  raw?: File;
}

// 下拉选项
export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}
