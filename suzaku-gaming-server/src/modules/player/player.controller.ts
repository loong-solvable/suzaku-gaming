// src/modules/player/player.controller.ts
import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlayerService } from './player.service';
import { QueryRolesDto } from './dto/query-roles.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Player')
@ApiBearerAuth()
@Controller('player')
export class PlayerController {
  constructor(private playerService: PlayerService) {}

  @Get('roles')
  @Roles('admin', 'manager', 'operator')
  @ApiOperation({ summary: '获取角色列表' })
  async getRoles(@Query() query: QueryRolesDto) {
    return this.playerService.getRoles(query);
  }

  @Get('roles/export')
  @Roles('admin', 'manager', 'operator')
  @ApiOperation({ summary: '导出角色列表' })
  async exportRoles(@Query() query: QueryRolesDto, @Res() res: Response) {
    const csv = await this.playerService.exportRoles(query);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=roles_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    // BOM for Excel compatibility
    res.send('\ufeff' + csv);
  }

  @Get('orders')
  @Roles('admin', 'manager', 'operator')
  @ApiOperation({ summary: '获取订单列表' })
  async getOrders(@Query() query: QueryOrdersDto) {
    return this.playerService.getOrders(query);
  }

  @Get('orders/export')
  @Roles('admin', 'manager', 'operator')
  @ApiOperation({ summary: '导出订单列表' })
  async exportOrders(@Query() query: QueryOrdersDto, @Res() res: Response) {
    const csv = await this.playerService.exportOrders(query);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=orders_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    // BOM for Excel compatibility
    res.send('\ufeff' + csv);
  }

  @Get('filter-options')
  @Roles('admin', 'manager', 'operator')
  @ApiOperation({ summary: '获取筛选选项（区服、系统、订单类型等）' })
  async getFilterOptions() {
    return this.playerService.getFilterOptions();
  }

  @Get('date-range')
  @Roles('admin', 'manager', 'operator')
  @ApiOperation({ summary: '获取数据时间范围（角色注册时间、订单充值时间）' })
  async getDateRange() {
    return this.playerService.getDateRange();
  }
}
