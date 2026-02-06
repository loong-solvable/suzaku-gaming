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
      server,
      serverId,
      system,
      status,
      channelId,
      countryCode,
      registerTimeStart,
      registerTimeEnd,
      sortBy,
      sortOrder,
    } = query;

    // P7: 仅展示已归因角色
    const where: any = { cpsVisible: true };

    if (roleId) {
      where.roleId = { contains: roleId };
    }
    if (roleName) {
      where.roleName = { contains: roleName };
    }
    // 支持按服务器ID或服务器名称筛选
    if (serverId) {
      where.serverId = serverId;
    } else if (server) {
      // 尝试解析为数字，否则按名称匹配
      const parsedServerId = parseInt(server, 10);
      if (!isNaN(parsedServerId)) {
        where.serverId = parsedServerId;
      } else {
        where.serverName = { contains: server };
      }
    }
    // 系统类型筛选（忽略大小写）
    if (system) {
      const normalizedSystem = system.toLowerCase();
      if (normalizedSystem === 'ios') {
        where.deviceType = { in: ['iOS', 'ios', 'IOS'] };
      } else if (normalizedSystem === 'android') {
        where.deviceType = { in: ['Android', 'android', 'ANDROID'] };
      } else {
        where.deviceType = system;
      }
    }
    if (status) {
      where.status = status;
    }
    if (channelId) {
      where.channelId = channelId;
    }
    if (countryCode) {
      where.countryCode = countryCode;
    }
    // 注册时间范围筛选
    if (registerTimeStart || registerTimeEnd) {
      where.registerTime = {};
      if (registerTimeStart) {
        where.registerTime.gte = new Date(registerTimeStart);
      }
      if (registerTimeEnd) {
        // 结束日期包含当天，所以设置为次日 00:00:00
        const endDate = new Date(registerTimeEnd);
        endDate.setDate(endDate.getDate() + 1);
        where.registerTime.lt = endDate;
      }
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

    // P1/R5: 当前页角色 ID 单次聚合，避免 N+1
    const roleIds = list.map(r => r.roleId);
    const amounts = roleIds.length > 0 ? await this.prisma.order.groupBy({
      by: ['roleId'],
      where: { roleId: { in: roleIds }, isSandbox: false },
      _sum: { payAmountUsd: true },
    }) : [];
    const amountMap = new Map(amounts.map(a => [a.roleId, Number(a._sum.payAmountUsd || 0)]));

    return {
      list: list.map((role) => ({
        ...role,
        project: '海战',  // 默认项目名称
        ucid: role.accountId || role.roleId,  // UCID 字段
        totalRechargeUsd: amountMap.get(role.roleId) || 0,  // P1: 使用订单聚合值
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
      roleName,
      server,
      serverId,
      system,
      orderType,
      payChannel,
      channelId,
      payTimeStart,
      payTimeEnd,
      sortBy,
      sortOrder,
    } = query;

    // P7: 仅展示已归因角色的订单
    const where: any = { role: { cpsVisible: true } };

    if (roleId) {
      where.roleId = { contains: roleId };
    }
    if (roleName) {
      where.roleName = { contains: roleName };
    }
    // 支持按服务器ID或服务器名称筛选
    if (serverId) {
      where.serverId = serverId;
    } else if (server) {
      const parsedServerId = parseInt(server, 10);
      if (!isNaN(parsedServerId)) {
        where.serverId = parsedServerId;
      } else {
        where.serverName = { contains: server };
      }
    }
    // 系统类型筛选（忽略大小写）
    if (system) {
      const normalizedSystem = system.toLowerCase();
      if (normalizedSystem === 'ios') {
        where.deviceType = { in: ['iOS', 'ios', 'IOS'] };
      } else if (normalizedSystem === 'android') {
        where.deviceType = { in: ['Android', 'android', 'ANDROID'] };
      } else {
        where.deviceType = system;
      }
    }
    if (orderType) {
      where.rechargeType = orderType;
    }
    if (payChannel) {
      where.payChannel = payChannel;
    }
    if (channelId) {
      where.channelId = channelId;
    }
    // 支付时间范围筛选
    if (payTimeStart || payTimeEnd) {
      where.payTime = {};
      if (payTimeStart) {
        where.payTime.gte = new Date(payTimeStart);
      }
      if (payTimeEnd) {
        const endDate = new Date(payTimeEnd);
        endDate.setDate(endDate.getDate() + 1);
        where.payTime.lt = endDate;
      }
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
          // 关联获取角色的最后登录时间
          role: {
            select: {
              lastLoginTime: true,
            },
          },
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
        lastLoginTime: order.role?.lastLoginTime,
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
    const {
      roleId,
      roleName,
      server,
      serverId,
      system,
      status,
      channelId,
      countryCode,
      registerTimeStart,
      registerTimeEnd,
      sortBy,
      sortOrder,
    } = query;

    // P7: 导出也仅含已归因角色
    const where: any = { cpsVisible: true };

    if (roleId) {
      where.roleId = { contains: roleId };
    }
    if (roleName) {
      where.roleName = { contains: roleName };
    }
    if (serverId) {
      where.serverId = serverId;
    } else if (server) {
      const parsedServerId = parseInt(server, 10);
      if (!isNaN(parsedServerId)) {
        where.serverId = parsedServerId;
      } else {
        where.serverName = { contains: server };
      }
    }
    if (system) {
      const normalizedSystem = system.toLowerCase();
      if (normalizedSystem === 'ios') {
        where.deviceType = { in: ['iOS', 'ios', 'IOS'] };
      } else if (normalizedSystem === 'android') {
        where.deviceType = { in: ['Android', 'android', 'ANDROID'] };
      } else {
        where.deviceType = system;
      }
    }
    if (status) {
      where.status = status;
    }
    if (channelId) {
      where.channelId = channelId;
    }
    if (countryCode) {
      where.countryCode = countryCode;
    }
    if (registerTimeStart || registerTimeEnd) {
      where.registerTime = {};
      if (registerTimeStart) {
        where.registerTime.gte = new Date(registerTimeStart);
      }
      if (registerTimeEnd) {
        const endDate = new Date(registerTimeEnd);
        endDate.setDate(endDate.getDate() + 1);
        where.registerTime.lt = endDate;
      }
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

    // P1/R5: 导出金额也使用订单聚合口径
    const roleIds = list.map(r => r.roleId);
    const amounts = roleIds.length > 0 ? await this.prisma.order.groupBy({
      by: ['roleId'],
      where: { roleId: { in: roleIds }, isSandbox: false },
      _sum: { payAmountUsd: true },
    }) : [];
    const amountMap = new Map(amounts.map(a => [a.roleId, Number(a._sum.payAmountUsd || 0)]));

    const exportList = list.map(role => ({
      ...role,
      totalRechargeUsd: amountMap.get(role.roleId) || 0,
    }));

    return this.toCSV(exportList, ROLE_EXPORT_COLUMNS);
  }

  /**
   * 导出订单列表为 CSV
   */
  async exportOrders(query: QueryOrdersDto): Promise<string> {
    const {
      roleId,
      roleName,
      server,
      serverId,
      system,
      orderType,
      channelId,
      payTimeStart,
      payTimeEnd,
      sortBy,
      sortOrder,
    } = query;

    // P7: 导出也仅含已归因角色的订单
    const where: any = { role: { cpsVisible: true } };

    if (roleId) {
      where.roleId = { contains: roleId };
    }
    if (roleName) {
      where.roleName = { contains: roleName };
    }
    if (serverId) {
      where.serverId = serverId;
    } else if (server) {
      const parsedServerId = parseInt(server, 10);
      if (!isNaN(parsedServerId)) {
        where.serverId = parsedServerId;
      } else {
        where.serverName = { contains: server };
      }
    }
    if (system) {
      const normalizedSystem = system.toLowerCase();
      if (normalizedSystem === 'ios') {
        where.deviceType = { in: ['iOS', 'ios', 'IOS'] };
      } else if (normalizedSystem === 'android') {
        where.deviceType = { in: ['Android', 'android', 'ANDROID'] };
      } else {
        where.deviceType = system;
      }
    }
    if (orderType) {
      where.rechargeType = orderType;
    }
    if (channelId) {
      where.channelId = channelId;
    }
    if (payTimeStart || payTimeEnd) {
      where.payTime = {};
      if (payTimeStart) {
        where.payTime.gte = new Date(payTimeStart);
      }
      if (payTimeEnd) {
        const endDate = new Date(payTimeEnd);
        endDate.setDate(endDate.getDate() + 1);
        where.payTime.lt = endDate;
      }
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

  /**
   * 获取筛选选项（从实际数据中提取唯一值）
   */
  async getFilterOptions() {
    try {
      // 分开查询避免并发问题
      const roleServers = await this.prisma.role.findMany({
        select: { serverId: true, serverName: true },
        orderBy: { serverId: 'asc' },
      });

      const roleDeviceTypes = await this.prisma.role.findMany({
        select: { deviceType: true },
        where: { deviceType: { not: null } },
      });

      const roleCountries = await this.prisma.role.findMany({
        select: { country: true, countryCode: true },
        where: { country: { not: null } },
      });

      const orderRechargeTypes = await this.prisma.order.findMany({
        select: { rechargeType: true },
        where: { rechargeType: { not: null } },
      });

      const orderPayChannels = await this.prisma.order.findMany({
        select: { payChannel: true },
        where: { payChannel: { not: null } },
      });

      // 去重并格式化服务器选项
      const serverMap = new Map<number, string>();
      roleServers.forEach((s) => {
        if (!serverMap.has(s.serverId)) {
          serverMap.set(s.serverId, s.serverName || `服务器${s.serverId}`);
        }
      });
      const serverOptions = Array.from(serverMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([id, name]) => ({
          label: name,
          value: String(id),
        }));

      // 去重并格式化系统类型选项
      const deviceTypes = [...new Set(roleDeviceTypes.map((d) => d.deviceType).filter(Boolean))];
      const systemOptions = deviceTypes.map((type) => ({
        label: type!,
        value: type!.toLowerCase(),
      }));

      // 去重并格式化国家选项
      const countryMap = new Map<string, string>();
      roleCountries.forEach((c) => {
        if (c.country && !countryMap.has(c.country)) {
          countryMap.set(c.country, c.countryCode || c.country);
        }
      });
      const countryOptions = Array.from(countryMap.entries()).map(([name, code]) => ({
        label: name,
        value: code,
      }));

      // 去重并格式化订单类型选项
      const rechargeTypes = [...new Set(orderRechargeTypes.map((t) => t.rechargeType).filter(Boolean))];
      const orderTypeOptions = rechargeTypes.map((type) => ({
        label: this.getRechargeTypeLabel(type),
        value: type!,
      }));

      // 去重并格式化支付渠道选项
      const payChannels = [...new Set(orderPayChannels.map((c) => c.payChannel).filter(Boolean))];
      const payChannelOptions = payChannels.map((channel) => ({
        label: this.getPayChannelLabel(channel),
        value: channel!,
      }));

      return {
        // 游戏项目（目前只有一个）
        gameProjects: [
          { label: '海战', value: 'warship' },
        ],
        // 服务器列表
        servers: serverOptions,
        // 系统类型
        systems: systemOptions,
        // 国家列表
        countries: countryOptions,
        // 订单类型
        orderTypes: orderTypeOptions,
        // 支付渠道
        payChannels: payChannelOptions,
        // 时区选项（前端本地处理，但提供常用选项）
        timezones: [
          { label: 'UTC+8 (北京)', value: '+08:00' },
          { label: 'UTC+9 (东京)', value: '+09:00' },
          { label: 'UTC+0 (伦敦)', value: '+00:00' },
          { label: 'UTC-5 (纽约)', value: '-05:00' },
          { label: 'UTC-8 (洛杉矶)', value: '-08:00' },
        ],
      };
    } catch (error) {
      console.error('getFilterOptions error:', error);
      throw error;
    }
  }

  /**
   * 获取充值类型的显示标签
   */
  private getRechargeTypeLabel(type: string | null): string {
    const map: Record<string, string> = {
      cash: '现金充值',
      subscription: '订阅',
      gift: '礼包',
      monthly_card: '月卡',
      first_charge: '首充',
    };
    return map[type || ''] || type || '未知';
  }

  /**
   * 获取支付渠道的显示标签
   */
  private getPayChannelLabel(channel: string | null): string {
    const map: Record<string, string> = {
      '8': 'Apple Pay',
      '9': 'Google Pay',
      applePay: 'Apple Pay',
      googlePay: 'Google Pay',
      wechat: '微信支付',
      alipay: '支付宝',
    };
    return map[channel || ''] || `渠道${channel}`;
  }

  /**
   * 获取数据时间范围
   * 返回角色注册时间和订单充值时间的最早/最晚日期
   */
  async getDateRange() {
    // 获取角色注册时间范围
    const roleRange = await this.prisma.role.aggregate({
      _min: { registerTime: true },
      _max: { registerTime: true },
    });

    // 获取订单充值时间范围
    const orderRange = await this.prisma.order.aggregate({
      _min: { payTime: true },
      _max: { payTime: true },
    });

    // 格式化日期为 YYYY-MM-DD
    const formatDate = (date: Date | null): string | null => {
      if (!date) return null;
      return date.toISOString().slice(0, 10);
    };

    return {
      roleRegisterTime: {
        min: formatDate(roleRange._min.registerTime),
        max: formatDate(roleRange._max.registerTime),
      },
      orderPayTime: {
        min: formatDate(orderRange._min.payTime),
        max: formatDate(orderRange._max.payTime),
      },
    };
  }
}
