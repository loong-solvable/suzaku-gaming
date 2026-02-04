// src/modules/thinkingdata/thinkingdata.scheduler.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { ThinkingDataService } from './thinkingdata.service';
import { TASyncResult } from './interfaces/ta-response.interface';

@Injectable()
export class ThinkingDataScheduler implements OnModuleInit {
  private readonly logger = new Logger(ThinkingDataScheduler.name);
  private readonly syncEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly thinkingDataService: ThinkingDataService,
  ) {
    this.syncEnabled = this.configService.get<string>('TA_SYNC_ENABLED') === 'true';
  }

  onModuleInit() {
    if (this.syncEnabled) {
      this.logger.log('ThinkingData sync scheduler initialized');
    } else {
      this.logger.warn('ThinkingData sync is DISABLED');
    }
  }

  /**
   * 每日 02:00 执行 T-1 数据同步
   * Cron 表达式: 秒 分 时 日 月 周
   */
  @Cron('0 0 2 * * *', {
    name: 'thinkingdata-daily-sync',
    timeZone: 'Asia/Shanghai',
  })
  async handleDailySync() {
    if (!this.syncEnabled) {
      this.logger.debug('Sync skipped: TA_SYNC_ENABLED is false');
      return;
    }

    this.logger.log('Starting scheduled ThinkingData sync...');
    const result = await this.thinkingDataService.syncYesterdayData();

    if (result.success) {
      this.logger.log(`Scheduled sync completed successfully: ${result.recordsProcessed} records`);
    } else {
      this.logger.error(`Scheduled sync failed: ${result.error}`);
      // TODO: 发送告警通知（邮件/IM/日志系统）
      await this.sendAlertNotification(result);
    }
  }

  /**
   * 手动触发同步（供 API 调用）
   */
  async triggerManualSync(): Promise<TASyncResult> {
    this.logger.log('Manual ThinkingData sync triggered');
    return this.thinkingDataService.syncYesterdayData();
  }

  /**
   * 发送告警通知
   */
  private async sendAlertNotification(result: TASyncResult): Promise<void> {
    // 实现告警逻辑：可对接企业微信/钉钉/邮件
    this.logger.error(`[ALERT] ThinkingData sync failed for ${result.syncDate}: ${result.error}`);
    // 示例：写入告警表或调用 Webhook
  }
}
