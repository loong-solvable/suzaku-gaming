// src/modules/audit/dto/query-binding-applies.dto.ts
import { IsOptional, IsInt, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryBindingAppliesDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: '游戏项目' })
  @IsOptional()
  @IsString()
  project?: string;

  @ApiPropertyOptional({ description: '游戏项目 (别名)' })
  @IsOptional()
  @IsString()
  gameProject?: string;

  @ApiPropertyOptional({ description: '服务器ID或名称' })
  @IsOptional()
  @IsString()
  server?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  applicant?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '申请时间开始 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  applyTimeStart?: string;

  @ApiPropertyOptional({ description: '申请时间结束 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  applyTimeEnd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
