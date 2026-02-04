// src/modules/audit/dto/review-binding-apply.dto.ts
import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewBindingApplyDto {
  @ApiProperty({ enum: ['approve', 'reject'] })
  @IsString()
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remark?: string;
}
