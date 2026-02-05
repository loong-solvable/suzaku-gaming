import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.count();
  const orders = await prisma.order.count();
  
  console.log('========================================');
  console.log('数据库统计');
  console.log('========================================');
  console.log(`角色数量: ${roles}`);
  console.log(`订单数量: ${orders}`);
  
  // 检查最后登录时间
  const rolesWithLastLogin = await prisma.role.count({
    where: { lastLoginTime: { not: null } }
  });
  console.log(`有最后登录时间的角色: ${rolesWithLastLogin}`);
  
  await prisma.$disconnect();
}

main();
