// src/modules/thinkingdata/thinkingdata.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/prisma/prisma.service';
import axios, { AxiosError } from 'axios';
import dayjs from 'dayjs';
import { TAQueryResponse, TASyncResult, TAUserBehavior } from './interfaces/ta-response.interface';

@Injectable()
export class ThinkingDataService {
  private readonly logger = new Logger(ThinkingDataService.name);
  private readonly apiHost: string;
  private readonly projectToken: string;
  private readonly eventView: string;
  private readonly userView: string;
  private readonly maxRetries = 3;
  private readonly retryDelays = [5000, 10000, 30000]; // 指数退避: 5s, 10s, 30s

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiHost = this.configService.get<string>('TA_API_HOST') || '';
    this.projectToken = this.configService.get<string>('TA_PROJECT_TOKEN') || '';
    this.eventView = this.configService.get<string>('TA_EVENT_VIEW') || 'v_event_22';
    this.userView = this.configService.get<string>('TA_USER_VIEW') || 'ta.v_user_22';
    
    if (!this.projectToken) {
      this.logger.warn('TA_PROJECT_TOKEN not configured, sync will be disabled');
    }
  }

  /**
   * 执行 T-1 数据同步（拉取昨日数据）
   */
  async syncYesterdayData(): Promise<TASyncResult> {
    const startTime = Date.now();
    const targetDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    
    this.logger.log(`Starting ThinkingData sync for date: ${targetDate}`);

    try {
      // 1. 构建动态 SQL
      const sql = this.buildSyncSQL(targetDate);
      
      // 2. 调用 API（带重试）
      const response = await this.queryWithRetry(sql);
      
      // 3. 解析并入库
      const records = this.parseResponse(response, targetDate);
      const { inserted, updated } = await this.upsertRecords(records, targetDate);
      
      // 4. 更新 daily_stats
      await this.updateDailyStats(targetDate);

      // 5. 记录成功日志
      await this.logSyncResult(targetDate, 'success', records.length, Date.now() - startTime);

      const duration = Date.now() - startTime;
      this.logger.log(`Sync completed: ${records.length} records processed (${inserted} inserted, ${updated} updated) in ${duration}ms`);

      return {
        success: true,
        syncDate: targetDate,
        recordsProcessed: records.length,
        recordsInserted: inserted,
        recordsUpdated: updated,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error(`Sync failed for ${targetDate}: ${errorMessage}`, error instanceof Error ? error.stack : '');
      
      // 记录同步失败日志
      await this.logSyncResult(targetDate, 'failed', 0, duration, errorMessage);

      return {
        success: false,
        syncDate: targetDate,
        recordsProcessed: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * 构建动态 SQL（根据目标日期）
   */
  private buildSyncSQL(targetDate: string): string {
    return `
      SELECT 
        "#user_id" as user_id,
        "#event_name" as event_name,
        COUNT(*) as event_count,
        MAX("#event_time") as last_event_time
      FROM ${this.eventView}
      WHERE "$part_date" = '${targetDate}'
        AND "#event_name" IN ('role_create', 'recharge_complete', 'login', 'task_finish')
      GROUP BY "#user_id", "#event_name"
    `.trim();
  }

  /**
   * 带指数退避重试的 API 调用
   */
  private async queryWithRetry(sql: string): Promise<TAQueryResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.executeQuery(sql);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // 仅对 5xx 错误或网络错误重试
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500) {
            // 4xx 错误不重试
            throw error;
          }
        }

        if (attempt < this.maxRetries) {
          const delay = this.retryDelays[attempt];
          this.logger.warn(`Query failed (attempt ${attempt + 1}/${this.maxRetries + 1}), retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Query failed after max retries');
  }

  /**
   * 执行单次 API 查询
   * ThinkingData API 文档: https://docs.thinkingdata.jp/ta-manual/latest/en/technical_document/open_api/data_api.html
   */
  private async executeQuery(sql: string): Promise<TAQueryResponse> {
    // 正确的端点是 /querySql（根据官方文档）
    const url = `${this.apiHost}/querySql`;
    
    const params = new URLSearchParams({
      token: this.projectToken,
      sql: sql,
      format: 'json', // 文档支持的格式: json, csv, csv_header, tsv, tsv_header
    });

    this.logger.log(`Calling ThinkingData API: ${url}`);
    this.logger.log(`SQL: ${sql.substring(0, 200)}...`);

    const response = await axios.post(url, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 60000,
      // 不要自动解析 JSON，因为 ThinkingData 返回的是多行 JSON
      transformResponse: [(data) => data],
    });

    // 记录原始响应用于调试
    const rawResponse = response.data as string;
    this.logger.log(`Raw response (first 500 chars): ${rawResponse.substring(0, 500)}`);

    // ThinkingData /querySql 返回多行 JSON
    // 第一行是元数据，后续行是数据行
    const lines = rawResponse.trim().split('\n');
    if (lines.length === 0) {
      throw new Error('Empty response from ThinkingData API');
    }

    // 解析第一行（元数据）
    let metadata: any;
    try {
      metadata = JSON.parse(lines[0]);
    } catch (e) {
      this.logger.error(`Failed to parse metadata line: ${lines[0]}`);
      throw new Error(`Invalid response format from ThinkingData API: ${lines[0].substring(0, 200)}`);
    }

    this.logger.log(`Metadata: return_code=${metadata.return_code}, return_message=${metadata.return_message}`);

    // 校验返回码
    if (metadata.return_code !== 0) {
      throw new Error(`ThinkingData API error: ${metadata.return_message} (code: ${metadata.return_code})`);
    }

    // 获取列名（从 data.headers）
    const headers = metadata.data?.headers || [];
    this.logger.log(`Headers: ${JSON.stringify(headers)}`);

    // 解析数据行（从第二行开始）
    const rows: (string | number | null)[][] = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        try {
          const row = JSON.parse(lines[i]);
          rows.push(row);
        } catch (e) {
          this.logger.warn(`Failed to parse data row ${i}: ${lines[i].substring(0, 100)}`);
        }
      }
    }

    this.logger.log(`Parsed ${rows.length} data rows`);

    return {
      return_code: metadata.return_code,
      return_message: metadata.return_message,
      data: {
        headers,
        rows,
      },
    };
  }

  /**
   * 解析 API 响应为结构化数据
   */
  private parseResponse(response: TAQueryResponse, targetDate: string): TAUserBehavior[] {
    const columns = response.data?.headers || [];
    const rows = response.data?.rows || [];

    if (!rows.length) {
      this.logger.warn('No data rows in ThinkingData response');
      return [];
    }

    this.logger.log(`Parsing ${rows.length} rows with columns: ${columns.join(', ')}`);

    // 构建列名到索引的映射
    const columnIndex = columns.reduce((acc, col, idx) => {
      acc[col] = idx;
      return acc;
    }, {} as Record<string, number>);

    this.logger.log(`Column index mapping: ${JSON.stringify(columnIndex)}`);

    return rows.map(row => ({
      userId: String(row[columnIndex['user_id']] || ''),
      eventName: String(row[columnIndex['event_name']] || ''),
      eventCount: Number(row[columnIndex['event_count']] || 0),
      eventDate: targetDate,
      lastEventTime: String(row[columnIndex['last_event_time']] || ''),
    })).filter(r => r.userId);
  }

  /**
   * 幂等性写入（PostgreSQL ON CONFLICT）
   */
  private async upsertRecords(records: TAUserBehavior[], targetDate: string): Promise<{ inserted: number; updated: number }> {
    if (records.length === 0) {
      return { inserted: 0, updated: 0 };
    }

    let inserted = 0;
    let updated = 0;

    // 使用事务批量处理
    await this.prisma.$transaction(async (tx) => {
      for (const record of records) {
        const existing = await tx.userBehaviorStat.findUnique({
          where: {
            userId_eventName_eventDate: {
              userId: record.userId,
              eventName: record.eventName,
              eventDate: new Date(record.eventDate),
            },
          },
        });

        await tx.userBehaviorStat.upsert({
          where: {
            userId_eventName_eventDate: {
              userId: record.userId,
              eventName: record.eventName,
              eventDate: new Date(record.eventDate),
            },
          },
          create: {
            userId: record.userId,
            eventName: record.eventName,
            eventCount: record.eventCount,
            eventDate: new Date(record.eventDate),
            lastEventTime: record.lastEventTime ? new Date(record.lastEventTime) : null,
            source: 'thinkingdata',
          },
          update: {
            eventCount: record.eventCount,
            lastEventTime: record.lastEventTime ? new Date(record.lastEventTime) : null,
            updatedAt: new Date(),
          },
        });

        if (existing) {
          updated++;
        } else {
          inserted++;
        }
      }
    });

    return { inserted, updated };
  }

  /**
   * 根据同步数据更新 daily_stats
   */
  private async updateDailyStats(targetDate: string): Promise<void> {
    const date = new Date(targetDate);

    // 聚合当日数据
    const stats = await this.prisma.userBehaviorStat.groupBy({
      by: ['eventName'],
      where: {
        eventDate: date,
      },
      _sum: {
        eventCount: true,
      },
      _count: {
        userId: true,
      },
    });

    // 构建统计数据
    const newPlayers = stats.find(s => s.eventName === 'role_create')?._count?.userId || 0;
    const paidPlayers = stats.find(s => s.eventName === 'recharge_complete')?._count?.userId || 0;
    const activePlayers = stats.find(s => s.eventName === 'login')?._count?.userId || paidPlayers;

    // 获取当日订单总额
    const revenueResult = await this.prisma.order.aggregate({
      where: {
        payTime: {
          gte: date,
          lt: dayjs(date).add(1, 'day').toDate(),
        },
        isSandbox: false,
      },
      _sum: {
        payAmountUsd: true,
      },
      _count: true,
    });

    // 幂等更新 daily_stats
    await this.prisma.dailyStat.upsert({
      where: { statDate: date },
      create: {
        statDate: date,
        newPlayers,
        activePlayers,
        paidPlayers,
        totalRevenue: revenueResult._sum.payAmountUsd || 0,
        totalOrders: revenueResult._count || 0,
      },
      update: {
        newPlayers,
        activePlayers,
        paidPlayers,
        totalRevenue: revenueResult._sum.payAmountUsd || 0,
        totalOrders: revenueResult._count || 0,
      },
    });

    this.logger.log(`Updated daily_stats for ${targetDate}: ${newPlayers} new, ${activePlayers} active, ${paidPlayers} paid`);
  }

  /**
   * 记录同步结果日志
   */
  private async logSyncResult(
    targetDate: string,
    status: string,
    recordCount: number,
    duration: number,
    errorMessage?: string
  ): Promise<void> {
    await this.prisma.syncLog.create({
      data: {
        source: 'thinkingdata',
        targetDate: new Date(targetDate),
        status,
        recordCount,
        duration,
        errorMessage: errorMessage || null,
      },
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // 角色数据同步
  // ============================================

  /**
   * 同步角色数据（从 ThinkingData 用户视图）
   */
  async syncRoles(limit: number = 10000): Promise<TASyncResult> {
    const startTime = Date.now();
    const targetDate = dayjs().format('YYYY-MM-DD');
    
    this.logger.log(`Starting role sync from ThinkingData (limit: ${limit})`);

    try {
      const sql = this.buildRoleSyncSQL(limit);
      const response = await this.queryWithRetry(sql);
      const { inserted, updated } = await this.upsertRoles(response);
      
      const duration = Date.now() - startTime;
      this.logger.log(`Role sync completed: ${inserted} inserted, ${updated} updated in ${duration}ms`);

      await this.logSyncResult(targetDate, 'success', inserted + updated, duration);

      return {
        success: true,
        syncDate: targetDate,
        recordsProcessed: inserted + updated,
        recordsInserted: inserted,
        recordsUpdated: updated,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error(`Role sync failed: ${errorMessage}`, error instanceof Error ? error.stack : '');
      await this.logSyncResult(targetDate, 'failed', 0, duration, errorMessage);

      return {
        success: false,
        syncDate: targetDate,
        recordsProcessed: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * 构建角色同步 SQL
   * 注意：ThinkingData 用户表字段名参考 PROJECT_ADAPTATION_PLAN.md
   * 使用 #account_id 作为 role_id（因为 role_id 可能不在用户视图中）
   */
  private buildRoleSyncSQL(limit: number): string {
    // 先从事件表中获取角色信息（role_create 事件）
    return `
      SELECT 
        "#user_id",
        "#account_id",
        "#account_id" as role_id,
        "role_name",
        "role_level",
        "vip_level",
        "server_id",
        "server_name",
        "#country",
        "#country_code",
        "dev_type",
        "channel_id",
        "total_recharge_usd",
        "total_recharge_times",
        "total_login_days",
        "#event_time"
      FROM ${this.eventView}
      WHERE "$part_event" = 'role_create'
      ORDER BY "#event_time" DESC
      LIMIT ${limit}
    `.trim();
  }

  /**
   * 角色数据入库
   */
  private async upsertRoles(response: TAQueryResponse): Promise<{ inserted: number; updated: number }> {
    const columns = response.data?.headers || [];
    const rows = response.data?.rows || [];

    if (!rows.length) {
      this.logger.warn('No role data in ThinkingData response');
      return { inserted: 0, updated: 0 };
    }

    const columnIndex = columns.reduce((acc, col, idx) => {
      acc[col] = idx;
      return acc;
    }, {} as Record<string, number>);

    let inserted = 0;
    let updated = 0;

    for (const row of rows) {
      try {
        const roleId = String(row[columnIndex['role_id']] || '');
        if (!roleId) continue;

        const serverId = parseInt(String(row[columnIndex['server_id']] || '0'), 10);
        if (!serverId) continue;

        const roleData = {
          roleId,
          userId: String(row[columnIndex['#user_id']] || '') || null,
          accountId: String(row[columnIndex['#account_id']] || '') || null,
          roleName: String(row[columnIndex['role_name']] || '') || null,
          roleLevel: parseInt(String(row[columnIndex['role_level']] || '1'), 10) || 1,
          vipLevel: parseInt(String(row[columnIndex['vip_level']] || '0'), 10) || 0,
          serverId,
          serverName: String(row[columnIndex['server_name']] || '') || `S${serverId}`,
          country: String(row[columnIndex['#country']] || '') || null,
          countryCode: String(row[columnIndex['#country_code']] || '') || null,
          deviceType: this.normalizeDeviceType(String(row[columnIndex['dev_type']] || '')),
          channelId: parseInt(String(row[columnIndex['channel_id']] || '0'), 10) || null,
          totalRechargeUsd: parseFloat(String(row[columnIndex['total_recharge_usd']] || '0')) || 0,
          totalRechargeTimes: parseInt(String(row[columnIndex['total_recharge_times']] || '0'), 10) || 0,
          totalLoginDays: parseInt(String(row[columnIndex['total_login_days']] || '0'), 10) || 0,
          registerTime: row[columnIndex['#event_time']] ? new Date(String(row[columnIndex['#event_time']])) : new Date(),
          lastLoginTime: row[columnIndex['#event_time']] ? new Date(String(row[columnIndex['#event_time']])) : new Date(),
        };

        const existing = await this.prisma.role.findUnique({ where: { roleId } });
        
        await this.prisma.role.upsert({
          where: { roleId },
          create: roleData,
          update: {
            ...roleData,
            updatedAt: new Date(),
          },
        });

        if (existing) {
          updated++;
        } else {
          inserted++;
        }
      } catch (error) {
        this.logger.warn(`Failed to upsert role: ${error instanceof Error ? error.message : error}`);
      }
    }

    return { inserted, updated };
  }

  // ============================================
  // 订单数据同步
  // ============================================

  /**
   * 同步订单数据（从 ThinkingData 充值事件）
   */
  async syncOrders(targetDate?: string, limit: number = 10000): Promise<TASyncResult> {
    const startTime = Date.now();
    const syncDate = targetDate || dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    
    this.logger.log(`Starting order sync from ThinkingData for date: ${syncDate} (limit: ${limit})`);

    try {
      const sql = this.buildOrderSyncSQL(syncDate, limit);
      const response = await this.queryWithRetry(sql);
      const { inserted, updated } = await this.upsertOrders(response);
      
      const duration = Date.now() - startTime;
      this.logger.log(`Order sync completed: ${inserted} inserted, ${updated} updated in ${duration}ms`);

      await this.logSyncResult(syncDate, 'success', inserted + updated, duration);

      return {
        success: true,
        syncDate,
        recordsProcessed: inserted + updated,
        recordsInserted: inserted,
        recordsUpdated: updated,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error(`Order sync failed: ${errorMessage}`, error instanceof Error ? error.stack : '');
      await this.logSyncResult(syncDate, 'failed', 0, duration, errorMessage);

      return {
        success: false,
        syncDate,
        recordsProcessed: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * 构建订单同步 SQL
   */
  private buildOrderSyncSQL(targetDate: string, limit: number): string {
    return `
      SELECT 
        "game_order_id",
        "role_id",
        "role_name",
        "role_level",
        "server_id",
        "server_name",
        "#country",
        "dev_type",
        "channel_id",
        "goods_id",
        "pay_amount_usd",
        "currency_type",
        "currency_amount",
        "recharge_type",
        "recharge_channel",
        "is_sandbox",
        "#event_time"
      FROM ${this.eventView}
      WHERE "$part_event" = 'recharge_complete'
        AND "$part_date" = '${targetDate}'
      ORDER BY "#event_time" DESC
      LIMIT ${limit}
    `.trim();
  }

  /**
   * 订单数据入库
   */
  private async upsertOrders(response: TAQueryResponse): Promise<{ inserted: number; updated: number }> {
    const columns = response.data?.headers || [];
    const rows = response.data?.rows || [];

    if (!rows.length) {
      this.logger.warn('No order data in ThinkingData response');
      return { inserted: 0, updated: 0 };
    }

    const columnIndex = columns.reduce((acc, col, idx) => {
      acc[col] = idx;
      return acc;
    }, {} as Record<string, number>);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      try {
        const orderId = String(row[columnIndex['game_order_id']] || '');
        if (!orderId) continue;

        const roleId = String(row[columnIndex['role_id']] || '');
        if (!roleId) continue;

        const serverId = parseInt(String(row[columnIndex['server_id']] || '0'), 10);
        if (!serverId) continue;

        // 检查角色是否存在（因为外键约束）
        const roleExists = await this.prisma.role.findUnique({ where: { roleId } });
        if (!roleExists) {
          // 如果角色不存在，先创建一个最小化的角色记录
          await this.prisma.role.create({
            data: {
              roleId,
              roleName: String(row[columnIndex['role_name']] || '') || null,
              roleLevel: parseInt(String(row[columnIndex['role_level']] || '1'), 10) || 1,
              serverId,
              serverName: String(row[columnIndex['server_name']] || '') || `S${serverId}`,
              country: String(row[columnIndex['#country']] || '') || null,
              deviceType: this.normalizeDeviceType(String(row[columnIndex['dev_type']] || '')),
              registerTime: row[columnIndex['#event_time']] ? new Date(String(row[columnIndex['#event_time']])) : new Date(),
            },
          });
          this.logger.log(`Auto-created role ${roleId} for order ${orderId}`);
        }

        const orderData = {
          orderId,
          roleId,
          roleName: String(row[columnIndex['role_name']] || '') || null,
          roleLevel: parseInt(String(row[columnIndex['role_level']] || '0'), 10) || null,
          serverId,
          serverName: String(row[columnIndex['server_name']] || '') || `S${serverId}`,
          country: String(row[columnIndex['#country']] || '') || null,
          deviceType: this.normalizeDeviceType(String(row[columnIndex['dev_type']] || '')),
          channelId: parseInt(String(row[columnIndex['channel_id']] || '0'), 10) || null,
          goodsId: String(row[columnIndex['goods_id']] || '') || null,
          payAmountUsd: parseFloat(String(row[columnIndex['pay_amount_usd']] || '0')) || 0,
          currencyType: String(row[columnIndex['currency_type']] || '') || null,
          currencyAmount: parseFloat(String(row[columnIndex['currency_amount']] || '0')) || null,
          rechargeType: this.normalizeRechargeType(String(row[columnIndex['recharge_type']] || '')),
          payChannel: String(row[columnIndex['recharge_channel']] || '') || null,
          isSandbox: String(row[columnIndex['is_sandbox']] || '0') === '1',
          payTime: row[columnIndex['#event_time']] ? new Date(String(row[columnIndex['#event_time']])) : new Date(),
        };

        const existing = await this.prisma.order.findUnique({ where: { orderId } });
        
        await this.prisma.order.upsert({
          where: { orderId },
          create: orderData,
          update: {
            ...orderData,
          },
        });

        // 仅在新增订单时更新角色充值统计
        if (!existing && !orderData.isSandbox) {
          await this.prisma.role.updateMany({
            where: { roleId },
            data: {
              totalRechargeUsd: { increment: orderData.payAmountUsd },
              totalRechargeTimes: { increment: 1 },
            },
          });
        }

        if (existing) {
          updated++;
        } else {
          inserted++;
        }
      } catch (error) {
        skipped++;
        this.logger.warn(`Failed to upsert order: ${error instanceof Error ? error.message : error}`);
      }
    }

    if (skipped > 0) {
      this.logger.warn(`Skipped ${skipped} orders due to errors`);
    }

    return { inserted, updated };
  }

  // ============================================
  // 工具方法
  // ============================================

  /**
   * 设备类型标准化
   */
  private normalizeDeviceType(value: string): string {
    if (!value) return 'unknown';
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('android')) return 'Android';
    if (lowerValue.includes('iphone') || lowerValue.includes('ipad') || lowerValue.includes('ios') || lowerValue.includes('iphoneplayer')) return 'iOS';
    return value || 'unknown';
  }

  /**
   * 充值类型标准化
   */
  private normalizeRechargeType(value: string): string {
    if (!value) return 'cash';
    const lowerValue = value.toLowerCase();
    if (lowerValue === '现金' || lowerValue === 'cash') return 'cash';
    if (lowerValue === '积分' || lowerValue === 'points') return 'points';
    if (lowerValue === '代金券' || lowerValue === 'voucher') return 'voucher';
    return value || 'cash';
  }
}
