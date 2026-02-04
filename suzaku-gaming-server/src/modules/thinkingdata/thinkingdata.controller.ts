// src/modules/thinkingdata/thinkingdata.controller.ts
import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ThinkingDataScheduler } from './thinkingdata.scheduler';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('ThinkingData Sync')
@Controller('sync')
export class ThinkingDataController {
  constructor(
    private readonly scheduler: ThinkingDataScheduler,
    private readonly prisma: PrismaService,
  ) {}

  @Post('thinkingdata/trigger')
  @Public() // 开发阶段暂时公开，生产环境应添加认证
  @ApiOperation({ summary: '手动触发 ThinkingData 数据同步' })
  async triggerSync() {
    const result = await this.scheduler.triggerManualSync();
    return {
      success: result.success,
      message: result.success ? 'Sync completed' : result.error,
      data: result,
    };
  }

  @Get('thinkingdata/logs')
  @Public()
  @ApiOperation({ summary: '获取同步日志' })
  async getSyncLogs() {
    const logs = await this.prisma.syncLog.findMany({
      where: { source: 'thinkingdata' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { list: logs };
  }

  @Get('thinkingdata/status')
  @Public()
  @ApiOperation({ summary: '获取同步状态' })
  async getSyncStatus() {
    const lastSync = await this.prisma.syncLog.findFirst({
      where: { source: 'thinkingdata' },
      orderBy: { createdAt: 'desc' },
    });
    
    const todayStats = await this.prisma.userBehaviorStat.count({
      where: {
        eventDate: {
          gte: new Date(new Date().toISOString().split('T')[0]),
        },
      },
    });

    return {
      lastSync,
      todayRecords: todayStats,
      syncEnabled: process.env.TA_SYNC_ENABLED === 'true',
    };
  }
}
