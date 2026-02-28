// src/modules/thinkingdata/thinkingdata.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThinkingDataService } from './thinkingdata.service';
import { ThinkingDataScheduler } from './thinkingdata.scheduler';
import { ThinkingDataController } from './thinkingdata.controller';
import { TaDatatableService } from './ta-datatable.service';

@Module({
  imports: [ConfigModule],
  controllers: [ThinkingDataController],
  providers: [ThinkingDataService, ThinkingDataScheduler, TaDatatableService],
  exports: [ThinkingDataService, TaDatatableService],
})
export class ThinkingDataModule {}
