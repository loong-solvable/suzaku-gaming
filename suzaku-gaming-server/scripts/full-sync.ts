/**
 * 全量同步脚本 - 直接运行，无需认证
 * 用法: npx ts-node scripts/full-sync.ts
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ThinkingDataScheduler } from '../src/modules/thinkingdata/thinkingdata.scheduler';

async function bootstrap() {
  console.log('========================================');
  console.log('      全量数据同步开始');
  console.log('========================================\n');

  // 创建 NestJS 应用上下文（不启动 HTTP 服务器）
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const scheduler = app.get(ThinkingDataScheduler);
    
    console.log('正在执行全量同步...\n');
    const result = await scheduler.triggerManualSync();

    console.log('\n========================================');
    if (result.success) {
      console.log('      同步完成！');
    } else {
      console.log('      同步失败！');
    }
    console.log('========================================');
    console.log(`角色: ${result.roles.recordsProcessed} 条 (新增: ${result.roles.recordsInserted}, 更新: ${result.roles.recordsUpdated})`);
    console.log(`订单: ${result.orders.recordsProcessed} 条 (新增: ${result.orders.recordsInserted}, 更新: ${result.orders.recordsUpdated})`);
    console.log(`最后登录时间: ${result.lastLogin.recordsProcessed} 条更新`);
    console.log(`行为统计: ${result.stats.recordsProcessed} 条`);
    console.log(`总耗时: ${(result.duration / 1000).toFixed(2)} 秒`);

    if (!result.success) {
      console.log(`\n错误信息: ${result.error}`);
      if (!result.roles.success) console.log(`  - 角色同步: ${result.roles.error}`);
      if (!result.orders.success) console.log(`  - 订单同步: ${result.orders.error}`);
      if (!result.lastLogin.success) console.log(`  - 最后登录时间: ${result.lastLogin.error}`);
      if (!result.stats.success) console.log(`  - 行为统计: ${result.stats.error}`);
    }

  } catch (error) {
    console.error('\n同步失败:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
