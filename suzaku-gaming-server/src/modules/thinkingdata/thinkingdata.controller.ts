// src/modules/thinkingdata/thinkingdata.controller.ts
import { Controller, Post, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ThinkingDataScheduler } from './thinkingdata.scheduler';
import { ThinkingDataService } from './thinkingdata.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('ThinkingData Sync')
@ApiBearerAuth()
@Controller('sync')
export class ThinkingDataController {
  constructor(
    private readonly scheduler: ThinkingDataScheduler,
    private readonly thinkingDataService: ThinkingDataService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('thinkingdata/trigger')
  @Roles('admin')
  @ApiOperation({ summary: '手动触发全量数据同步（角色+订单+行为统计）' })
  async triggerSync() {
    // 直接返回业务对象，ResponseInterceptor 会统一包装
    return this.scheduler.triggerManualSync();
  }

  @Post('thinkingdata/sync-roles')
  @Roles('admin')
  @ApiOperation({ summary: '同步角色数据' })
  @ApiQuery({ name: 'limit', required: false, description: '最大同步数量，默认10000' })
  async syncRoles(@Query('limit') limit?: string) {
    const maxLimit = limit ? parseInt(limit, 10) : 10000;
    return this.thinkingDataService.syncRoles(maxLimit);
  }

  @Post('thinkingdata/sync-orders')
  @Roles('admin')
  @ApiOperation({ summary: '同步订单数据' })
  @ApiQuery({ name: 'date', required: false, description: '目标日期，格式 YYYY-MM-DD，默认昨天' })
  @ApiQuery({ name: 'limit', required: false, description: '最大同步数量，默认10000' })
  async syncOrders(
    @Query('date') date?: string,
    @Query('limit') limit?: string,
  ) {
    const maxLimit = limit ? parseInt(limit, 10) : 10000;
    return this.thinkingDataService.syncOrders(date, maxLimit);
  }

  @Post('thinkingdata/sync-orders-range')
  @Roles('admin')
  @ApiOperation({ summary: '同步日期范围内的订单数据' })
  @ApiQuery({ name: 'startDate', required: true, description: '开始日期，格式 YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: true, description: '结束日期，格式 YYYY-MM-DD' })
  @ApiQuery({ name: 'limit', required: false, description: '最大同步数量，默认50000' })
  async syncOrdersRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: string,
  ) {
    // 使用异常而非手动返回错误
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }
    const maxLimit = limit ? parseInt(limit, 10) : 50000;
    return this.thinkingDataService.syncOrdersRange(startDate, endDate, maxLimit);
  }

  @Post('thinkingdata/sync-all')
  @Roles('admin')
  @ApiOperation({ summary: '全量同步所有数据（角色+订单+行为统计，无数量限制）' })
  async syncAll() {
    return this.scheduler.triggerManualSync();
  }

  @Post('thinkingdata/sync-last-login')
  @Roles('admin')
  @ApiOperation({ summary: '同步角色最后登录时间' })
  @ApiQuery({ name: 'date', required: false, description: '目标日期，格式 YYYY-MM-DD，默认昨天' })
  async syncLastLoginTime(@Query('date') date?: string) {
    return this.thinkingDataService.syncLastLoginTime(date);
  }

  @Post('thinkingdata/sync-last-login-range')
  @Roles('admin')
  @ApiOperation({ summary: '批量同步日期范围内的角色最后登录时间' })
  @ApiQuery({ name: 'startDate', required: true, description: '开始日期，格式 YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: true, description: '结束日期，格式 YYYY-MM-DD' })
  async syncLastLoginTimeRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }
    return this.thinkingDataService.syncLastLoginTimeRange(startDate, endDate);
  }

  @Get('thinkingdata/logs')
  @Roles('admin')
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
  @Roles('admin', 'manager')
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
