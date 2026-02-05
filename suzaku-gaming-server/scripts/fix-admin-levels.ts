// scripts/fix-admin-levels.ts
// 修复 AdminUser level 字段的数据修复脚本
// 用法: npx ts-node scripts/fix-admin-levels.ts

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdminLevels() {
  console.log('=== 修复 AdminUser level 字段 ===\n');

  // 1. 统计当前状态
  const stats = await prisma.$queryRaw<{ role: string | null; level: number | null; count: number }[]>`
    SELECT role, level, COUNT(*)::int as count 
    FROM admin_users 
    GROUP BY role, level 
    ORDER BY role, level
  `;
  console.log('修复前统计:');
  console.table(stats);

  const nullLevelCount = await prisma.adminUser.count({
    where: { level: null as any },
  });
  const nullRoleCount = await prisma.adminUser.count({
    where: { role: null as any },
  });
  console.log(`\nlevel 为 null: ${nullLevelCount}`);
  console.log(`role 为 null: ${nullRoleCount}\n`);

  // 2. 根据 role 修复 level
  const adminResult = await prisma.adminUser.updateMany({
    where: {
      role: 'admin',
      OR: [{ level: null as any }, { level: { not: 0 } }],
    },
    data: { level: 0 },
  });
  console.log(`admin -> level=0: ${adminResult.count} 条`);

  const managerResult = await prisma.adminUser.updateMany({
    where: {
      role: 'manager',
      OR: [{ level: null as any }, { level: { not: 1 } }],
    },
    data: { level: 1 },
  });
  console.log(`manager -> level=1: ${managerResult.count} 条`);

  const operatorResult = await prisma.adminUser.updateMany({
    where: {
      role: 'operator',
      OR: [{ level: null as any }, { level: { not: 2 } }],
    },
    data: { level: 2 },
  });
  console.log(`operator -> level=2: ${operatorResult.count} 条`);

  // 3. 修复没有 role 的用户（安全起见设为最低权限）
  const noRoleResult = await prisma.adminUser.updateMany({
    where: { role: null as any },
    data: { role: 'operator', level: 2 },
  });
  if (noRoleResult.count > 0) {
    console.log(`⚠️ 无角色用户 -> operator: ${noRoleResult.count} 条`);
  }

  // 4. 修复有 role 但 level 仍为 null 的用户（使用默认映射）
  const remainingNullLevel = await prisma.adminUser.findMany({
    where: { level: null as any },
    select: { id: true, username: true, role: true },
  });

  for (const user of remainingNullLevel) {
    const levelMap: Record<string, number> = {
      admin: 0,
      manager: 1,
      operator: 2,
    };
    const targetLevel = levelMap[user.role || ''] ?? 2;
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { level: targetLevel },
    });
    console.log(`修复用户 ${user.username}: role=${user.role} -> level=${targetLevel}`);
  }

  // 5. 验证结果
  console.log('\n修复后统计:');
  const statsAfter = await prisma.$queryRaw<{ role: string | null; level: number | null; count: number }[]>`
    SELECT role, level, COUNT(*)::int as count 
    FROM admin_users 
    GROUP BY role, level 
    ORDER BY role, level
  `;
  console.table(statsAfter);

  const remainingNull = await prisma.adminUser.count({
    where: {
      OR: [{ level: null as any }, { role: null as any }],
    },
  });

  if (remainingNull > 0) {
    console.error(`\n❌ 仍有 ${remainingNull} 条异常数据，请手动检查`);
    const abnormal = await prisma.adminUser.findMany({
      where: {
        OR: [{ level: null as any }, { role: null as any }],
      },
      select: { id: true, username: true, role: true, level: true },
    });
    console.table(abnormal);
    process.exit(1);
  }

  // 6. 一致性验证
  const inconsistent = await prisma.$queryRaw<{ id: number; username: string; role: string; level: number }[]>`
    SELECT id, username, role, level FROM admin_users
    WHERE (role = 'admin' AND level != 0)
       OR (role = 'manager' AND level != 1)
       OR (role = 'operator' AND level != 2)
  `;

  if (inconsistent.length > 0) {
    console.error('\n❌ 发现 role/level 不一致的数据:');
    console.table(inconsistent);
    process.exit(1);
  }

  console.log('\n✅ 修复完成，所有数据一致');
}

fixAdminLevels()
  .catch((e) => {
    console.error('修复失败:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
