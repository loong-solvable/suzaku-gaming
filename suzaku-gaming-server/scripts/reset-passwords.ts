import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 统一测试密码
  const testPassword = '123456';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(testPassword, salt);

  console.log('\n=== 重置所有账号密码 ===\n');
  console.log(`新密码: ${testPassword}`);
  console.log(`加密后: ${hashedPassword}\n`);

  // 更新所有用户密码
  const result = await prisma.adminUser.updateMany({
    data: {
      passwordHash: hashedPassword,
      salt: salt,
    },
  });

  console.log(`已更新 ${result.count} 个账号的密码\n`);

  // 显示更新后的账号信息
  const users = await prisma.adminUser.findMany({
    select: {
      username: true,
      role: true,
      cpsGroupCode: true,
    },
    orderBy: { level: 'asc' },
  });

  console.log('可用账号:');
  console.log('-'.repeat(50));
  users.forEach(u => {
    const roleLabel = u.role === 'admin' ? '管理员' : u.role === 'manager' ? '组长' : '组员';
    console.log(`用户名: ${u.username}`);
    console.log(`密码: ${testPassword}`);
    console.log(`角色: ${roleLabel}`);
    if (u.cpsGroupCode) console.log(`CPS组: ${u.cpsGroupCode}`);
    console.log('-'.repeat(50));
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
