import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearSyncData() {
  console.log('开始清理同步数据...');
  
  // 使用事务确保原子性
  await prisma.$transaction(async (tx) => {
    console.log('1. 清理订单数据...');
    await tx.$executeRaw`TRUNCATE TABLE orders CASCADE`;
    console.log('   已清理订单数据');
    
    console.log('2. 清理角色数据...');
    await tx.$executeRaw`TRUNCATE TABLE roles CASCADE`;
    console.log('   已清理角色数据');
    
    console.log('3. 清理同步日志...');
    await tx.$executeRaw`TRUNCATE TABLE sync_logs CASCADE`;
    console.log('   已清理同步日志');
  });
  
  // 验证清理结果
  const orderCount = await prisma.order.count();
  const roleCount = await prisma.role.count();
  const logCount = await prisma.syncLog.count();
  
  console.log('\n清理结果验证:');
  console.log(`  订单: ${orderCount} 条`);
  console.log(`  角色: ${roleCount} 条`);
  console.log(`  日志: ${logCount} 条`);
  
  console.log('\n数据清理完成！');
}

clearSyncData()
  .catch((e) => {
    console.error('清理失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
