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

// 新增归因更改表单（Phase 4：移除 teamLeader 由后端回填）
export interface AttributionForm {
  project: string;
  roleId: string;
  serverId: number;
  serverName?: string;
  roleName: string;
  platform: string;        // 存 cpsGroupCode（如 GroupA）
  teamMember: string;      // 存 memberCode（如 A-0001）
  attachments: string[];   // 必填 3-5 张
  remark?: string;
  applicant?: string;
}

// 角色绑定预校验结果
export interface RoleCheckResult {
  valid: boolean;       // 后端返回 valid
  bindable?: boolean;   // 兼容字段
  reason?: string;
  role?: {
    roleId: string;
    roleName: string;
    serverId: number;
    serverName: string;
  };
}

// Re-use PaginatedResponse from player.ts to avoid duplicate export
import type { PaginatedResponse } from './player';

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
  },

  // Phase 4: 角色绑定预校验
  checkRole(roleId: string): Promise<RoleCheckResult> {
    return request.get(`/audit/role-check/${encodeURIComponent(roleId)}`);
  }
};
