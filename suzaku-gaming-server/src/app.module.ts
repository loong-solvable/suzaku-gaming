// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { PrismaModule } from './shared/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PlayerModule } from './modules/player/player.module';
import { AuditModule } from './modules/audit/audit.module';
import { ThinkingDataModule } from './modules/thinkingdata/thinkingdata.module';
import { CpsModule } from './modules/cps/cps.module';
import { UserModule } from './modules/user/user.module';
import { UploadModule } from './modules/upload/upload.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),

    // 定时任务模块
    ScheduleModule.forRoot(),

    // 速率限制
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 分钟
        limit: 100, // 最多 100 次请求
      },
    ]),

    // 数据库模块
    PrismaModule,

    // 静态文件服务（上传的文件）
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),

    // 业务模块
    HealthModule,
    AuthModule,
    DashboardModule,
    PlayerModule,
    AuditModule,
    ThinkingDataModule,
    CpsModule,
    UserModule,
    UploadModule,
  ],
  providers: [
    // 全局 Guard（顺序重要：JwtAuthGuard 先于 RolesGuard）
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
