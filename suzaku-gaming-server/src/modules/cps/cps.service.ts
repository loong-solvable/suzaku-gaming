// src/modules/cps/cps.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import * as dayjs from 'dayjs';
import {
  CheckBindingDto,
  CheckBindingResponseDto,
  CreateBindingDto,
  CreateBindingResponseDto,
  QueryBindingsDto,
  QueryFailLogsDto,
  QueryRechargeLogsDto,
  QueryLoginLogsDto,
  RechargeSummaryDto,
} from './dto';

// ThinkingData API 响应接口
interface TAQueryResponse {
  return_code: number;
  return_message: string;
  result?: {
    columns: string[];
    rows: any[][];
  };
}

// 当前用户接口
interface CurrentUser {
  id: number;
  username: string;
  role: string;
  level?: number;
  cpsGroupCode?: string;
}

@Injectable()
export class CpsService {
  private readonly logger = new Logger(CpsService.name);
  private readonly apiHost: string;
  private readonly projectToken: string;
  private readonly userView: string;
  private readonly eventView: string;
  private readonly cpsDimTable: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiHost = this.configService.get<string>('TA_API_HOST') || '';
    this.projectToken = this.configService.get<string>('TA_PROJECT_TOKEN') || '';
    this.userView = this.configService.get<string>('TA_USER_VIEW') || 'ta.v_user_22';
    this.eventView = this.configService.get<string>('TA_EVENT_VIEW') || 'v_event_22';
    this.cpsDimTable = this.configService.get<string>('TA_CPS_DIM_TABLE') || 'ta_dim.dim_22_0_518509';
  }

  /**
   * 构建数据隔离过滤条件（绑定相关）
   * Admin: 可查看所有数据
   * Manager: 只能查看本组数据（按 cpsGroup 过滤）
   * Operator: 只能查看自己创建的数据（按 operatorId 过滤）
   */
  private buildDataFilter(currentUser?: CurrentUser, query: any = {}): any {
    if (!currentUser) return {};

    // Admin (level === 0) 可以使用任何过滤条件
    if (typeof currentUser.level === 'number' && currentUser.level === 0) {
      return query.cpsGroup ? { cpsGroup: query.cpsGroup } : {};
    }

    // Manager (level === 1): 强制按 cpsGroup 过滤，忽略传入参数
    if (typeof currentUser.level === 'number' && currentUser.level === 1) {
      return { cpsGroup: currentUser.cpsGroupCode };
    }

    // Operator (level === 2): 强制按 operatorId 过滤
    return { operatorId: currentUser.id };
  }

  /**
   * 构建 CPS 数据过滤条件（充值/登录日志）
   * Admin: 可查看所有数据
   * Manager: 只能查看本组数据
   * Operator: 只能查看本组数据（与 Manager 相同）
   */
  private buildCpsGroupFilter(currentUser?: CurrentUser, query: any = {}): any {
    if (!currentUser) return {};

    // Admin (level === 0) 可以使用任何过滤条件
    if (typeof currentUser.level === 'number' && currentUser.level === 0) {
      return query.cpsGroup ? { cpsGroup: query.cpsGroup } : {};
    }

    // Manager/Operator: 强制按 cpsGroup 过滤
    if (currentUser.cpsGroupCode) {
      return { cpsGroup: currentUser.cpsGroupCode };
    }

    return {};
  }

  // ===== 绑定判断 =====

  /**
   * 检查角色是否可绑定
   * 判断逻辑：查询 tf_medium，只有 Organic / 自然量 / WA_CPS_link% 才允许绑定
   */
  async checkBinding(dto: CheckBindingDto): Promise<CheckBindingResponseDto> {
    const { roleId, accountId } = dto;

    if (!roleId && !accountId) {
      throw new BadRequestException('roleId 或 accountId 至少提供一个');
    }

    // 1. 首先从本地数据库查询角色信息
    let roleInfo = null;
    let actualAccountId = accountId;

    if (roleId) {
      roleInfo = await this.prisma.role.findUnique({
        where: { roleId },
        select: {
          roleId: true,
          accountId: true,
          roleName: true,
          serverId: true,
          serverName: true,
          registerTime: true,
          lastLoginTime: true,
          cpsGroup: true,
          tfMedium: true,
        },
      });

      if (roleInfo) {
        actualAccountId = roleInfo.accountId || accountId;

        // 如果已经绑定
        if (roleInfo.cpsGroup) {
          return {
            canBind: false,
            roleId,
            accountId: actualAccountId,
            tfMedium: roleInfo.tfMedium,
            failReason: `该角色已绑定到 CPS 分组: ${roleInfo.cpsGroup}`,
            roleInfo: {
              roleName: roleInfo.roleName,
              serverName: roleInfo.serverName,
              serverId: roleInfo.serverId,
              registerTime: roleInfo.registerTime,
              lastLoginTime: roleInfo.lastLoginTime,
            },
          };
        }
      }
    }

    // 2. 调用 ThinkingData API 查询 tf_medium
    const queryId = actualAccountId || roleId;
    if (!queryId) {
      return {
        canBind: false,
        roleId,
        accountId,
        failReason: '无法确定查询标识',
      };
    }

    try {
      const tfMedium = await this.queryTfMedium(queryId);

      // 3. 判断是否可绑定
      const canBind = this.isBindableByTfMedium(tfMedium);

      return {
        canBind,
        roleId,
        accountId: actualAccountId,
        tfMedium,
        failReason: canBind ? undefined : '该角色为买量用户，不可绑定',
        roleInfo: roleInfo
          ? {
              roleName: roleInfo.roleName,
              serverName: roleInfo.serverName,
              serverId: roleInfo.serverId,
              registerTime: roleInfo.registerTime,
              lastLoginTime: roleInfo.lastLoginTime,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to query tf_medium for ${queryId}:`, error);
      return {
        canBind: false,
        roleId,
        accountId: actualAccountId,
        failReason: `查询失败: ${error instanceof Error ? error.message : '未知错误'}`,
        roleInfo: roleInfo
          ? {
              roleName: roleInfo.roleName,
              serverName: roleInfo.serverName,
              serverId: roleInfo.serverId,
              registerTime: roleInfo.registerTime,
              lastLoginTime: roleInfo.lastLoginTime,
            }
          : undefined,
      };
    }
  }

  /**
   * 查询 ThinkingData tf_medium 字段
   */
  private async queryTfMedium(accountId: string): Promise<string | null> {
    const sql = `
      SELECT "#account_id", "tf_medium"
      FROM ${this.userView}
      WHERE "#account_id" = '${accountId}'
    `.trim();

    const response = await this.executeQuery(sql);

    if (!response.result?.rows?.length) {
      return null;
    }

    const columns = response.result.columns;
    const row = response.result.rows[0];
    const tfMediumIndex = columns.indexOf('tf_medium');

    return tfMediumIndex >= 0 ? String(row[tfMediumIndex] || '') : null;
  }

  /**
   * 判断 tf_medium 是否允许绑定
   */
  private isBindableByTfMedium(tfMedium: string | null): boolean {
    if (!tfMedium) {
      // 如果没有 tf_medium，默认为自然量可绑定
      return true;
    }

    const lowerMedium = tfMedium.toLowerCase();

    // 允许绑定的条件
    if (tfMedium === 'Organic' || lowerMedium === 'organic') return true;
    if (lowerMedium.includes('自然量')) return true;
    if (lowerMedium.startsWith('wa_cps_link')) return true;

    // 买量渠道（禁止绑定）
    const paidChannels = ['facebook', 'google', 'tiktok', 'unity', 'applovin', 'ironsource'];
    if (paidChannels.some((ch) => lowerMedium.includes(ch))) {
      return false;
    }

    // 默认禁止（更安全）
    return false;
  }

  /**
   * 执行 ThinkingData SQL 查询
   */
  private async executeQuery(sql: string): Promise<TAQueryResponse> {
    const url = `${this.apiHost}/querySql`;

    const params = new URLSearchParams({
      token: this.projectToken,
      sql: sql,
      format: 'json_object',
      timeoutSeconds: '60',
    });

    const response = await axios.post<TAQueryResponse>(url, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 65000,
    });

    if (response.data.return_code !== 0) {
      throw new Error(
        `ThinkingData API error: ${response.data.return_message} (code: ${response.data.return_code})`,
      );
    }

    return response.data;
  }

  // ===== 绑定操作 =====

  /**
   * 创建 CPS 绑定
   */
  async createBinding(
    dto: CreateBindingDto,
    operatorId: number,
    operatorType: string,
  ): Promise<CreateBindingResponseDto> {
    const { roleId, accountId, cpsGroup, attachments, remark } = dto;

    // 1. 先检查是否可绑定
    const checkResult = await this.checkBinding({ roleId, accountId });

    if (!checkResult.canBind) {
      // 记录失败日志
      await this.prisma.cpsBindFailLog.create({
        data: {
          roleId,
          accountId,
          operatorId,
          failReason: checkResult.failReason || '未知原因',
          tfMedium: checkResult.tfMedium,
          requestData: dto as any,
        },
      });

      return {
        success: false,
        error: checkResult.failReason,
      };
    }

    // 2. 检查是否已经绑定
    const existingBinding = await this.prisma.cpsBinding.findFirst({
      where: {
        roleId,
        status: 'active',
      },
    });

    if (existingBinding) {
      return {
        success: false,
        error: `该角色已绑定到 CPS 分组: ${existingBinding.cpsGroup}`,
      };
    }

    // 3. 使用事务创建绑定
    const binding = await this.prisma.$transaction(async (tx) => {
      // 创建绑定记录
      const newBinding = await tx.cpsBinding.create({
        data: {
          roleId,
          accountId,
          cpsGroup,
          operatorId,
          operatorType,
          status: 'active',
          attachments: attachments ? { urls: attachments } : null,
          remark,
        },
      });

      // 更新角色的 CPS 信息
      await tx.role.update({
        where: { roleId },
        data: {
          cpsGroup,
          cpsBindTime: new Date(),
          cpsBindBy: operatorId,
          tfMedium: checkResult.tfMedium,
        },
      });

      return newBinding;
    });

    return {
      success: true,
      bindingId: binding.id,
    };
  }

  /**
   * 取消 CPS 绑定
   */
  async cancelBinding(bindingId: number, operatorId: number): Promise<{ success: boolean; error?: string }> {
    const binding = await this.prisma.cpsBinding.findUnique({
      where: { id: bindingId },
    });

    if (!binding) {
      return { success: false, error: '绑定记录不存在' };
    }

    if (binding.status === 'cancelled') {
      return { success: false, error: '该绑定已被取消' };
    }

    await this.prisma.$transaction(async (tx) => {
      // 更新绑定状态
      await tx.cpsBinding.update({
        where: { id: bindingId },
        data: {
          status: 'cancelled',
          unbindTime: new Date(),
        },
      });

      // 清除角色的 CPS 信息
      await tx.role.update({
        where: { roleId: binding.roleId },
        data: {
          cpsGroup: null,
          cpsBindTime: null,
          cpsBindBy: null,
        },
      });
    });

    return { success: true };
  }

  // ===== 查询列表 =====

  /**
   * 查询绑定列表
   */
  async getBindings(dto: QueryBindingsDto, currentUser?: CurrentUser) {
    const { roleId, accountId, cpsGroup, operatorId, status, startTime, endTime, page = 1, pageSize = 20 } = dto;

    // 应用数据隔离过滤
    const dataFilter = this.buildDataFilter(currentUser, { cpsGroup });
    const where: any = { ...dataFilter };

    if (roleId) where.roleId = roleId;
    if (accountId) where.accountId = accountId;
    // cpsGroup 由 dataFilter 处理
    if (!dataFilter.cpsGroup && cpsGroup) where.cpsGroup = cpsGroup;
    // operatorId 由 dataFilter 处理
    if (!dataFilter.operatorId && operatorId) where.operatorId = operatorId;
    if (status) where.status = status;

    if (startTime || endTime) {
      where.bindTime = {};
      if (startTime) where.bindTime.gte = new Date(startTime);
      if (endTime) where.bindTime.lte = new Date(endTime);
    }

    const [total, list] = await Promise.all([
      this.prisma.cpsBinding.count({ where }),
      this.prisma.cpsBinding.findMany({
        where,
        include: {
          role: {
            select: {
              roleName: true,
              serverId: true,
              serverName: true,
              totalRechargeUsd: true,
            },
          },
        },
        orderBy: { bindTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      list,
    };
  }

  /**
   * 查询绑定失败日志
   */
  async getFailLogs(dto: QueryFailLogsDto, currentUser?: CurrentUser) {
    const { roleId, accountId, operatorId, startTime, endTime, page = 1, pageSize = 20 } = dto;

    // 应用数据隔离过滤
    const dataFilter = this.buildDataFilter(currentUser);
    const where: any = { ...dataFilter };

    if (roleId) where.roleId = roleId;
    if (accountId) where.accountId = accountId;
    // operatorId 由 dataFilter 处理
    if (!dataFilter.operatorId && operatorId) where.operatorId = operatorId;

    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt.gte = new Date(startTime);
      if (endTime) where.createdAt.lte = new Date(endTime);
    }

    const [total, list] = await Promise.all([
      this.prisma.cpsBindFailLog.count({ where }),
      this.prisma.cpsBindFailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      list,
    };
  }

  /**
   * 查询充值日志
   */
  async getRechargeLogs(dto: QueryRechargeLogsDto, currentUser?: CurrentUser) {
    const { accountId, cpsGroup, serverId, startTime, endTime, syncBatch, page = 1, pageSize = 20 } = dto;

    // 应用数据隔离过滤（CPS 充值日志按 cpsGroup 过滤）
    const dataFilter = this.buildCpsGroupFilter(currentUser, { cpsGroup });
    const where: any = { ...dataFilter };

    if (accountId) where.accountId = accountId;
    // cpsGroup 由 dataFilter 处理
    if (!dataFilter.cpsGroup && cpsGroup) where.cpsGroup = cpsGroup;
    if (serverId) where.serverId = serverId;
    if (syncBatch) where.syncBatch = syncBatch;

    if (startTime || endTime) {
      where.eventTime = {};
      if (startTime) where.eventTime.gte = new Date(startTime);
      if (endTime) where.eventTime.lte = new Date(endTime);
    }

    const [total, list] = await Promise.all([
      this.prisma.cpsRechargeLog.count({ where }),
      this.prisma.cpsRechargeLog.findMany({
        where,
        orderBy: { eventTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      list,
    };
  }

  /**
   * 查询登录日志
   */
  async getLoginLogs(dto: QueryLoginLogsDto, currentUser?: CurrentUser) {
    const { accountId, cpsGroup, serverId, startTime, endTime, syncBatch, page = 1, pageSize = 20 } = dto;

    // 应用数据隔离过滤
    const dataFilter = this.buildCpsGroupFilter(currentUser, { cpsGroup });
    const where: any = { ...dataFilter };

    if (accountId) where.accountId = accountId;
    // cpsGroup 由 dataFilter 处理
    if (!dataFilter.cpsGroup && cpsGroup) where.cpsGroup = cpsGroup;
    if (serverId) where.serverId = serverId;
    if (syncBatch) where.syncBatch = syncBatch;

    if (startTime || endTime) {
      where.lastLoginTime = {};
      if (startTime) where.lastLoginTime.gte = new Date(startTime);
      if (endTime) where.lastLoginTime.lte = new Date(endTime);
    }

    const [total, list] = await Promise.all([
      this.prisma.cpsLoginLog.count({ where }),
      this.prisma.cpsLoginLog.findMany({
        where,
        orderBy: { lastLoginTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      list,
    };
  }

  /**
   * 充值汇总统计
   */
  async getRechargeSummary(dto: RechargeSummaryDto, currentUser?: CurrentUser) {
    const { cpsGroup, startTime, endTime } = dto;

    // 应用数据隔离过滤
    const dataFilter = this.buildCpsGroupFilter(currentUser, { cpsGroup });
    const where: any = { ...dataFilter };

    // cpsGroup 由 dataFilter 处理
    if (!dataFilter.cpsGroup && cpsGroup) where.cpsGroup = cpsGroup;

    if (startTime || endTime) {
      where.eventTime = {};
      if (startTime) where.eventTime.gte = new Date(startTime);
      if (endTime) where.eventTime.lte = new Date(endTime);
    }

    // 按 CPS 分组聚合
    const summary = await this.prisma.cpsRechargeLog.groupBy({
      by: ['cpsGroup'],
      where,
      _sum: {
        payAmountUsd: true,
      },
      _count: {
        id: true,
      },
    });

    // 总计
    const total = await this.prisma.cpsRechargeLog.aggregate({
      where,
      _sum: {
        payAmountUsd: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      byGroup: summary.map((item) => ({
        cpsGroup: item.cpsGroup,
        totalAmount: item._sum.payAmountUsd || 0,
        orderCount: item._count.id,
      })),
      total: {
        totalAmount: total._sum.payAmountUsd || 0,
        orderCount: total._count.id,
      },
    };
  }
}
