// 独立脚本 scripts/backfill-member-codes.ts
// 用于为历史组员（operator）回填 memberCode
// 使用方式：npx ts-node scripts/backfill-member-codes.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfill() {
  // 查找所有无编号的组员
  const members = await prisma.adminUser.findMany({
    where: { role: 'operator', memberCode: null, cpsGroupCode: { not: null } },
    orderBy: [{ cpsGroupCode: 'asc' }, { createdAt: 'asc' }],
  });

  console.log(`Found ${members.length} members without memberCode`);

  for (const member of members) {
    const prefix = member.cpsGroupCode!.replace('Group', '');
    // 使用原始 SQL 按数值排序取最大编号（避免字符串排序错误）
    const result = await prisma.$queryRaw<{ max_seq: number }[]>`
      SELECT COALESCE(MAX(CAST(SPLIT_PART(member_code, '-', 2) AS INTEGER)), 0) AS max_seq
      FROM admin_users WHERE cps_group_code = ${member.cpsGroupCode!}
        AND member_code IS NOT NULL AND role = 'operator'
    `;
    const nextSeq = (result[0]?.max_seq || 0) + 1;

    const code = `${prefix}-${String(nextSeq).padStart(4, '0')}`;

    await prisma.adminUser.update({
      where: { id: member.id },
      data: { memberCode: code },
    });
    console.log(`Assigned ${code} to user ${member.username} (id: ${member.id})`);
  }

  console.log('Backfill complete!');
}

backfill()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
