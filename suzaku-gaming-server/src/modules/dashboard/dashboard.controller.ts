// src/modules/dashboard/dashboard.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('statistics')
  @Public()
  @ApiOperation({ summary: '获取 Dashboard 统计数据' })
  async getStatistics() {
    return this.dashboardService.getStatistics();
  }
}
