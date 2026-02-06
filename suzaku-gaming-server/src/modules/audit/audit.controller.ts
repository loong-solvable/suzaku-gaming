// src/modules/audit/audit.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryBindingAppliesDto } from './dto/query-binding-applies.dto';
import { CreateBindingApplyDto } from './dto/create-binding-apply.dto';
import { UpdateBindingApplyDto } from './dto/update-binding-apply.dto';
import { ReviewBindingApplyDto } from './dto/review-binding-apply.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('binding-applies')
  @Roles('admin', 'manager', 'operator')
  @ApiOperation({ summary: '获取绑定申请列表' })
  async getBindingApplies(
    @Query() query: QueryBindingAppliesDto,
    @Req() req: Request,
  ) {
    return this.auditService.getBindingApplies(query, (req as any).user);
  }

  @Get('binding-applies/export')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: '导出绑定申请列表' })
  async exportBindingApplies(
    @Query() query: QueryBindingAppliesDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const csv = await this.auditService.exportBindingApplies(query, (req as any).user);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=binding_applies_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    // BOM for Excel compatibility
    res.send('\ufeff' + csv);
  }

  @Get('binding-applies/:id')
  @Roles('admin', 'manager', 'operator')
  @ApiOperation({ summary: '获取绑定申请详情' })
  async getBindingApplyById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.auditService.getBindingApplyById(id, (req as any).user);
  }

  @Post('binding-applies')
  @Roles('admin', 'manager', 'operator')
  @ApiOperation({ summary: '创建绑定申请' })
  async createBindingApply(
    @Body() dto: CreateBindingApplyDto,
    @Req() req: Request,
  ) {
    // 服务端强制设置 applicant 为当前用户
    return this.auditService.createBindingApply(dto, (req as any).user);
  }

  @Put('binding-applies/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: '更新绑定申请' })
  async updateBindingApply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBindingApplyDto,
    @Req() req: Request,
  ) {
    return this.auditService.updateBindingApply(id, dto, (req as any).user);
  }

  @Delete('binding-applies/:id')
  @Roles('admin')
  @ApiOperation({ summary: '删除绑定申请' })
  async deleteBindingApply(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.deleteBindingApply(id);
  }

  @Post('binding-applies/:id/review')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: '审核绑定申请' })
  async reviewBindingApply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewBindingApplyDto,
    @Req() req: Request,
  ) {
    // R10: 传完整 currentUser 用于组权限校验
    return this.auditService.reviewBindingApply(id, dto, (req as any).user);
  }

  @Get('role-check/:roleId')
  @Roles('admin', 'manager', 'operator')
  @ApiOperation({ summary: '角色绑定预校验' })
  async checkRoleForBinding(@Param('roleId') roleId: string) {
    return this.auditService.checkRoleForBinding(roleId);
  }
}
