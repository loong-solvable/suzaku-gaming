// src/modules/cps/dto/create-binding.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ValidateIf,
} from 'class-validator';

export class CreateBindingDto {
  @ApiProperty({ description: '角色ID' })
  @IsString()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({ description: '账号ID' })
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ description: 'CPS 分组编码' })
  @IsString()
  @IsNotEmpty()
  cpsGroup: string;

  @ApiPropertyOptional({ description: '附件URL列表（截图等）' })
  @IsArray()
  @IsOptional()
  attachments?: string[];

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class CreateBindingResponseDto {
  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiPropertyOptional({ description: '绑定ID' })
  bindingId?: number;

  @ApiPropertyOptional({ description: '错误信息' })
  error?: string;
}
