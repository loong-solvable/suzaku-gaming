// src/modules/thinkingdata/thinkingdata.scheduler.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { ThinkingDataService } from './thinkingdata.service';
import { TASyncResult } from './interfaces/ta-response.interface';

export interface FullSyncResult {
  success: boolean;
  roles: TASyncResult;
  orders: TASyncResult;
  lastLogin: TASyncResult;
  stats: TASyncResult;
  totalRecords: number;
  duration: number;
  error?: string;
}

@Injectable()
export class ThinkingDataScheduler implements OnModuleInit {
  private readonly logger = new Logger(ThinkingDataScheduler.name);
  private readonly syncEnabled: boolean;
  private isSyncing = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly thinkingDataService: ThinkingDataService,
  ) {
    this.syncEnabled = this.configService.get<string>('TA_SYNC_ENABLED') === 'true';
  }

  onModuleInit() {
    if (this.syncEnabled) {
      this.logger.log('ThinkingData sync scheduler initialized (incremental sync every 30 minutes)');
    } else {
      this.logger.warn('ThinkingData sync is DISABLED');
    }
  }

  // 每 30 分钟执行增量数据同步
  @Cron('0 */30 * * * *', {
    name: 'thinkingdata-incremental-sync',
    timeZone: 'Asia/Shanghai',
  })
  async handleFullSync() {
    if (!this.syncEnabled) {
      this.logger.debug('Sync skipped: TA_SYNC_ENABLED is false');
      return;
    }

    if (this.isSyncing) {
      this.logger.warn('Sync skipped: Previous sync still in progress');
      return;
    }

    this.isSyncing = true;
    this.logger.log('Starting scheduled incremental ThinkingData sync...');

    try {
      const result = await this.executeFullSync();

      if (result.success) {
        this.logger.log(
          `Scheduled full sync completed: ${result.totalRecords} total records ` +
          `(roles: ${result.roles.recordsProcessed}, orders: ${result.orders.recordsProcessed}, stats: ${result.stats.recordsProcessed}) ` +
          `in ${result.duration}ms`
        );
      } else {
        this.logger.error(`Scheduled full sync failed: ${result.error}`);
        await this.sendAlertNotification(result);
      }
    } finally {
      this.isSyncing = false;
    }
  }

  // 执行增量同步（同步最近2天的数据，确保不遗漏）
  async executeFullSync(): Promise<FullSyncResult> {
    const startTime = Date.now();
    
    // 增量同步策略：始终同步最近2天的数据
    // - 使用 $part_date 按天分区过滤（数数平台推荐的高性能查询方式）
    // - 每30分钟执行一次，2天窗口确保跨天数据不遗漏
    // - 使用 upsert 确保数据幂等性（已存在则更新，不存在则插入）
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    
    // 始终包含昨天，确保跨天边界数据不遗漏
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const startDate = yesterday.toISOString().slice(0, 10);
    const endDate = today;

    this.logger.log(`Incremental sync: ${startDate} to ${endDate} (2-day window)`);

    // 1. 先同步角色（role_create 事件，确保订单同步时角色已存在）
    this.logger.log('Step 1/4: Syncing roles (role_create events)...');
    const rolesResult = await this.thinkingDataService.syncRolesRange(startDate, endDate, 50000);

    // 2. 再同步订单（recharge_complete 事件，不自动创建角色）
    this.logger.log('Step 2/4: Syncing orders (recharge_complete events)...');
    const ordersResult = await this.thinkingDataService.syncOrdersRange(startDate, endDate, 50000);

    // 3. 同步最后登录时间（role_login 事件）
    this.logger.log('Step 3/4: Syncing last login time (role_login events)...');
    const lastLoginResult = await this.thinkingDataService.syncLastLoginTimeRange(startDate, endDate);

    // 4. 同步行为统计（昨日汇总）
    this.logger.log('Step 4/4: Syncing behavior stats (yesterday)...');
    const statsResult = await this.thinkingDataService.syncYesterdayData();

    const duration = Date.now() - startTime;
    const allSuccess = rolesResult.success && ordersResult.success && lastLoginResult.success && statsResult.success;

    return {
      success: allSuccess,
      roles: rolesResult,
      orders: ordersResult,
      lastLogin: lastLoginResult,
      stats: statsResult,
      totalRecords: rolesResult.recordsProcessed + ordersResult.recordsProcessed + lastLoginResult.recordsProcessed + statsResult.recordsProcessed,
      duration,
      error: allSuccess ? undefined : 'One or more sync tasks failed',
    };
  }

  // 手动触发全量同步（供 API 调用）
  async triggerManualSync(): Promise<FullSyncResult> {
    this.logger.log('Manual full ThinkingData sync triggered');
    
    if (this.isSyncing) {
      return {
        success: false,
        roles: { success: false, syncDate: '', recordsProcessed: 0, recordsInserted: 0, recordsUpdated: 0, duration: 0, error: 'Sync in progress' },
        orders: { success: false, syncDate: '', recordsProcessed: 0, recordsInserted: 0, recordsUpdated: 0, duration: 0, error: 'Sync in progress' },
        lastLogin: { success: false, syncDate: '', recordsProcessed: 0, recordsInserted: 0, recordsUpdated: 0, duration: 0, error: 'Sync in progress' },
        stats: { success: false, syncDate: '', recordsProcessed: 0, recordsInserted: 0, recordsUpdated: 0, duration: 0, error: 'Sync in progress' },
        totalRecords: 0,
        duration: 0,
        error: 'Another sync is already in progress',
      };
    }

    this.isSyncing = true;
    try {
      return await this.executeFullSync();
    } finally {
      this.isSyncing = false;
    }
  }

  // 发送告警通知
  private async sendAlertNotification(result: FullSyncResult): Promise<void> {
    this.logger.error(`[ALERT] ThinkingData full sync failed: ${result.error}`);
    if (!result.roles.success) {
      this.logger.error(`  - Roles sync failed: ${result.roles.error}`);
    }
    if (!result.orders.success) {
      this.logger.error(`  - Orders sync failed: ${result.orders.error}`);
    }
    if (!result.lastLogin.success) {
      this.logger.error(`  - Last login sync failed: ${result.lastLogin.error}`);
    }
    if (!result.stats.success) {
      this.logger.error(`  - Stats sync failed: ${result.stats.error}`);
    }
  }
}
