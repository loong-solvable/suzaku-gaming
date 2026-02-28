// src/modules/audit/audit.module.ts
import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { ThinkingDataModule } from '../thinkingdata/thinkingdata.module';

@Module({
  imports: [ThinkingDataModule],
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
