// src/modules/cps/dto/check-binding.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, ValidateIf } from 'class-validator';

export class CheckBindingDto {
  @ApiPropertyOptional({ description: '角色ID' })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.accountId)
  @IsNotEmpty({ message: 'roleId 或 accountId 至少提供一个' })
  roleId?: string;

  @ApiPropertyOptional({ description: '账号ID' })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.roleId)
  @IsNotEmpty({ message: 'roleId 或 accountId 至少提供一个' })
  accountId?: string;
}

export class CheckBindingResponseDto {
  @ApiProperty({ description: '是否可绑定' })
  canBind: boolean;

  @ApiPropertyOptional({ description: '角色ID' })
  roleId?: string;

  @ApiPropertyOptional({ description: '账号ID' })
  accountId?: string;

  @ApiPropertyOptional({ description: '流量来源' })
  tfMedium?: string;

  @ApiPropertyOptional({ description: '不可绑定原因' })
  failReason?: string;

  @ApiPropertyOptional({ description: '角色基础信息（如果找到）' })
  roleInfo?: {
    roleName?: string;
    serverName?: string;
    serverId?: number;
    registerTime?: Date;
    lastLoginTime?: Date;
  };
}
