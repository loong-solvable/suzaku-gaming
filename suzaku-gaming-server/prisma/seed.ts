// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 创建管理员用户
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);

  const admin = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: { 
      level: 0,
      passwordHash,
      salt,
      status: 1,
    },
    create: {
      username: 'admin',
      passwordHash,
      salt,
      realName: '系统管理员',
      role: 'admin',
      level: 0, // 运营管理员
      status: 1,
    },
  });
  console.log('Created admin user:', admin.username);

  // 创建运营用户
  const operatorHash = await bcrypt.hash('operator123', salt);
  const operator = await prisma.adminUser.upsert({
    where: { username: 'operator' },
    update: { 
      level: 2,
      passwordHash: operatorHash,
      salt,
      status: 1,
    },
    create: {
      username: 'operator',
      passwordHash: operatorHash,
      salt,
      realName: '运营人员',
      role: 'operator',
      level: 2, // 组员
      status: 1,
    },
  });

  // 创建组长用户
  const managerHash = await bcrypt.hash('manager123', salt);
  const manager = await prisma.adminUser.upsert({
    where: { username: 'manager' },
    update: { 
      level: 1,
      passwordHash: managerHash,
      salt,
      status: 1,
    },
    create: {
      username: 'manager',
      passwordHash: managerHash,
      salt,
      realName: '组长',
      role: 'manager',
      level: 1, // 组长
      cpsGroupCode: 'CPS001',
      status: 1,
    },
  });
  console.log('Created manager user:', manager.username);
  console.log('Created operator user:', operator.username);

  // 创建示例角色数据
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
  console.log('Created sample roles:', roles.length);

  // 创建示例订单数据
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
  console.log('Created sample orders:', orders.length);

  // 创建示例绑定申请
  const bindingApply = await prisma.bindingApply.create({
    data: {
      project: 'JUR',
      roleId: '9000310001001',
      roleName: '测试玩家1',
      serverId: 28,
      serverName: 'S28',
      applicant: '星禾组1',
      platform: 'iOS',
      status: 'pending',
    },
  });
  console.log('Created sample binding apply:', bindingApply.id);

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
