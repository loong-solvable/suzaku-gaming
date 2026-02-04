// src/modules/cps/cps-sync.controller.ts
import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CpsSyncService } from './cps-sync.service';

class TriggerSyncDto {
  startTime?: string;
  endTime?: string;
}

@ApiTags('CPS 数据同步')
@ApiBearerAuth()
@Controller('cps/sync')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CpsSyncController {
  constructor(private readonly cpsSyncService: CpsSyncService) {}

  @Post('trigger')
  @ApiOperation({ summary: '手动触发 CPS 数据同步' })
  @Roles('admin')
  async triggerSync(@Body() dto: TriggerSyncDto) {
    return this.cpsSyncService.triggerSync(dto.startTime, dto.endTime);
  }

  @Get('status')
  @ApiOperation({ summary: '查询同步状态' })
  @Roles('admin', 'manager')
  getSyncStatus() {
    return this.cpsSyncService.getSyncStatus();
  }
}
