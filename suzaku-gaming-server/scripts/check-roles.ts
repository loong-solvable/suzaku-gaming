import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 检查订单中的角色名
  const orders = await prisma.order.findMany({
    take: 10,
    select: {
      orderId: true,
      roleId: true,
      roleName: true,
      roleLevel: true,
      serverName: true,
    },
    orderBy: { payTime: 'desc' },
  });
  
  console.log('订单数据中的角色名:');
  console.log(JSON.stringify(orders, null, 2));
  
  // 统计订单中有角色名的数量
  const ordersWithName = await prisma.order.count({ where: { roleName: { not: null } } });
  const totalOrders = await prisma.order.count();
  console.log(`\n订单中有角色名: ${ordersWithName} / ${totalOrders}`);
  
  // 检查角色表
  const rolesWithName = await prisma.role.count({ where: { roleName: { not: null } } });
  const totalRoles = await prisma.role.count();
  console.log(`角色表中有角色名: ${rolesWithName} / ${totalRoles}`);
  
  await prisma.$disconnect();
}

main();
