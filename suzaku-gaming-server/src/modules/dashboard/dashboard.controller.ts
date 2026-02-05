// src/modules/dashboard/dashboard.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('statistics')
  @Roles('admin', 'manager', 'operator')
  @ApiOperation({ summary: '获取 Dashboard 统计数据' })
  async getStatistics() {
    return this.dashboardService.getStatistics();
  }
}
