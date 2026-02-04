// src/modules/cps/cps.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { CpsService } from './cps.service';
import { CpsSyncService } from './cps-sync.service';
import { CpsController } from './cps.controller';
import { CpsSyncController } from './cps-sync.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [CpsController, CpsSyncController],
  providers: [CpsService, CpsSyncService],
  exports: [CpsService, CpsSyncService],
})
export class CpsModule {}
