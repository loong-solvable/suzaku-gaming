// src/modules/cps/cps-sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import axios from 'axios';
import dayjs from 'dayjs';

// ThinkingData API 响应接口
interface TAQueryResponse {
  return_code: number;
  return_message: string;
  result?: {
    columns: string[];
    rows: any[][];
  };
}

interface TAExecuteResponse {
  return_code: number;
  return_message: string;
  data?: {
    headers: string[];
    pageCount: number;
    pageSize: number;
    rowCount: number;
    taskId: string;
  };
}

interface CpsRechargeRow {
  accountId: string;
  eventTime: string;
  payAmountUsd: number;
  country: string;
  serverId: number;
  roleName: string;
  serverName: string;
  publisherOrderId: string;
  gameOrderId: string;
  rechargeType: string;
  cpsGroup: string;
}

interface CpsLoginRow {
  accountId: string;
  lastLoginTime: string;
  createTime: string;
  country: string;
  serverId: number;
  roleName: string;
  serverName: string;
  cpsGroup: string;
}

@Injectable()
export class CpsSyncService {
  private readonly logger = new Logger(CpsSyncService.name);
  private readonly apiHost: string;
  private readonly projectToken: string;
  private readonly eventView: string;
  private readonly cpsDimTable: string;
  private readonly syncEnabled: boolean;
  private readonly syncInterval: number;

  // 简单的内存锁（生产环境应使用 Redis 分布式锁）
  private syncLock = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiHost = this.configService.get<string>('TA_API_HOST') || '';
    this.projectToken = this.configService.get<string>('TA_PROJECT_TOKEN') || '';
    this.eventView = this.configService.get<string>('TA_EVENT_VIEW') || 'v_event_22';
    this.cpsDimTable = this.configService.get<string>('TA_CPS_DIM_TABLE') || 'ta_dim.dim_22_0_518509';
    this.syncEnabled = this.configService.get<boolean>('TA_CPS_SYNC_ENABLED') ?? false;
    this.syncInterval = this.configService.get<number>('TA_CPS_SYNC_INTERVAL') || 30;
  }

  /**
   * 每 30 分钟执行 CPS 数据同步
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async scheduledSync() {
    if (!this.syncEnabled) {
      return;
    }

    // 简单锁：防止重复执行
    if (this.syncLock) {
      this.logger.warn('CPS sync already running, skipping');
      return;
    }

    this.syncLock = true;

    try {
      this.logger.log('Starting scheduled CPS data sync...');

      // 同步最近 30 分钟的数据
      const endTime = dayjs();
      const startTime = endTime.subtract(this.syncInterval, 'minute');

      await Promise.all([
        this.syncRechargeLog(startTime.format('YYYY-MM-DD HH:mm:ss'), endTime.format('YYYY-MM-DD HH:mm:ss')),
        this.syncLoginLog(startTime.format('YYYY-MM-DD HH:mm:ss'), endTime.format('YYYY-MM-DD HH:mm:ss')),
      ]);

      this.logger.log('CPS data sync completed');
    } catch (error) {
      this.logger.error('CPS sync failed', error instanceof Error ? error.stack : error);
    } finally {
      this.syncLock = false;
    }
  }

  /**
   * 手动触发同步
   */
  async triggerSync(startTime?: string, endTime?: string): Promise<{ success: boolean; message: string }> {
    if (this.syncLock) {
      return { success: false, message: 'Sync already in progress' };
    }

    this.syncLock = true;

    try {
      const end = endTime ? dayjs(endTime) : dayjs();
      const start = startTime ? dayjs(startTime) : end.subtract(this.syncInterval, 'minute');

      const [rechargeResult, loginResult] = await Promise.all([
        this.syncRechargeLog(start.format('YYYY-MM-DD HH:mm:ss'), end.format('YYYY-MM-DD HH:mm:ss')),
        this.syncLoginLog(start.format('YYYY-MM-DD HH:mm:ss'), end.format('YYYY-MM-DD HH:mm:ss')),
      ]);

      return {
        success: true,
        message: `Synced ${rechargeResult.count} recharge logs and ${loginResult.count} login logs`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.syncLock = false;
    }
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): { running: boolean; lastSync?: Date } {
    return {
      running: this.syncLock,
    };
  }

  /**
   * 同步 CPS 充值日志
   */
  private async syncRechargeLog(startTime: string, endTime: string): Promise<{ count: number }> {
    const partDate = dayjs(startTime).format('YYYY-MM-DD');
    const syncBatch = `recharge_${dayjs().format('YYYYMMDDHHmmss')}`;

    const sql = `
      SELECT 
        "#account_id",
        "#event_time",
        "pay_amount_usd",
        "#country",
        "server_id",
        "role_name",
        "server_name",
        "publisher_order_id",
        "game_order_id",
        "recharge_type",
        "#account_id@cps_group"
      FROM (
        SELECT 
          "#account_id", "#event_time", "pay_amount_usd", "#country",
          "server_id", "role_name", "server_name", "publisher_order_id", 
          "game_order_id", "recharge_type"
        FROM ${this.eventView}
        WHERE "$part_event" = 'recharge_complete'
          AND "recharge_type" = '现金'
          AND "is_sandbox" = '0'
          AND "$part_date" = '${partDate}'
          AND "#event_time" BETWEEN 
              CAST('${startTime}' AS TIMESTAMP) 
              AND CAST('${endTime}' AS TIMESTAMP)
      ) AS role_recharge
      LEFT JOIN (
        SELECT "#account_id@account_id", "#account_id@cps_group" 
        FROM ${this.cpsDimTable}
      ) AS role_cps
      ON role_recharge."#account_id" = role_cps."#account_id@account_id"
      WHERE role_cps."#account_id@account_id" IS NOT NULL
    `.trim();

    try {
      const response = await this.executeQuery(sql);
      const rows = this.parseRechargeResponse(response);

      let insertedCount = 0;

      for (const row of rows) {
        try {
          // 使用 upsert 保证幂等性（基于 accountId + gameOrderId 唯一键）
          await this.prisma.cpsRechargeLog.upsert({
            where: {
              account_order_unique: {
                accountId: row.accountId,
                gameOrderId: row.gameOrderId,
              },
            },
            create: {
              accountId: row.accountId,
              roleName: row.roleName,
              serverId: row.serverId,
              serverName: row.serverName,
              country: row.country,
              cpsGroup: row.cpsGroup,
              gameOrderId: row.gameOrderId,
              publisherOrderId: row.publisherOrderId,
              payAmountUsd: new Decimal(row.payAmountUsd),
              rechargeType: row.rechargeType,
              eventTime: new Date(row.eventTime),
              syncBatch,
            },
            update: {
              // 已存在则更新同步批次
              syncBatch,
            },
          });
          insertedCount++;
        } catch (error) {
          this.logger.warn(`Failed to upsert recharge log: ${error}`);
        }
      }

      this.logger.log(`Synced ${insertedCount} CPS recharge logs`);
      return { count: insertedCount };
    } catch (error) {
      this.logger.error('Failed to sync recharge logs', error);
      throw error;
    }
  }

  /**
   * 同步 CPS 登录日志
   */
  private async syncLoginLog(startTime: string, endTime: string): Promise<{ count: number }> {
    const partDate = dayjs(startTime).format('YYYY-MM-DD');
    const syncBatch = `login_${dayjs().format('YYYYMMDDHHmmss')}`;

    const sql = `
      SELECT 
        role_login."#account_id",
        "#event_time" AS "last_login_time",
        "#active_time" AS "create_time",
        "#country",
        "server_id",
        "role_name",
        "server_name",
        "#account_id@cps_group"
      FROM (
        SELECT 
          "#account_id",
          MAX("#event_time") AS "#event_time",
          "#country", "server_id", "role_name", "server_name"
        FROM ${this.eventView}
        WHERE "$part_event" = 'role_login'
          AND "$part_date" = '${partDate}'
          AND "#event_time" BETWEEN 
              CAST('${startTime}' AS TIMESTAMP) 
              AND CAST('${endTime}' AS TIMESTAMP)
        GROUP BY "#account_id", "#country", "server_id", "role_name", "server_name"
      ) AS role_login
      LEFT JOIN (
        SELECT "#account_id", "#active_time" FROM v_user_22
      ) AS role_act
      ON role_login."#account_id" = role_act."#account_id"
      LEFT JOIN (
        SELECT "#account_id@account_id", "#account_id@cps_group" 
        FROM ${this.cpsDimTable}
      ) AS role_cps
      ON role_login."#account_id" = role_cps."#account_id@account_id"
      WHERE role_cps."#account_id@account_id" IS NOT NULL
    `.trim();

    try {
      const response = await this.executeQuery(sql);
      const rows = this.parseLoginResponse(response);

      let insertedCount = 0;

      for (const row of rows) {
        try {
          // 使用 upsert 保证幂等性（基于 accountId + syncBatch 唯一键）
          await this.prisma.cpsLoginLog.upsert({
            where: {
              account_batch_unique: {
                accountId: row.accountId,
                syncBatch,
              },
            },
            create: {
              accountId: row.accountId,
              roleName: row.roleName,
              serverId: row.serverId,
              serverName: row.serverName,
              country: row.country,
              cpsGroup: row.cpsGroup,
              lastLoginTime: new Date(row.lastLoginTime),
              createTime: row.createTime ? new Date(row.createTime) : null,
              eventTime: new Date(row.lastLoginTime),
              syncBatch,
            },
            update: {
              lastLoginTime: new Date(row.lastLoginTime),
            },
          });
          insertedCount++;
        } catch (error) {
          this.logger.warn(`Failed to upsert login log: ${error}`);
        }
      }

      this.logger.log(`Synced ${insertedCount} CPS login logs`);
      return { count: insertedCount };
    } catch (error) {
      this.logger.error('Failed to sync login logs', error);
      throw error;
    }
  }

  /**
   * 执行 ThinkingData SQL 查询
   */
  private async executeQuery(sql: string): Promise<TAQueryResponse> {
    const url = `${this.apiHost}/open/v1/query_sql`;

    const params = new URLSearchParams({
      token: this.projectToken,
      sql: sql,
      format: 'json_object',
      timeoutSeconds: '120',
    });

    const response = await axios.post<TAQueryResponse>(url, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 125000,
    });

    if (response.data.return_code !== 0) {
      throw new Error(
        `ThinkingData API error: ${response.data.return_message} (code: ${response.data.return_code})`,
      );
    }

    return response.data;
  }

  /**
   * 解析充值日志响应
   */
  private parseRechargeResponse(response: TAQueryResponse): CpsRechargeRow[] {
    if (!response.result?.rows?.length) {
      return [];
    }

    const { columns, rows } = response.result;
    const getIndex = (name: string) => columns.indexOf(name);

    return rows
      .map((row) => ({
        accountId: String(row[getIndex('#account_id')] || ''),
        eventTime: String(row[getIndex('#event_time')] || ''),
        payAmountUsd: Number(row[getIndex('pay_amount_usd')] || 0),
        country: String(row[getIndex('#country')] || ''),
        serverId: Number(row[getIndex('server_id')] || 0),
        roleName: String(row[getIndex('role_name')] || ''),
        serverName: String(row[getIndex('server_name')] || ''),
        publisherOrderId: String(row[getIndex('publisher_order_id')] || ''),
        gameOrderId: String(row[getIndex('game_order_id')] || ''),
        rechargeType: String(row[getIndex('recharge_type')] || ''),
        cpsGroup: String(row[getIndex('#account_id@cps_group')] || ''),
      }))
      .filter((r) => r.accountId && r.cpsGroup && r.gameOrderId);
  }

  /**
   * 解析登录日志响应
   */
  private parseLoginResponse(response: TAQueryResponse): CpsLoginRow[] {
    if (!response.result?.rows?.length) {
      return [];
    }

    const { columns, rows } = response.result;
    const getIndex = (name: string) => columns.indexOf(name);

    return rows
      .map((row) => ({
        accountId: String(row[getIndex('#account_id')] || ''),
        lastLoginTime: String(row[getIndex('last_login_time')] || ''),
        createTime: String(row[getIndex('create_time')] || ''),
        country: String(row[getIndex('#country')] || ''),
        serverId: Number(row[getIndex('server_id')] || 0),
        roleName: String(row[getIndex('role_name')] || ''),
        serverName: String(row[getIndex('server_name')] || ''),
        cpsGroup: String(row[getIndex('#account_id@cps_group')] || ''),
      }))
      .filter((r) => r.accountId && r.cpsGroup);
  }
}
