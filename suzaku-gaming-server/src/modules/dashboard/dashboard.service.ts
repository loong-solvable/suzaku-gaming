// src/modules/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import dayjs from 'dayjs';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStatistics() {
    const today = dayjs().startOf('day');
    const startOfMonth = dayjs().startOf('month');

    // 今日数据
    const todayStats = await this.getTodayStats(today.toDate());

    // 本月数据
    const monthlyStats = await this.getMonthlyStats(startOfMonth.toDate());

    // 历史累计数据
    const totalStats = await this.getTotalStats();

    return {
      today: todayStats,
      monthly: monthlyStats,
      total: totalStats,
    };
  }

  private async getTodayStats(startOfDay: Date) {
    const endOfDay = dayjs(startOfDay).endOf('day').toDate();

    // 新增玩家
    const newPlayers = await this.prisma.role.count({
      where: {
        registerTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // 付费玩家和金额
    const paymentStats = await this.prisma.order.aggregate({
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
    });

    const paidPlayersResult = await this.prisma.order.groupBy({
      by: ['roleId'],
      where: {
        payTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isSandbox: false,
      },
    });

    return {
      newPlayers,
      activePlayers: newPlayers || paidPlayersResult.length, // 临时使用付费玩家作为活跃
      paidPlayers: paidPlayersResult.length,
      paidAmount: Number(paymentStats._sum.payAmountUsd || 0),
    };
  }

  private async getMonthlyStats(startOfMonth: Date) {
    const endOfMonth = dayjs(startOfMonth).endOf('month').toDate();

    const newPlayers = await this.prisma.role.count({
      where: {
        registerTime: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const paymentStats = await this.prisma.order.aggregate({
      where: {
        payTime: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        isSandbox: false,
      },
      _sum: {
        payAmountUsd: true,
      },
    });

    const paidPlayersResult = await this.prisma.order.groupBy({
      by: ['roleId'],
      where: {
        payTime: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        isSandbox: false,
      },
    });

    return {
      newPlayers,
      activePlayers: newPlayers || paidPlayersResult.length,
      paidPlayers: paidPlayersResult.length,
      paidAmount: Number(paymentStats._sum.payAmountUsd || 0),
    };
  }

  private async getTotalStats() {
    const totalPlayers = await this.prisma.role.count();

    const paymentStats = await this.prisma.order.aggregate({
      where: {
        isSandbox: false,
      },
      _sum: {
        payAmountUsd: true,
      },
    });

    const paidPlayersResult = await this.prisma.order.groupBy({
      by: ['roleId'],
      where: {
        isSandbox: false,
      },
    });

    return {
      newPlayers: totalPlayers,
      activePlayers: totalPlayers,
      paidPlayers: paidPlayersResult.length,
      paidAmount: Number(paymentStats._sum.payAmountUsd || 0),
    };
  }
}
