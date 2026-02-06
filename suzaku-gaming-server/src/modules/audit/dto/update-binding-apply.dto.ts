// src/modules/audit/dto/update-binding-apply.dto.ts
// R9: 新建独立的更新 DTO，使用 class-validator 装饰器实现运行时校验
// R20: 使用已安装的 @nestjs/swagger（而非未安装的 @nestjs/mapped-types）
import { PartialType, OmitType } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, ArrayMaxSize, IsString, IsOptional } from 'class-validator';
import { CreateBindingApplyDto } from './create-binding-apply.dto';

export class UpdateBindingApplyDto extends PartialType(
  OmitType(CreateBindingApplyDto, ['project', 'applicant'] as const), // 禁止修改项目和申请人
) {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(3, { message: '至少需要上传3张截图' })
  @ArrayMaxSize(5, { message: '最多上传5张截图' })
  @IsString({ each: true, message: '每个附件必须是字符串URL' })
  declare attachments?: string[]; // 若传了 attachments，仍必须 3-5 张
}
