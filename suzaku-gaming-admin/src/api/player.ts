// src/api/player.ts
import { request } from '@/utils/request';

// 角色查询参数
export interface RoleQueryParams {
  page: number;
  pageSize: number;
  project?: string;
  serverId?: string;
  channel?: string;
  system?: string;
  timezone?: string;
  roleId?: string;
  roleName?: string;
  registerTimeStart?: string;
  registerTimeEnd?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 角色数据
export interface Role {
  id: number;
  roleId: string;
  roleName: string;
  serverId: number;
  serverName: string;
  level: number;
  vipLevel: number;
  totalRecharge: number;
  rechargeCount: number;
  registerTime: string;
  lastLoginTime: string;
  country: string;
  countryCode: string;
  deviceType: string;
  channelId: number;
  status: 'active' | 'inactive' | 'banned';
}

// 分页响应
export interface PaginatedResponse<T> {
  list: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 订单查询参数
export interface OrderQueryParams {
  page: number;
  pageSize: number;
  project?: string;
  serverId?: string;
  channel?: string;
  orderType?: string;
  system?: string;
  timezone?: string;
  roleId?: string;
  roleName?: string;
  payTimeStart?: string;
  payTimeEnd?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 订单数据
export interface Order {
  id: number;
  orderId: string;
  roleId: string;
  roleName: string;
  roleLevel: number;
  serverId: number;
  serverName: string;
  amount: number;
  currency: string;
  currencyAmount: number;
  goodsId: string;
  payTime: string;
  payChannel: string;
  rechargeType: string;
  country: string;
  deviceType: string;
  isSandbox: boolean;
}

// 订单列表响应（含累计金额）
export interface OrderListResponse {
  list: Order[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalAmount: number;
    totalCount: number;
  };
}

export const playerApi = {
  getRoles(params: RoleQueryParams): Promise<PaginatedResponse<Role>> {
    return request.get('/player/roles', { params });
  },

  getOrders(params: OrderQueryParams): Promise<OrderListResponse> {
    return request.get('/player/orders', { params });
  },

  exportRoles(params: Omit<RoleQueryParams, 'page' | 'pageSize'>): Promise<Blob> {
    return request.get('/player/roles/export', {
      params,
      responseType: 'blob'
    });
  },

  exportOrders(params: Omit<OrderQueryParams, 'page' | 'pageSize'>): Promise<Blob> {
    return request.get('/player/orders/export', {
      params,
      responseType: 'blob'
    });
  }
};
