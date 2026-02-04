// scripts/migrate-role-to-level.ts
// 权限迁移脚本：将 role 字符串映射到 level 数值
// 用法: npx ts-node scripts/migrate-role-to-level.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLE_LEVEL_MAP: Record<string, number> = {
  admin: 0, // 运营管理员
  manager: 1, // 组长
  operator: 2, // 组员
};

async function migrateRoleToLevel(): Promise<void> {
  console.log('Starting role to level migration...\n');

  const users = await prisma.adminUser.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      level: true,
    },
  });

  console.log(`Found ${users.length} admin users to migrate.\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of users) {
    try {
      const targetLevel = ROLE_LEVEL_MAP[user.role] ?? 2;

      // 检查是否需要更新
      if (user.level === targetLevel) {
        console.log(`  [SKIP] ${user.username}: level already set to ${targetLevel}`);
        skipped++;
        continue;
      }

      await prisma.adminUser.update({
        where: { id: user.id },
        data: { level: targetLevel },
      });

      console.log(
        `  [OK] ${user.username}: role "${user.role}" -> level ${targetLevel}`,
      );
      migrated++;
    } catch (error) {
      console.error(
        `  [ERROR] ${user.username}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      errors++;
    }
  }

  console.log('\n========== Migration Summary ==========');
  console.log(`  Total Users: ${users.length}`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);

  await prisma.$disconnect();
}

migrateRoleToLevel()
  .then(() => {
    console.log('\nMigration completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
