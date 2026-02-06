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
   * 全量同步角色数据（无数量限制）
   */
  async syncRolesAll(): Promise<TASyncResult> {
    const startTime = Date.now();
    const targetDate = dayjs().format('YYYY-MM-DD');
    
    this.logger.log('Starting full role sync from ThinkingData (no limit)');

    try {
      const sql = this.buildRoleSyncSQLNoLimit();
      const response = await this.queryWithRetry(sql);
      const { inserted, updated } = await this.upsertRoles(response);
      
      const duration = Date.now() - startTime;
      this.logger.log(`Full role sync completed: ${inserted} inserted, ${updated} updated in ${duration}ms`);

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
      
      this.logger.error(`Full role sync failed: ${errorMessage}`, error instanceof Error ? error.stack : '');
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
   * 按日期范围同步角色数据
   */
  async syncRolesRange(startDate: string, endDate: string, limit: number = 100000): Promise<TASyncResult> {
    const startTime = Date.now();
    
    this.logger.log(`Starting role sync from ThinkingData for date range: ${startDate} to ${endDate} (limit: ${limit})`);

    try {
      const sql = this.buildRoleSyncSQLRange(startDate, endDate, limit);
      const response = await this.queryWithRetry(sql);
      const { inserted, updated } = await this.upsertRoles(response);
      
      const duration = Date.now() - startTime;
      this.logger.log(`Role range sync completed: ${inserted} inserted, ${updated} updated in ${duration}ms`);

      await this.logSyncResult(startDate, 'success', inserted + updated, duration);

      return {
        success: true,
        syncDate: `${startDate}_${endDate}`,
        recordsProcessed: inserted + updated,
        recordsInserted: inserted,
        recordsUpdated: updated,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error(`Role range sync failed: ${errorMessage}`, error instanceof Error ? error.stack : '');
      await this.logSyncResult(startDate, 'failed', 0, duration, errorMessage);

      return {
        success: false,
        syncDate: `${startDate}_${endDate}`,
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
   * 数据来源：用户视图 ta.v_user_22（包含完整的角色信息）
   */
  private buildRoleSyncSQL(limit: number): string {
    return `
      SELECT 
        "#user_id",
        "#account_id",
        "create_role_id" as role_id,
        "current_role_name" as role_name,
        "current_level" as role_level,
        "current_vip_level" as vip_level,
        "create_server_id" as server_id,
        "create_server_name" as server_name,
        "tf_country" as country,
        "create_dev_type" as dev_type,
        "create_channel_id" as channel_id,
        "total_recharge_usd",
        "total_recharge_times",
        "total_login_days",
        "#active_time" as register_time,
        "sdk_last_login_time" as last_login_time,
        "tf_medium"
      FROM ta.v_user_22
      WHERE "create_role_id" IS NOT NULL
        AND (
          "tf_medium" ILIKE 'Organic'
          OR "tf_medium" ILIKE '%自然量%'
          OR "tf_medium" ILIKE 'WA\\_CPS\\_link%'
        )
      ORDER BY "#active_time" DESC
      LIMIT ${limit}
    `.trim();
  }

  /**
   * 构建角色全量同步 SQL（无数量限制）
   * 数据来源：用户视图 ta.v_user_22
   */
  private buildRoleSyncSQLNoLimit(): string {
    return `
      SELECT 
        "#user_id",
        "#account_id",
        "create_role_id" as role_id,
        "current_role_name" as role_name,
        "current_level" as role_level,
        "current_vip_level" as vip_level,
        "create_server_id" as server_id,
        "create_server_name" as server_name,
        "tf_country" as country,
        "create_dev_type" as dev_type,
        "create_channel_id" as channel_id,
        "total_recharge_usd",
        "total_recharge_times",
        "total_login_days",
        "#active_time" as register_time,
        "sdk_last_login_time" as last_login_time,
        "tf_medium"
      FROM ta.v_user_22
      WHERE "create_role_id" IS NOT NULL
        AND (
          "tf_medium" ILIKE 'Organic'
          OR "tf_medium" ILIKE '%自然量%'
          OR "tf_medium" ILIKE 'WA\\_CPS\\_link%'
        )
      ORDER BY "#active_time" DESC
    `.trim();
  }

  /**
   * 构建角色按日期范围同步 SQL
   * 数据来源：用户视图 ta.v_user_22
   * 使用 #active_time（注册时间）作为日期过滤条件
   * 注意：#active_time 是 timestamp(3) 类型，需要用 TIMESTAMP 函数转换日期字符串
   */
  private buildRoleSyncSQLRange(startDate: string, endDate: string, limit: number): string {
    return `
      SELECT 
        "#user_id",
        "#account_id",
        "create_role_id" as role_id,
        "current_role_name" as role_name,
        "current_level" as role_level,
        "current_vip_level" as vip_level,
        "create_server_id" as server_id,
        "create_server_name" as server_name,
        "tf_country" as country,
        "create_dev_type" as dev_type,
        "create_channel_id" as channel_id,
        "total_recharge_usd",
        "total_recharge_times",
        "total_login_days",
        "#active_time" as register_time,
        "sdk_last_login_time" as last_login_time,
        "tf_medium"
      FROM ta.v_user_22
      WHERE "create_role_id" IS NOT NULL
        AND (
          "tf_medium" ILIKE 'Organic'
          OR "tf_medium" ILIKE '%自然量%'
          OR "tf_medium" ILIKE 'WA\\_CPS\\_link%'
        )
        AND "#active_time" >= TIMESTAMP '${startDate} 00:00:00'
        AND "#active_time" < TIMESTAMP '${endDate} 23:59:59'
      ORDER BY "#active_time" DESC
      LIMIT ${limit}
    `.trim();
  }

  /**
   * 角色数据入库（批量优化版本）
   * 数据来源：用户视图 ta.v_user_22
   * 优化：批量查询 + 事务批量 upsert，大幅减少数据库操作次数
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

    this.logger.log(`Processing ${rows.length} roles, columns: ${columns.join(', ')}`);

    // 1. 解析所有角色数据
    const roleDataList: Array<{
      roleId: string;
      userId: string | null;
      accountId: string | null;
      roleName: string | null;
      roleLevel: number;
      vipLevel: number;
      serverId: number;
      serverName: string;
      country: string | null;
      deviceType: string | null;
      channelId: number | null;
      totalRechargeUsd: number;
      totalRechargeTimes: number;
      totalLoginDays: number;
      registerTime: Date;
      lastLoginTime: Date | null;
      tfMedium: string | null;
    }> = [];

    for (const row of rows) {
      const roleId = String(row[columnIndex['role_id']] || '');
      if (!roleId) continue;

      const serverId = parseInt(String(row[columnIndex['server_id']] || '0'), 10);
      if (!serverId) continue;

      roleDataList.push({
        roleId,
        userId: String(row[columnIndex['#user_id']] || '') || null,
        accountId: String(row[columnIndex['#account_id']] || '') || null,
        roleName: String(row[columnIndex['role_name']] || '') || null,
        roleLevel: parseInt(String(row[columnIndex['role_level']] || '1'), 10) || 1,
        vipLevel: parseInt(String(row[columnIndex['vip_level']] || '0'), 10) || 0,
        serverId,
        serverName: String(row[columnIndex['server_name']] || '') || `S${serverId}`,
        country: String(row[columnIndex['country']] || '') || null,
        deviceType: this.normalizeDeviceType(String(row[columnIndex['dev_type']] || '')),
        channelId: parseInt(String(row[columnIndex['channel_id']] || '0'), 10) || null,
        totalRechargeUsd: parseFloat(String(row[columnIndex['total_recharge_usd']] || '0')) || 0,
        totalRechargeTimes: parseInt(String(row[columnIndex['total_recharge_times']] || '0'), 10) || 0,
        totalLoginDays: parseInt(String(row[columnIndex['total_login_days']] || '0'), 10) || 0,
        registerTime: row[columnIndex['register_time']] ? new Date(String(row[columnIndex['register_time']])) : new Date(),
        lastLoginTime: row[columnIndex['last_login_time']] ? new Date(String(row[columnIndex['last_login_time']])) : null,
        tfMedium: String(row[columnIndex['tf_medium']] || '') || null,
      });
    }

    if (roleDataList.length === 0) {
      return { inserted: 0, updated: 0 };
    }

    // 2. 批量查询已存在的角色 ID
    const allRoleIds = roleDataList.map(r => r.roleId);
    const existingRoles = await this.prisma.role.findMany({
      where: { roleId: { in: allRoleIds } },
      select: { roleId: true },
    });
    const existingSet = new Set(existingRoles.map(r => r.roleId));

    // 3. 批量 upsert（使用事务，每批 200 条）
    const BATCH_SIZE = 200;
    let inserted = 0;
    let updated = 0;

    for (let i = 0; i < roleDataList.length; i += BATCH_SIZE) {
      const batch = roleDataList.slice(i, i + BATCH_SIZE);
      
      try {
        await this.prisma.$transaction(
          batch.map(roleData => {
            // N2: update 不包含 cpsVisible，避免覆盖已审核通过的角色
            const { tfMedium: _tf, ...updateData } = roleData;
            return this.prisma.role.upsert({
              where: { roleId: roleData.roleId },
              create: {
                ...roleData,
                cpsVisible: false, // N2: 新角色默认不可见
              },
              update: {
                ...updateData,
                tfMedium: roleData.tfMedium, // 同步 tf_medium
                updatedAt: new Date(),
                // ⚠️ 不包含 cpsVisible，避免覆盖已审核通过的角色
              },
            });
          })
        );

        // 统计新增和更新数量
        for (const roleData of batch) {
          if (existingSet.has(roleData.roleId)) {
            updated++;
          } else {
            inserted++;
          }
        }
      } catch (error) {
        this.logger.warn(`Batch upsert failed, falling back to individual upsert: ${error instanceof Error ? error.message : error}`);
        // 批量失败时回退到逐条处理
        for (const roleData of batch) {
          try {
            const { tfMedium: _tf, ...updateData } = roleData;
            await this.prisma.role.upsert({
              where: { roleId: roleData.roleId },
              create: { ...roleData, cpsVisible: false },
              update: { ...updateData, tfMedium: roleData.tfMedium, updatedAt: new Date() },
            });
            if (existingSet.has(roleData.roleId)) {
              updated++;
            } else {
              inserted++;
            }
          } catch (err) {
            this.logger.warn(`Failed to upsert role ${roleData.roleId}: ${err instanceof Error ? err.message : err}`);
          }
        }
      }

      // 进度日志
      if ((i + BATCH_SIZE) % 2000 === 0 || i + BATCH_SIZE >= roleDataList.length) {
        this.logger.log(`Role upsert progress: ${Math.min(i + BATCH_SIZE, roleDataList.length)}/${roleDataList.length}`);
      }
    }

    return { inserted, updated };
  }

  // ============================================
  // 最后登录时间同步
  // ============================================

  /**
   * 同步角色最后登录时间（从 ThinkingData role_login 事件）
   * @param targetDate 目标日期，格式 YYYY-MM-DD，默认昨天
   */
  async syncLastLoginTime(targetDate?: string): Promise<TASyncResult> {
    const startTime = Date.now();
    const syncDate = targetDate || dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    
    this.logger.log(`Starting last login time sync for date: ${syncDate}`);

    try {
      const sql = this.buildLastLoginTimeSQL(syncDate);
      const response = await this.queryWithRetry(sql);
      const updatedCount = await this.updateLastLoginTime(response);
      
      const duration = Date.now() - startTime;
      this.logger.log(`Last login time sync completed: ${updatedCount} roles updated in ${duration}ms`);

      await this.logSyncResult(syncDate, 'success', updatedCount, duration);

      return {
        success: true,
        syncDate,
        recordsProcessed: updatedCount,
        recordsInserted: 0,
        recordsUpdated: updatedCount,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error(`Last login time sync failed: ${errorMessage}`, error instanceof Error ? error.stack : '');
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
   * 批量同步日期范围内的最后登录时间
   */
  async syncLastLoginTimeRange(startDate: string, endDate: string): Promise<TASyncResult> {
    const startTime = Date.now();
    
    this.logger.log(`Starting last login time sync for range: ${startDate} to ${endDate}`);

    try {
      const sql = this.buildLastLoginTimeRangeSQL(startDate, endDate);
      const response = await this.queryWithRetry(sql);
      const updatedCount = await this.updateLastLoginTime(response);
      
      const duration = Date.now() - startTime;
      this.logger.log(`Last login time range sync completed: ${updatedCount} roles updated in ${duration}ms`);

      await this.logSyncResult(startDate, 'success', updatedCount, duration);

      return {
        success: true,
        syncDate: `${startDate}_${endDate}`,
        recordsProcessed: updatedCount,
        recordsInserted: 0,
        recordsUpdated: updatedCount,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error(`Last login time range sync failed: ${errorMessage}`, error instanceof Error ? error.stack : '');
      await this.logSyncResult(startDate, 'failed', 0, duration, errorMessage);

      return {
        success: false,
        syncDate: `${startDate}_${endDate}`,
        recordsProcessed: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * 构建单日最后登录时间 SQL
   */
  private buildLastLoginTimeSQL(targetDate: string): string {
    return `
      SELECT 
        "#account_id" as account_id,
        max("#event_time") as last_login_time,
        "server_id",
        "role_name",
        "server_name"
      FROM ${this.eventView}
      WHERE "$part_event" = 'role_login'
        AND "$part_date" = '${targetDate}'
        AND "#event_time" BETWEEN cast('${targetDate} 00:00:00.000' as timestamp) 
            AND cast('${targetDate} 23:59:59.999' as timestamp)
      GROUP BY "#account_id", "server_id", "role_name", "server_name"
    `.trim();
  }

  /**
   * 构建日期范围最后登录时间 SQL
   */
  private buildLastLoginTimeRangeSQL(startDate: string, endDate: string): string {
    return `
      SELECT 
        "#account_id" as account_id,
        max("#event_time") as last_login_time,
        "server_id",
        "role_name",
        "server_name"
      FROM ${this.eventView}
      WHERE "$part_event" = 'role_login'
        AND "$part_date" BETWEEN '${startDate}' AND '${endDate}'
        AND "#event_time" BETWEEN cast('${startDate} 00:00:00.000' as timestamp) 
            AND cast('${endDate} 23:59:59.999' as timestamp)
      GROUP BY "#account_id", "server_id", "role_name", "server_name"
    `.trim();
  }

  /**
   * 更新角色最后登录时间（批量优化版本）
   */
  private async updateLastLoginTime(response: TAQueryResponse): Promise<number> {
    const columns = response.data?.headers || [];
    const rows = response.data?.rows || [];

    if (!rows.length) {
      this.logger.warn('No login data in ThinkingData response');
      return 0;
    }

    const columnIndex = columns.reduce((acc, col, idx) => {
      acc[col] = idx;
      return acc;
    }, {} as Record<string, number>);

    this.logger.log(`Processing ${rows.length} login records, columns: ${columns.join(', ')}`);

    // 解析所有登录记录
    const loginRecords: { accountId: string; lastLoginTime: Date }[] = [];
    for (const row of rows) {
      const accountId = String(row[columnIndex['account_id']] || '');
      const lastLoginTimeStr = row[columnIndex['last_login_time']];
      
      if (!accountId || !lastLoginTimeStr) continue;
      
      loginRecords.push({
        accountId,
        lastLoginTime: new Date(String(lastLoginTimeStr)),
      });
    }

    if (loginRecords.length === 0) {
      return 0;
    }

    // 批量更新（使用原生 SQL，每批 500 条）
    const BATCH_SIZE = 500;
    let updatedCount = 0;

    for (let i = 0; i < loginRecords.length; i += BATCH_SIZE) {
      const batch = loginRecords.slice(i, i + BATCH_SIZE);
      
      // 构建批量更新 SQL (使用 PostgreSQL 的 CASE WHEN)
      const caseWhen = batch.map(r => 
        `WHEN role_id = '${r.accountId}' OR account_id = '${r.accountId}' THEN '${r.lastLoginTime.toISOString()}'::timestamp`
      ).join('\n        ');
      
      const accountIds = batch.map(r => `'${r.accountId}'`).join(', ');
      
      const sql = `
        UPDATE roles 
        SET last_login_time = CASE 
        ${caseWhen}
        ELSE last_login_time END,
        updated_at = NOW()
        WHERE role_id IN (${accountIds}) OR account_id IN (${accountIds})
      `;

      try {
        const result = await this.prisma.$executeRawUnsafe(sql);
        updatedCount += Number(result);
        
        if ((i + BATCH_SIZE) % 2000 === 0 || i + BATCH_SIZE >= loginRecords.length) {
          this.logger.log(`Batch progress: ${Math.min(i + BATCH_SIZE, loginRecords.length)}/${loginRecords.length} processed`);
        }
      } catch (error) {
        this.logger.warn(`Batch update failed at ${i}: ${error instanceof Error ? error.message : error}`);
      }
    }

    return updatedCount;
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
   * 全量同步订单数据（无数量限制）
   */
  async syncOrdersAll(): Promise<TASyncResult> {
    const startTime = Date.now();
    const syncDate = dayjs().format('YYYY-MM-DD');
    
    this.logger.log('Starting full order sync from ThinkingData (no limit)');

    try {
      const sql = this.buildOrderSyncSQLNoLimit();
      const response = await this.queryWithRetry(sql);
      const { inserted, updated } = await this.upsertOrders(response);
      
      const duration = Date.now() - startTime;
      this.logger.log(`Full order sync completed: ${inserted} inserted, ${updated} updated in ${duration}ms`);

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
      
      this.logger.error(`Full order sync failed: ${errorMessage}`, error instanceof Error ? error.stack : '');
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
   * 计算日期偏移（用于处理时区差异）
   */
  private getOffsetDate(dateStr: string, dayOffset: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + dayOffset);
    return date.toISOString().slice(0, 10);
  }

  /**
   * 将 pay_type 数字转换为中文显示
   * 1=谷歌支付, 2=苹果支付, 3=平台支付
   */
  private normalizePayType(payType: string | number | null | undefined): string {
    const typeMap: Record<string, string> = {
      '1': '谷歌支付',
      '2': '苹果支付',
      '3': '平台支付',
    };
    const key = String(payType || '');
    return typeMap[key] || '未知';
  }

  /**
   * 构建订单同步 SQL（支持日期范围）
   * 通过 LEFT JOIN sdk_order_purchase 事件获取 pay_type（充值渠道）
   */
  private buildOrderSyncSQL(targetDate: string, limit: number, endDate?: string): string {
    // 如果提供了 endDate，则使用日期范围查询
    const dateCondition = endDate 
      ? `"$part_date" >= '${targetDate}' AND "$part_date" <= '${endDate}'`
      : `"$part_date" = '${targetDate}'`;

    // sdk_order_purchase 事件时区不同，需要提前1天查询
    const sdkStartDate = this.getOffsetDate(targetDate, -1);
    const sdkEndDate = endDate ? endDate : targetDate;

    return `
      SELECT 
        order_info."game_order_id",
        order_info."role_id",
        order_info."role_name",
        order_info."role_level",
        order_info."server_id",
        order_info."server_name",
        order_info."#country",
        order_info."dev_type",
        order_info."channel_id",
        order_info."goods_id",
        order_info."pay_amount_usd",
        order_info."currency_type",
        order_info."currency_amount",
        order_info."recharge_type",
        order_info."is_sandbox",
        order_info."#event_time",
        publish_info."pay_type"
      FROM (
        SELECT * FROM ${this.eventView}
        WHERE "$part_event" = 'recharge_complete'
          AND ${dateCondition}
      ) AS order_info
      LEFT JOIN (
        SELECT "game_order_id", "pay_type"
        FROM ${this.eventView}
        WHERE "$part_event" = 'sdk_order_purchase'
          AND "$part_date" >= '${sdkStartDate}'
          AND "$part_date" <= '${sdkEndDate}'
      ) AS publish_info
      ON order_info."game_order_id" = publish_info."game_order_id"
      ORDER BY order_info."#event_time" DESC
      LIMIT ${limit}
    `.trim();
  }

  /**
   * 构建订单全量同步 SQL（无数量限制）
   * 通过 LEFT JOIN sdk_order_purchase 事件获取 pay_type（充值渠道）
   */
  private buildOrderSyncSQLNoLimit(): string {
    return `
      SELECT 
        order_info."game_order_id",
        order_info."role_id",
        order_info."role_name",
        order_info."role_level",
        order_info."server_id",
        order_info."server_name",
        order_info."#country",
        order_info."dev_type",
        order_info."channel_id",
        order_info."goods_id",
        order_info."pay_amount_usd",
        order_info."currency_type",
        order_info."currency_amount",
        order_info."recharge_type",
        order_info."is_sandbox",
        order_info."#event_time",
        publish_info."pay_type"
      FROM (
        SELECT * FROM ${this.eventView}
        WHERE "$part_event" = 'recharge_complete'
      ) AS order_info
      LEFT JOIN (
        SELECT "game_order_id", "pay_type"
        FROM ${this.eventView}
        WHERE "$part_event" = 'sdk_order_purchase'
      ) AS publish_info
      ON order_info."game_order_id" = publish_info."game_order_id"
      ORDER BY order_info."#event_time" DESC
    `.trim();
  }

  /**
   * 同步日期范围内的订单数据
   */
  async syncOrdersRange(startDate: string, endDate: string, limit: number = 50000): Promise<TASyncResult> {
    const startTime = Date.now();
    
    this.logger.log(`Starting order sync from ThinkingData for date range: ${startDate} to ${endDate} (limit: ${limit})`);

    try {
      const sql = this.buildOrderSyncSQL(startDate, limit, endDate);
      const response = await this.queryWithRetry(sql);
      const { inserted, updated } = await this.upsertOrders(response);
      
      const duration = Date.now() - startTime;
      this.logger.log(`Order range sync completed: ${inserted} inserted, ${updated} updated in ${duration}ms`);

      await this.logSyncResult(startDate, 'success', inserted + updated, duration);

      return {
        success: true,
        syncDate: `${startDate} to ${endDate}`,
        recordsProcessed: inserted + updated,
        recordsInserted: inserted,
        recordsUpdated: updated,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error(`Order range sync failed: ${errorMessage}`, error instanceof Error ? error.stack : '');
      await this.logSyncResult(startDate, 'failed', 0, duration, errorMessage);

      return {
        success: false,
        syncDate: `${startDate} to ${endDate}`,
        recordsProcessed: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * 订单数据入库（批量优化版本）
   * 优化：批量查询 + 事务批量 upsert，大幅减少数据库操作次数
   */
  private async upsertOrders(response: TAQueryResponse): Promise<{ inserted: number; updated: number; skipped: number }> {
    const columns = response.data?.headers || [];
    const rows = response.data?.rows || [];

    if (!rows.length) {
      this.logger.warn('No order data in ThinkingData response');
      return { inserted: 0, updated: 0, skipped: 0 };
    }

    const columnIndex = columns.reduce((acc, col, idx) => {
      acc[col] = idx;
      return acc;
    }, {} as Record<string, number>);

    this.logger.log(`Processing ${rows.length} orders`);

    // 1. 解析所有订单数据
    type OrderData = {
      orderId: string;
      roleId: string;
      roleName: string | null;
      roleLevel: number | null;
      serverId: number;
      serverName: string;
      country: string | null;
      deviceType: string | null;
      channelId: number | null;
      goodsId: string | null;
      payAmountUsd: number;
      currencyType: string | null;
      currencyAmount: number | null;
      rechargeType: string | null;
      payChannel: string | null;
      isSandbox: boolean;
      payTime: Date;
    };

    const orderDataList: OrderData[] = [];

    for (const row of rows) {
      const orderId = String(row[columnIndex['game_order_id']] || '');
      if (!orderId) continue;

      const roleId = String(row[columnIndex['role_id']] || '');
      if (!roleId) continue;

      const serverId = parseInt(String(row[columnIndex['server_id']] || '0'), 10);
      if (!serverId) continue;

      orderDataList.push({
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
        payChannel: this.normalizePayType(row[columnIndex['pay_type']]),
        isSandbox: String(row[columnIndex['is_sandbox']] || '0') === '1',
        payTime: row[columnIndex['#event_time']] ? new Date(String(row[columnIndex['#event_time']])) : new Date(),
      });
    }

    if (orderDataList.length === 0) {
      return { inserted: 0, updated: 0, skipped: 0 };
    }

    // 2. 批量查询已存在的角色（用于外键校验）
    const allRoleIds = [...new Set(orderDataList.map(o => o.roleId))];
    const existingRoles = await this.prisma.role.findMany({
      where: { roleId: { in: allRoleIds } },
      select: { roleId: true },
    });
    const existingRoleSet = new Set(existingRoles.map(r => r.roleId));

    // 3. 过滤掉角色不存在的订单
    const validOrders = orderDataList.filter(o => existingRoleSet.has(o.roleId));
    const skipped = orderDataList.length - validOrders.length;

    if (skipped > 0) {
      this.logger.warn(`Skipped ${skipped} orders (role not found)`);
    }

    if (validOrders.length === 0) {
      return { inserted: 0, updated: 0, skipped };
    }

    // 4. 批量查询已存在的订单
    const allOrderIds = validOrders.map(o => o.orderId);
    const existingOrders = await this.prisma.order.findMany({
      where: { orderId: { in: allOrderIds } },
      select: { orderId: true },
    });
    const existingOrderSet = new Set(existingOrders.map(o => o.orderId));

    // 5. 批量 upsert 订单（使用事务，每批 200 条）
    const BATCH_SIZE = 200;
    let inserted = 0;
    let updated = 0;

    // 收集新增订单的充值统计（用于批量更新角色）
    const rechargeStats: Map<string, { amount: number; count: number }> = new Map();

    for (let i = 0; i < validOrders.length; i += BATCH_SIZE) {
      const batch = validOrders.slice(i, i + BATCH_SIZE);
      
      try {
        await this.prisma.$transaction(
          batch.map(orderData => 
            this.prisma.order.upsert({
              where: { orderId: orderData.orderId },
              create: orderData,
              update: orderData,
            })
          )
        );

        // 统计新增和更新数量，并收集充值统计
        for (const orderData of batch) {
          if (existingOrderSet.has(orderData.orderId)) {
            updated++;
          } else {
            inserted++;
            // 新增订单且非沙盒，记录充值统计
            if (!orderData.isSandbox && orderData.payAmountUsd > 0) {
              const stats = rechargeStats.get(orderData.roleId) || { amount: 0, count: 0 };
              stats.amount += orderData.payAmountUsd;
              stats.count += 1;
              rechargeStats.set(orderData.roleId, stats);
            }
          }
        }
      } catch (error) {
        this.logger.warn(`Batch order upsert failed, falling back to individual: ${error instanceof Error ? error.message : error}`);
        // 批量失败时回退到逐条处理
        for (const orderData of batch) {
          try {
            await this.prisma.order.upsert({
              where: { orderId: orderData.orderId },
              create: orderData,
              update: orderData,
            });
            if (existingOrderSet.has(orderData.orderId)) {
              updated++;
            } else {
              inserted++;
              if (!orderData.isSandbox && orderData.payAmountUsd > 0) {
                const stats = rechargeStats.get(orderData.roleId) || { amount: 0, count: 0 };
                stats.amount += orderData.payAmountUsd;
                stats.count += 1;
                rechargeStats.set(orderData.roleId, stats);
              }
            }
          } catch (err) {
            this.logger.warn(`Failed to upsert order ${orderData.orderId}: ${err instanceof Error ? err.message : err}`);
          }
        }
      }

      // 进度日志
      if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= validOrders.length) {
        this.logger.log(`Order upsert progress: ${Math.min(i + BATCH_SIZE, validOrders.length)}/${validOrders.length}`);
      }
    }

    // 6. 批量更新角色充值统计
    if (rechargeStats.size > 0) {
      this.logger.log(`Updating recharge stats for ${rechargeStats.size} roles`);
      for (const [roleId, stats] of rechargeStats) {
        try {
          await this.prisma.role.update({
            where: { roleId },
            data: {
              totalRechargeUsd: { increment: stats.amount },
              totalRechargeTimes: { increment: stats.count },
            },
          });
        } catch (error) {
          this.logger.warn(`Failed to update recharge stats for role ${roleId}: ${error instanceof Error ? error.message : error}`);
        }
      }
    }

    return { inserted, updated, skipped };
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
