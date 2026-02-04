// src/modules/audit/dto/create-binding-apply.dto.ts
import { IsString, IsInt, IsOptional, IsArray } from 'class-validator';
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  attachments?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remark?: string;
}
