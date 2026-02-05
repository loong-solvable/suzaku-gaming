import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.adminUser.findMany({
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      level: true,
      status: true,
      cpsGroupCode: true,
      parentId: true,
    },
    orderBy: { level: 'asc' },
  });

  console.log('\n=== 现有管理员账号 ===\n');
  console.log('ID\t用户名\t\t真实姓名\t角色\t\t级别\t状态\t\tCPS组');
  console.log('-'.repeat(90));
  
  users.forEach(u => {
    const roleLabel = u.role === 'admin' ? '管理员' : u.role === 'manager' ? '组长' : '组员';
    const statusLabel = u.status === 1 ? '正常' : '禁用';
    console.log(`${u.id}\t${u.username}\t\t${u.realName || '-'}\t\t${roleLabel}\t\t${u.level}\t${statusLabel}\t\t${u.cpsGroupCode || '-'}`);
  });

  console.log(`\n总计: ${users.length} 个账号\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
