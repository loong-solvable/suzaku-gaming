// src/modules/player/player.controller.ts
import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlayerService } from './player.service';
import { QueryRolesDto } from './dto/query-roles.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Player')
@Controller('player')
export class PlayerController {
  constructor(private playerService: PlayerService) {}

  @Get('roles')
  @Public()
  @ApiOperation({ summary: '获取角色列表' })
  async getRoles(@Query() query: QueryRolesDto) {
    return this.playerService.getRoles(query);
  }

  @Get('roles/export')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @Public()
  @ApiOperation({ summary: '获取订单列表' })
  async getOrders(@Query() query: QueryOrdersDto) {
    return this.playerService.getOrders(query);
  }

  @Get('orders/export')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @Public()
  @ApiOperation({ summary: '获取筛选选项（区服、系统、订单类型等）' })
  async getFilterOptions() {
    return this.playerService.getFilterOptions();
  }
}
