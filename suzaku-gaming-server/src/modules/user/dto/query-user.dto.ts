// src/modules/user/dto/query-user.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryUserDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: '用户名（模糊搜索）' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: '真实姓名（模糊搜索）' })
  @IsOptional()
  @IsString()
  realName?: string;

  @ApiPropertyOptional({ description: '角色', enum: ['admin', 'manager', 'operator'] })
  @IsOptional()
  @IsString()
  @IsIn(['admin', 'manager', 'operator'])
  role?: string;

  @ApiPropertyOptional({ description: '状态', enum: [0, 1] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;

  @ApiPropertyOptional({ description: 'CPS 分组编码' })
  @IsOptional()
  @IsString()
  cpsGroupCode?: string;
}
