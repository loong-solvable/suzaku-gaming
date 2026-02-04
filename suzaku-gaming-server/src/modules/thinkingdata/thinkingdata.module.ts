// src/modules/thinkingdata/thinkingdata.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThinkingDataService } from './thinkingdata.service';
import { ThinkingDataScheduler } from './thinkingdata.scheduler';
import { ThinkingDataController } from './thinkingdata.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ThinkingDataController],
  providers: [ThinkingDataService, ThinkingDataScheduler],
  exports: [ThinkingDataService],
})
export class ThinkingDataModule {}
