// src/modules/player/dto/query-orders.dto.ts
import { IsOptional, IsInt, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryOrdersDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleName?: string;

  @ApiPropertyOptional({ description: '服务器ID或名称' })
  @IsOptional()
  @IsString()
  server?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  serverId?: number;

  @ApiPropertyOptional({ description: '系统类型: ios/android/iOS/Android' })
  @IsOptional()
  @IsString()
  system?: string;

  @ApiPropertyOptional({ description: '订单类型/充值类型' })
  @IsOptional()
  @IsString()
  orderType?: string;

  @ApiPropertyOptional({ description: '充值渠道: 谷歌支付/苹果支付/平台支付' })
  @IsOptional()
  @IsString()
  payChannel?: string;

  @ApiPropertyOptional({ description: '渠道ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  channelId?: number;

  @ApiPropertyOptional({ description: '支付时间开始 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  payTimeStart?: string;

  @ApiPropertyOptional({ description: '支付时间结束 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  payTimeEnd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
