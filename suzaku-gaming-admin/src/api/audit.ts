// src/api/audit.ts
import { request } from '@/utils/request';

// 绑定申请查询参数
export interface BindingApplyQueryParams {
  page: number;
  pageSize: number;
  project?: string;
  serverId?: string;
  roleId?: string;
  applicant?: string;
  status?: string;
  applyTimeStart?: string;
  applyTimeEnd?: string;
}

// 绑定申请数据
export interface BindingApply {
  id: number;
  project: string;
  roleId: string;
  roleName: string;
  serverId: number;
  serverName: string;
  applicant: string;
  platform: string;
  teamLeader: string;
  teamMember: string;
  status: 'pending' | 'approved' | 'rejected';
  applyTime: string;
  reviewTime?: string;
  reviewer?: string;
  attachments?: string[];
  remark?: string;
}

// 新增归因更改表单
export interface AttributionForm {
  project: string;
  roleId: string;
  serverId: number;
  roleName: string;
  platform: string;
  teamLeader: string;
  teamMember: string;
  attachments?: string[];
  remark?: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const auditApi = {
  getBindingApplies(params: BindingApplyQueryParams): Promise<PaginatedResponse<BindingApply>> {
    return request.get('/audit/binding-applies', { params });
  },

  getBindingApplyDetail(id: number): Promise<BindingApply> {
    return request.get(`/audit/binding-applies/${id}`);
  },

  createBindingApply(data: AttributionForm): Promise<BindingApply> {
    return request.post('/audit/binding-applies', data);
  },

  updateBindingApply(id: number, data: Partial<BindingApply>): Promise<BindingApply> {
    return request.put(`/audit/binding-applies/${id}`, data);
  },

  deleteBindingApply(id: number): Promise<void> {
    return request.delete(`/audit/binding-applies/${id}`);
  },

  reviewBindingApply(id: number, action: 'approve' | 'reject', remark?: string): Promise<BindingApply> {
    return request.post(`/audit/binding-applies/${id}/review`, { action, remark });
  },

  exportBindingApplies(params: Omit<BindingApplyQueryParams, 'page' | 'pageSize'>): Promise<Blob> {
    return request.get('/audit/binding-applies/export', {
      params,
      responseType: 'blob'
    });
  }
};
