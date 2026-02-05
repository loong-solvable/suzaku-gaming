/**
 * 同步近一周数据脚本
 * 用法: npx ts-node scripts/sync-week.ts
 * 
 * 同步顺序：角色 -> 订单 -> 最后登录时间
 * 角色数据来自 role_create 事件
 * 订单数据来自 recharge_complete 事件（不自动创建角色）
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ThinkingDataService } from '../src/modules/thinkingdata/thinkingdata.service';

async function bootstrap() {
  console.log('========================================');
  console.log('      同步近一周数据');
  console.log('========================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const service = app.get(ThinkingDataService);
    
    // 计算日期范围（近7天）
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    const startDate = weekAgo.toISOString().slice(0, 10);
    const endDate = today.toISOString().slice(0, 10);
    
    console.log(`日期范围: ${startDate} 至 ${endDate}\n`);

    // 1. 先同步角色（从 role_create 事件）
    console.log('[1/3] 同步角色数据 (role_create 事件)...');
    const rolesResult = await service.syncRolesRange(startDate, endDate, 100000);
    console.log(`   角色: ${rolesResult.recordsProcessed} 条 (新增: ${rolesResult.recordsInserted}, 更新: ${rolesResult.recordsUpdated})`);
    if (!rolesResult.success) {
      console.log(`   错误: ${rolesResult.error}`);
    }

    // 2. 再同步订单（从 recharge_complete 事件，不自动创建角色）
    console.log('[2/3] 同步订单数据 (recharge_complete 事件)...');
    const ordersResult = await service.syncOrdersRange(startDate, endDate, 100000);
    console.log(`   订单: ${ordersResult.recordsProcessed} 条 (新增: ${ordersResult.recordsInserted}, 更新: ${ordersResult.recordsUpdated})`);
    if (!ordersResult.success) {
      console.log(`   错误: ${ordersResult.error}`);
    }

    // 3. 同步最后登录时间
    console.log('[3/3] 同步最后登录时间...');
    const loginResult = await service.syncLastLoginTimeRange(startDate, endDate);
    console.log(`   最后登录时间: ${loginResult.recordsProcessed} 条更新`);
    if (!loginResult.success) {
      console.log(`   错误: ${loginResult.error}`);
    }

    console.log('\n========================================');
    console.log('      同步完成！');
    console.log('========================================');

  } catch (error) {
    console.error('\n同步失败:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
