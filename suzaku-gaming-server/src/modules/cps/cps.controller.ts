// src/modules/cps/cps.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CpsService } from './cps.service';
import {
  CheckBindingDto,
  CheckBindingResponseDto,
  CreateBindingDto,
  CreateBindingResponseDto,
  QueryBindingsDto,
  QueryFailLogsDto,
  QueryRechargeLogsDto,
  QueryLoginLogsDto,
  RechargeSummaryDto,
} from './dto';

@ApiTags('CPS 公会管理')
@ApiBearerAuth()
@Controller('cps')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CpsController {
  constructor(private readonly cpsService: CpsService) {}

  // ===== 绑定相关 =====

  @Post('binding/check')
  @ApiOperation({ summary: '检查角色是否可绑定' })
  @ApiResponse({ status: 200, type: CheckBindingResponseDto })
  @Roles('admin', 'manager', 'operator')
  async checkBinding(@Body() dto: CheckBindingDto): Promise<CheckBindingResponseDto> {
    return this.cpsService.checkBinding(dto);
  }

  @Post('binding/create')
  @ApiOperation({ summary: '创建 CPS 绑定' })
  @ApiResponse({ status: 200, type: CreateBindingResponseDto })
  @Roles('admin', 'manager', 'operator')
  async createBinding(
    @Body() dto: CreateBindingDto,
    @Req() req: any,
  ): Promise<CreateBindingResponseDto> {
    const operatorId = req.user.id;
    const operatorType = req.user.role;
    return this.cpsService.createBinding(dto, operatorId, operatorType);
  }

  @Delete('binding/:id')
  @ApiOperation({ summary: '取消 CPS 绑定' })
  @Roles('admin', 'manager')
  async cancelBinding(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.cpsService.cancelBinding(id, req.user.id);
  }

  @Get('binding/list')
  @ApiOperation({ summary: '查询绑定列表' })
  @Roles('admin', 'manager', 'operator')
  async getBindings(@Query() dto: QueryBindingsDto) {
    return this.cpsService.getBindings(dto);
  }

  @Get('binding/fail-logs')
  @ApiOperation({ summary: '查询绑定失败日志' })
  @Roles('admin', 'manager')
  async getFailLogs(@Query() dto: QueryFailLogsDto) {
    return this.cpsService.getFailLogs(dto);
  }

  // ===== 数据查询 =====

  @Get('recharge/list')
  @ApiOperation({ summary: '查询 CPS 充值日志' })
  @Roles('admin', 'manager', 'operator')
  async getRechargeLogs(@Query() dto: QueryRechargeLogsDto) {
    return this.cpsService.getRechargeLogs(dto);
  }

  @Get('recharge/summary')
  @ApiOperation({ summary: '查询充值汇总统计' })
  @Roles('admin', 'manager')
  async getRechargeSummary(@Query() dto: RechargeSummaryDto) {
    return this.cpsService.getRechargeSummary(dto);
  }

  @Get('login/list')
  @ApiOperation({ summary: '查询 CPS 登录日志' })
  @Roles('admin', 'manager', 'operator')
  async getLoginLogs(@Query() dto: QueryLoginLogsDto) {
    return this.cpsService.getLoginLogs(dto);
  }
}
