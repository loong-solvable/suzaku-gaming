// src/modules/audit/dto/create-binding-apply.dto.ts
import { IsString, IsInt, IsOptional, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBindingApplyDto {
  @ApiProperty()
  @IsString()
  project: string;

  @ApiProperty()
  @IsString()
  roleId: string;

  @ApiProperty()
  @IsInt()
  serverId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serverName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teamLeader?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teamMember?: string;

  @ApiProperty()
  @IsString()
  applicant: string;

  @ApiProperty({ description: '截图附件（3-5张）' })
  @IsArray()
  @ArrayMinSize(3, { message: '至少需要上传3张截图' })
  @ArrayMaxSize(5, { message: '最多上传5张截图' })
  @IsString({ each: true, message: '每个附件必须是字符串URL' })
  attachments: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remark?: string;
}
