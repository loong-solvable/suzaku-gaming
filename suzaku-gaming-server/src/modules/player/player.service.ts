// src/modules/player/player.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { QueryRolesDto } from './dto/query-roles.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { Prisma } from '@prisma/client';

// CSV 导出列配置
const ROLE_EXPORT_COLUMNS = [
  { key: 'roleId', header: '角色ID' },
  { key: 'roleName', header: '角色名称' },
  { key: 'serverId', header: '服务器ID' },
  { key: 'serverName', header: '服务器名称' },
  { key: 'roleLevel', header: '等级' },
  { key: 'vipLevel', header: 'VIP等级' },
  { key: 'totalRechargeUsd', header: '累计充值(USD)' },
  { key: 'totalRechargeTimes', header: '充值次数' },
  { key: 'registerTime', header: '注册时间' },
  { key: 'lastLoginTime', header: '最后登录' },
  { key: 'country', header: '国家' },
  { key: 'countryCode', header: '国家代码' },
  { key: 'deviceType', header: '设备类型' },
  { key: 'channelId', header: '渠道ID' },
  { key: 'status', header: '状态' },
];

const ORDER_EXPORT_COLUMNS = [
  { key: 'orderId', header: '订单ID' },
  { key: 'roleId', header: '角色ID' },
  { key: 'roleName', header: '角色名称' },
  { key: 'serverId', header: '服务器ID' },
  { key: 'serverName', header: '服务器名称' },
  { key: 'payAmountUsd', header: '支付金额(USD)' },
  { key: 'currencyType', header: '货币类型' },
  { key: 'currencyAmount', header: '货币金额' },
  { key: 'goodsId', header: '商品ID' },
  { key: 'payTime', header: '支付时间' },
  { key: 'payChannel', header: '支付渠道' },
  { key: 'rechargeType', header: '充值类型' },
  { key: 'country', header: '国家' },
  { key: 'deviceType', header: '设备类型' },
  { key: 'isSandbox', header: '是否沙盒' },
];

@Injectable()
export class PlayerService {
  constructor(private prisma: PrismaService) {}

  async getRoles(query: QueryRolesDto) {
    const {
      page = 1,
      pageSize = 20,
      roleId,
      roleName,
      serverId,
      system,
      status,
      sortBy,
      sortOrder,
    } = query;

    const where: any = {};

    if (roleId) {
      where.roleId = { contains: roleId };
    }
    if (roleName) {
      where.roleName = { contains: roleName };
    }
    if (serverId) {
      where.serverId = serverId;
    }
    if (system) {
      where.deviceType = system;
    }
    if (status) {
      where.status = status;
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] =
        sortOrder || 'desc';
    } else {
      orderBy.registerTime = 'desc';
    }

    const [list, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          roleId: true,
          accountId: true,
          roleName: true,
          serverId: true,
          serverName: true,
          roleLevel: true,
          vipLevel: true,
          totalRechargeUsd: true,
          totalRechargeTimes: true,
          registerTime: true,
          lastLoginTime: true,
          updatedAt: true,
          country: true,
          countryCode: true,
          deviceType: true,
          channelId: true,
          status: true,
        },
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      list: list.map((role) => ({
        ...role,
        project: '朱雀',  // 默认项目名称
        ucid: role.accountId || role.roleId,  // UCID 字段
        totalRechargeUsd: Number(role.totalRechargeUsd),
        lastUpdateTime: role.updatedAt,
        channel1: '-',  // 一级渠道（可从 channelId 映射）
        channel2: '-',  // 二级渠道
        channel3: '-',  // 三级渠道
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getOrders(query: QueryOrdersDto) {
    const {
      page = 1,
      pageSize = 20,
      roleId,
      serverId,
      system,
      orderType,
      sortBy,
      sortOrder,
    } = query;

    const where: any = {};

    if (roleId) {
      where.roleId = { contains: roleId };
    }
    if (serverId) {
      where.serverId = serverId;
    }
    if (system) {
      where.deviceType = system;
    }
    if (orderType) {
      where.rechargeType = orderType;
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] =
        sortOrder || 'desc';
    } else {
      orderBy.payTime = 'desc';
    }

    const [list, total, summary] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          orderId: true,
          roleId: true,
          roleName: true,
          roleLevel: true,
          serverId: true,
          serverName: true,
          payAmountUsd: true,
          currencyAmount: true,
          goodsId: true,
          payTime: true,
          payChannel: true,
          rechargeType: true,
          country: true,
          deviceType: true,
          isSandbox: true,
        },
      }),
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({
        where,
        _sum: {
          payAmountUsd: true,
        },
      }),
    ]);

    return {
      list: list.map((order) => ({
        ...order,
        amount: Number(order.payAmountUsd),
        currency: 'USD',
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      summary: {
        totalAmount: Number(summary._sum.payAmountUsd || 0),
        totalCount: total,
      },
    };
  }

  // ===== 导出功能 =====

  /**
   * 导出角色列表为 CSV
   */
  async exportRoles(query: QueryRolesDto): Promise<string> {
    const { roleId, roleName, serverId, system, status, sortBy, sortOrder } =
      query;

    const where: any = {};

    if (roleId) {
      where.roleId = { contains: roleId };
    }
    if (roleName) {
      where.roleName = { contains: roleName };
    }
    if (serverId) {
      where.serverId = serverId;
    }
    if (system) {
      where.deviceType = system;
    }
    if (status) {
      where.status = status;
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] =
        sortOrder || 'desc';
    } else {
      orderBy.registerTime = 'desc';
    }

    // 获取全部数据（导出时不分页，但限制最大数量）
    const MAX_EXPORT_ROWS = 10000;
    const list = await this.prisma.role.findMany({
      where,
      orderBy,
      take: MAX_EXPORT_ROWS,
      select: {
        roleId: true,
        roleName: true,
        serverId: true,
        serverName: true,
        roleLevel: true,
        vipLevel: true,
        totalRechargeUsd: true,
        totalRechargeTimes: true,
        registerTime: true,
        lastLoginTime: true,
        country: true,
        countryCode: true,
        deviceType: true,
        channelId: true,
        status: true,
      },
    });

    return this.toCSV(list, ROLE_EXPORT_COLUMNS);
  }

  /**
   * 导出订单列表为 CSV
   */
  async exportOrders(query: QueryOrdersDto): Promise<string> {
    const { roleId, serverId, system, orderType, sortBy, sortOrder } = query;

    const where: any = {};

    if (roleId) {
      where.roleId = { contains: roleId };
    }
    if (serverId) {
      where.serverId = serverId;
    }
    if (system) {
      where.deviceType = system;
    }
    if (orderType) {
      where.rechargeType = orderType;
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] =
        sortOrder || 'desc';
    } else {
      orderBy.payTime = 'desc';
    }

    // 获取全部数据（导出时不分页，但限制最大数量）
    const MAX_EXPORT_ROWS = 10000;
    const list = await this.prisma.order.findMany({
      where,
      orderBy,
      take: MAX_EXPORT_ROWS,
      select: {
        orderId: true,
        roleId: true,
        roleName: true,
        serverId: true,
        serverName: true,
        payAmountUsd: true,
        currencyType: true,
        currencyAmount: true,
        goodsId: true,
        payTime: true,
        payChannel: true,
        rechargeType: true,
        country: true,
        deviceType: true,
        isSandbox: true,
      },
    });

    return this.toCSV(list, ORDER_EXPORT_COLUMNS);
  }

  /**
   * 将数据转换为 CSV 格式
   */
  private toCSV(
    data: any[],
    columns: { key: string; header: string }[],
  ): string {
    // 生成表头
    const header = columns.map((col) => col.header).join(',');

    // 生成数据行
    const rows = data.map((item) => {
      return columns
        .map((col) => {
          let value = item[col.key];

          // 处理特殊类型
          if (value === null || value === undefined) {
            return '';
          }
          if (value instanceof Date) {
            return value.toISOString();
          }
          if (typeof value === 'object') {
            // Decimal 类型
            if (value.toString) {
              value = value.toString();
            } else {
              value = JSON.stringify(value);
            }
          }
          if (typeof value === 'boolean') {
            return value ? '是' : '否';
          }

          // 转换为字符串并处理特殊字符
          const strValue = String(value);
          // 如果包含逗号、引号或换行符，需要用引号包裹
          if (
            strValue.includes(',') ||
            strValue.includes('"') ||
            strValue.includes('\n')
          ) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        })
        .join(',');
    });

    return [header, ...rows].join('\n');
  }
}
