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
  private readonly maxRetries = 3;
  private readonly retryDelays = [5000, 10000, 30000]; // 指数退避: 5s, 10s, 30s

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiHost = this.configService.get<string>('TA_API_HOST') || '';
    this.projectToken = this.configService.get<string>('TA_PROJECT_TOKEN') || '';
    
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
      FROM events
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
   */
  private async executeQuery(sql: string): Promise<TAQueryResponse> {
    const url = `${this.apiHost}/open/v1/query_sql`;
    
    const params = new URLSearchParams({
      token: this.projectToken,
      sql: sql,
      format: 'json_object',
    });

    const response = await axios.post<TAQueryResponse>(url, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 60000,
    });

    // 校验返回码
    if (response.data.return_code !== 0) {
      throw new Error(`ThinkingData API error: ${response.data.return_message} (code: ${response.data.return_code})`);
    }

    return response.data;
  }

  /**
   * 解析 API 响应为结构化数据
   */
  private parseResponse(response: TAQueryResponse, targetDate: string): TAUserBehavior[] {
    if (!response.result?.rows?.length) {
      return [];
    }

    const { columns, rows } = response.result;
    const columnIndex = columns.reduce((acc, col, idx) => {
      acc[col] = idx;
      return acc;
    }, {} as Record<string, number>);

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
}
