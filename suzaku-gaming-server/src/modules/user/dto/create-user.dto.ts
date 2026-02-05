// src/modules/user/dto/create-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn, MinLength, IsInt } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @ApiProperty({ description: '密码', minLength: 6 })
  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  password: string;

  @ApiProperty({ description: '真实姓名' })
  @IsString()
  @IsNotEmpty({ message: '真实姓名不能为空' })
  realName: string;

  @ApiProperty({ description: '角色', enum: ['admin', 'manager', 'operator'] })
  @IsString()
  @IsIn(['admin', 'manager', 'operator'], { message: '角色必须是 admin/manager/operator' })
  role: string;

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
}
