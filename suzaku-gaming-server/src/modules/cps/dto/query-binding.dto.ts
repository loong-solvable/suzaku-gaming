// src/modules/cps/dto/query-binding.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum BindingStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}

export class QueryBindingsDto {
  @ApiPropertyOptional({ description: '角色ID' })
  @IsString()
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional({ description: '账号ID' })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ description: 'CPS 分组' })
  @IsString()
  @IsOptional()
  cpsGroup?: string;

  @ApiPropertyOptional({ description: '操作人ID' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  operatorId?: number;

  @ApiPropertyOptional({ description: '状态', enum: BindingStatus })
  @IsEnum(BindingStatus)
  @IsOptional()
  status?: BindingStatus;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 20;
}

export class QueryFailLogsDto {
  @ApiPropertyOptional({ description: '角色ID' })
  @IsString()
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional({ description: '账号ID' })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ description: '操作人ID' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  operatorId?: number;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 20;
}
