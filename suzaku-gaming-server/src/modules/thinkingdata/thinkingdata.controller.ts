// src/modules/thinkingdata/thinkingdata.controller.ts
import { Controller, Post, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ThinkingDataScheduler } from './thinkingdata.scheduler';
import { ThinkingDataService } from './thinkingdata.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('ThinkingData Sync')
@Controller('sync')
export class ThinkingDataController {
  constructor(
    private readonly scheduler: ThinkingDataScheduler,
    private readonly thinkingDataService: ThinkingDataService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('thinkingdata/trigger')
  @Public() // 开发阶段暂时公开，生产环境应添加认证
  @ApiOperation({ summary: '手动触发 ThinkingData 行为统计同步' })
  async triggerSync() {
    const result = await this.scheduler.triggerManualSync();
    return {
      code: 0,
      message: result.success ? 'success' : result.error,
      data: result,
    };
  }

  @Post('thinkingdata/sync-roles')
  @Public()
  @ApiOperation({ summary: '同步角色数据' })
  @ApiQuery({ name: 'limit', required: false, description: '最大同步数量，默认10000' })
  async syncRoles(@Query('limit') limit?: string) {
    const maxLimit = limit ? parseInt(limit, 10) : 10000;
    const result = await this.thinkingDataService.syncRoles(maxLimit);
    return {
      code: 0,
      message: result.success ? 'success' : result.error,
      data: result,
    };
  }

  @Post('thinkingdata/sync-orders')
  @Public()
  @ApiOperation({ summary: '同步订单数据' })
  @ApiQuery({ name: 'date', required: false, description: '目标日期，格式 YYYY-MM-DD，默认昨天' })
  @ApiQuery({ name: 'limit', required: false, description: '最大同步数量，默认10000' })
  async syncOrders(
    @Query('date') date?: string,
    @Query('limit') limit?: string,
  ) {
    const maxLimit = limit ? parseInt(limit, 10) : 10000;
    const result = await this.thinkingDataService.syncOrders(date, maxLimit);
    return {
      code: 0,
      message: result.success ? 'success' : result.error,
      data: result,
    };
  }

  @Post('thinkingdata/sync-all')
  @Public()
  @ApiOperation({ summary: '同步所有数据（角色+订单+行为统计）' })
  async syncAll() {
    const results = {
      roles: await this.thinkingDataService.syncRoles(10000),
      orders: await this.thinkingDataService.syncOrders(undefined, 10000),
      stats: await this.scheduler.triggerManualSync(),
    };

    const allSuccess = results.roles.success && results.orders.success && results.stats.success;

    return {
      code: 0,
      message: allSuccess ? 'success' : 'partial failure',
      data: {
        roles: results.roles,
        orders: results.orders,
        stats: results.stats,
        summary: {
          rolesProcessed: results.roles.recordsProcessed,
          ordersProcessed: results.orders.recordsProcessed,
          statsProcessed: results.stats.recordsProcessed,
        },
      },
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
    
    const [roleCount, orderCount, behaviorStatCount] = await Promise.all([
      this.prisma.role.count(),
      this.prisma.order.count(),
      this.prisma.userBehaviorStat.count(),
    ]);

    return {
      lastSync,
      counts: {
        roles: roleCount,
        orders: orderCount,
        behaviorStats: behaviorStatCount,
      },
      syncEnabled: process.env.TA_SYNC_ENABLED === 'true',
    };
  }
}
