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
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryBindingAppliesDto } from './dto/query-binding-applies.dto';
import { CreateBindingApplyDto } from './dto/create-binding-apply.dto';
import { ReviewBindingApplyDto } from './dto/review-binding-apply.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Audit')
@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('binding-applies')
  @Public()
  @ApiOperation({ summary: '获取绑定申请列表' })
  async getBindingApplies(@Query() query: QueryBindingAppliesDto) {
    return this.auditService.getBindingApplies(query);
  }

  @Get('binding-applies/export')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: '导出绑定申请列表' })
  async exportBindingApplies(
    @Query() query: QueryBindingAppliesDto,
    @Res() res: Response,
  ) {
    const csv = await this.auditService.exportBindingApplies(query);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=binding_applies_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    // BOM for Excel compatibility
    res.send('\ufeff' + csv);
  }

  @Get('binding-applies/:id')
  @Public()
  @ApiOperation({ summary: '获取绑定申请详情' })
  async getBindingApplyById(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.getBindingApplyById(id);
  }

  @Post('binding-applies')
  @Public()
  @ApiOperation({ summary: '创建绑定申请' })
  async createBindingApply(@Body() dto: CreateBindingApplyDto) {
    return this.auditService.createBindingApply(dto);
  }

  @Put('binding-applies/:id')
  @Public()
  @ApiOperation({ summary: '更新绑定申请' })
  async updateBindingApply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateBindingApplyDto>,
  ) {
    return this.auditService.updateBindingApply(id, dto);
  }

  @Delete('binding-applies/:id')
  @Public()
  @ApiOperation({ summary: '删除绑定申请' })
  async deleteBindingApply(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.deleteBindingApply(id);
  }

  @Post('binding-applies/:id/review')
  @Public()
  @ApiOperation({ summary: '审核绑定申请' })
  async reviewBindingApply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewBindingApplyDto,
  ) {
    return this.auditService.reviewBindingApply(id, dto);
  }
}
