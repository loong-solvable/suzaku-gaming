// src/modules/cps/dto/query-recharge.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryRechargeLogsDto {
  @ApiPropertyOptional({ description: '账号ID' })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ description: 'CPS 分组' })
  @IsString()
  @IsOptional()
  cpsGroup?: string;

  @ApiPropertyOptional({ description: '服务器ID' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  serverId?: number;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: '同步批次号' })
  @IsString()
  @IsOptional()
  syncBatch?: string;

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

export class QueryLoginLogsDto {
  @ApiPropertyOptional({ description: '账号ID' })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ description: 'CPS 分组' })
  @IsString()
  @IsOptional()
  cpsGroup?: string;

  @ApiPropertyOptional({ description: '服务器ID' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  serverId?: number;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: '同步批次号' })
  @IsString()
  @IsOptional()
  syncBatch?: string;

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

export class RechargeSummaryDto {
  @ApiPropertyOptional({ description: 'CPS 分组' })
  @IsString()
  @IsOptional()
  cpsGroup?: string;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsString()
  @IsOptional()
  endTime?: string;
}
