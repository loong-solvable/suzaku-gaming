// src/api/user.ts
import { request } from '@/utils/request';

export interface UserInfo {
  id: number;
  username: string;
  realName: string;
  role: string;
  level?: number;
  parentId?: number;
  cpsGroupCode?: string;
  memberCode?: string;
  avatar?: string;
  status: number;
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  username?: string;
  realName?: string;
  role?: string;
  status?: number;
  cpsGroupCode?: string;
}

export interface UserListResult {
  list: UserInfo[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateUserParams {
  username: string;
  password: string;
  realName: string;
  role: string;
  parentId?: number;
  cpsGroupCode?: string;
  avatar?: string;
}

export interface UpdateUserParams {
  password?: string;
  realName?: string;
  role?: string;
  parentId?: number;
  cpsGroupCode?: string;
  avatar?: string;
  status?: number;
}

export interface ParentOption {
  id: number;
  username: string;
  realName: string;
  role: string;
}

export const userApi = {
  // 获取用户列表
  getUsers(params?: UserListParams): Promise<UserListResult> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    return request.get(`/user/list?${query.toString()}`);
  },

  // 获取用户详情
  getUserById(id: number): Promise<UserInfo> {
    return request.get(`/user/${id}`);
  },

  // 创建用户
  createUser(params: CreateUserParams): Promise<UserInfo> {
    return request.post('/user/create', params);
  },

  // 更新用户
  updateUser(id: number, params: UpdateUserParams): Promise<UserInfo> {
    return request.put(`/user/${id}`, params);
  },

  // 切换用户状态
  toggleStatus(id: number): Promise<{ id: number; username: string; status: number }> {
    return request.post(`/user/${id}/toggle-status`);
  },

  // 获取可选的上级用户列表
  getParentOptions(): Promise<ParentOption[]> {
    return request.get('/user/parent-options');
  },

  // 获取组长和组员选项（用于归因申请）
  // R18: 返回同时包含旧 key（managers/operators）和新 key（groups/members）
  getTeamOptions(): Promise<{
    managers: { id: number; username: string; realName: string; cpsGroupCode?: string }[];
    operators: { id: number; username: string; realName: string; cpsGroupCode?: string; memberCode?: string; parentId?: number }[];
    groups: { id: number; username: string; realName: string; cpsGroupCode?: string }[];
    members: { id: number; username: string; realName: string; cpsGroupCode?: string; memberCode?: string; parentId?: number }[];
  }> {
    return request.get('/user/team-options');
  },
};
