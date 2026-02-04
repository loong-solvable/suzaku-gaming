// scripts/etl/build-daily-stats.ts
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function buildDailyStats(targetDate?: string) {
  const date = targetDate ? dayjs(targetDate) : dayjs().subtract(1, 'day');
  const startOfDay = date.startOf('day').toDate();
  const endOfDay = date.endOf('day').toDate();

  console.log(`Building daily stats for: ${date.format('YYYY-MM-DD')}`);

  try {
    // 1. 统计新增玩家数
    const newPlayers = await prisma.role.count({
      where: {
        registerTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // 2. 统计付费玩家数（当天有订单的去重角色）
    const paidPlayersResult = await prisma.order.groupBy({
      by: ['roleId'],
      where: {
        payTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isSandbox: false,
      },
    });
    const paidPlayers = paidPlayersResult.length;

    // 3. 统计活跃玩家（暂时使用付费玩家作为活跃口径）
    const activePlayers = paidPlayers || newPlayers;

    // 4. 统计总收入和订单数
    const revenueStats = await prisma.order.aggregate({
      where: {
        payTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isSandbox: false,
      },
      _sum: {
        payAmountUsd: true,
      },
      _count: true,
    });

    const totalRevenue = revenueStats._sum.payAmountUsd || new Decimal(0);
    const totalOrders = revenueStats._count || 0;

    // 5. Upsert 每日统计
    await prisma.dailyStat.upsert({
      where: { statDate: startOfDay },
      create: {
        statDate: startOfDay,
        newPlayers,
        activePlayers,
        paidPlayers,
        totalRevenue,
        totalOrders,
      },
      update: {
        newPlayers,
        activePlayers,
        paidPlayers,
        totalRevenue,
        totalOrders,
      },
    });

    console.log(`Daily stats for ${date.format('YYYY-MM-DD')}:`);
    console.log(`  - New Players: ${newPlayers}`);
    console.log(`  - Active Players: ${activePlayers}`);
    console.log(`  - Paid Players: ${paidPlayers}`);
    console.log(`  - Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`  - Total Orders: ${totalOrders}`);

  } catch (error) {
    console.error('Error building daily stats:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 主函数
const targetDate = process.argv[2];
buildDailyStats(targetDate).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
