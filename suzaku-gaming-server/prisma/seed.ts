// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === 'production';

async function main() {
  console.log(`Seeding database... (env: ${process.env.NODE_ENV || 'development'})`);

  if (isProduction) {
    console.log('⚠️ 生产环境：仅执行 upsert 账户，跳过示例数据');
  }

  const salt = await bcrypt.genSalt(10);

  // === 核心账户定义 ===
  const accounts = [
    { username: 'admin',    role: 'admin',   level: 0, cpsGroupCode: null,     realName: '系统管理员', password: 'admin123' },
    { username: 'leader_a', role: 'manager', level: 1, cpsGroupCode: 'GroupA', realName: 'A组组长',    password: 'leader123' },
    { username: 'leader_b', role: 'manager', level: 1, cpsGroupCode: 'GroupB', realName: 'B组组长',    password: 'leader123' },
    { username: 'leader_c', role: 'manager', level: 1, cpsGroupCode: 'GroupC', realName: 'C组组长',    password: 'leader123' },
  ];

  // === 全部使用 upsert（幂等安全） ===
  for (const account of accounts) {
    const passwordHash = await bcrypt.hash(account.password, salt);
    const user = await prisma.adminUser.upsert({
      where: { username: account.username },
      update: {
        level: account.level,
        role: account.role,
        cpsGroupCode: account.cpsGroupCode,
        realName: account.realName,
        status: 1,
      },
      create: {
        username: account.username,
        passwordHash,
        salt,
        realName: account.realName,
        role: account.role,
        level: account.level,
        cpsGroupCode: account.cpsGroupCode,
        status: 1,
      },
    });
    console.log(`Upserted account: ${user.username} (role: ${account.role}, group: ${account.cpsGroupCode || 'N/A'})`);
  }

  // === 示例业务数据仅在非生产环境创建 ===
  if (!isProduction) {
    console.log('Creating sample data for development...');

    // 示例角色数据
    const roles = [
      { roleId: '9000310001001', roleName: '测试玩家1', serverId: 28, serverName: 'S28', registerTime: new Date() },
      { roleId: '9000310001002', roleName: '测试玩家2', serverId: 29, serverName: 'S29', registerTime: new Date() },
      { roleId: '9000310001003', roleName: '测试玩家3', serverId: 30, serverName: 'S30', registerTime: new Date() },
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: { roleId: role.roleId },
        update: {},
        create: role,
      });
    }
    console.log(`Created sample roles: ${roles.length}`);

    // 示例订单数据
    const orders = [
      { orderId: 'ORDER001', roleId: '9000310001001', serverId: 28, payAmountUsd: 9.99, payTime: new Date(), rechargeType: '现金' },
      { orderId: 'ORDER002', roleId: '9000310001002', serverId: 29, payAmountUsd: 19.99, payTime: new Date(), rechargeType: '现金' },
    ];

    for (const order of orders) {
      await prisma.order.upsert({
        where: { orderId: order.orderId },
        update: {},
        create: order,
      });
    }
    console.log(`Created sample orders: ${orders.length}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
