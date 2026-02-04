// src/types/api.d.ts

// 通用响应格式（成功）
export interface ApiSuccessResponse<T> {
  code: 0;
  message: 'success';
  data: T;
  timestamp: number;
}

// 通用响应格式（错误）
export interface ApiErrorResponse {
  code: number; // 非0
  message: string;
  timestamp: number;
}

// 分页响应格式
export interface PaginatedResponse<T> {
  code: 0;
  message: 'success';
  data: {
    list: T[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
  timestamp: number;
}

// 分页请求参数
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
}

// Dashboard统计数据
export interface DashboardStatistics {
  today: {
    newPlayers: number;
    activePlayers: number;
    paidPlayers: number;
    paidAmount: number;
  };
  monthly: {
    newPlayers: number;
    activePlayers: number;
    paidPlayers: number;
    paidAmount: number;
  };
  total: {
    newPlayers: number;
    activePlayers: number;
    paidPlayers: number;
    paidAmount: number;
  };
}

// 角色数据
export interface Character {
  id: number;
  project: string;
  roleId: string;
  ucid: string;
  server: string;
  system: 'iOS' | 'Android';
  nickname: string;
  country: string;
  level: number;
  registerTime: string;
  lastLoginTime: string;
  lastUpdateTime: string;
  totalPayment: number;
  paymentCount: number;
  channel1: string;
}

// 订单数据
export interface Order {
  id: number;
  project: string;
  roleId: string;
  server: string;
  system: string;
  nickname: string;
  level: number;
  payTime: string;
  lastLoginTime: string;
  amount: number;
  currency: string;
  orderType: string;
  orderNo: string;
  payChannel: string;
  channel1: string;
}

// 绑定申请数据
export interface BindingApply {
  id: number;
  project: string;
  roleId: string;
  server: string;
  applicant: string;
  status: 'pending' | 'approved' | 'rejected';
  applyTime: string;
  remark?: string;
}

// 归因更改表单
export interface AttributionChangeForm {
  roleId: string;
  server: string;
  nickname: string;
  platform: string;
  leader: string;
  member: string;
  attachments?: string[];
}
