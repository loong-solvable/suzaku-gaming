// src/modules/user/dto/update-user.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, MinLength, IsInt } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '密码', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  password?: string;

  @ApiPropertyOptional({ description: '真实姓名' })
  @IsOptional()
  @IsString()
  realName?: string;

  @ApiPropertyOptional({ description: '角色', enum: ['admin', 'manager', 'operator'] })
  @IsOptional()
  @IsString()
  @IsIn(['admin', 'manager', 'operator'], { message: '角色必须是 admin/manager/operator' })
  role?: string;

  @ApiPropertyOptional({ description: '上级ID' })
  @IsOptional()
  @IsInt()
  parentId?: number;

  @ApiPropertyOptional({ description: 'CPS 分组编码' })
  @IsOptional()
  @IsString()
  cpsGroupCode?: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: '状态', enum: [0, 1] })
  @IsOptional()
  @IsInt()
  status?: number;
}
