// src/modules/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import type { CurrentUser } from '../../common/interfaces/current-user.interface';

interface DashboardMetricsRow {
  today_new_players: number;
  month_new_players: number;
  total_players: number;
  today_paid_players: number;
  today_paid_amount: number;
  month_paid_players: number;
  month_paid_amount: number;
  total_paid_players: number;
  total_paid_amount: number;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private buildScopeCondition(user: CurrentUser): Prisma.Sql {
    if (user.level === 0) {
      return Prisma.sql`TRUE`;
    }

    if (user.level === 1) {
      return Prisma.sql`(
        ba.platform = ${user.cpsGroupCode}
        OR ba.team_leader = ${user.username}
      )`;
    }

    return Prisma.sql`ba.applicant = ${user.username}`;
  }

  async getStatistics(currentUser: CurrentUser) {
    const todayStart = dayjs().startOf('day').toDate();
    const tomorrow = dayjs().add(1, 'day').startOf('day').toDate();
    const monthStart = dayjs().startOf('month').toDate();
    const nextMonth = dayjs().add(1, 'month').startOf('month').toDate();

    const scopeCondition = this.buildScopeCondition(currentUser);

    const rows = await this.prisma.$queryRaw<DashboardMetricsRow[]>(Prisma.sql`
      WITH scoped_roles AS (
        SELECT DISTINCT ba.role_id
        FROM binding_applies ba
        WHERE ba.status = 'approved'
          AND ${scopeCondition}
      ),
      role_metrics AS (
        SELECT
          COUNT(*) FILTER (WHERE r.register_time >= ${todayStart} AND r.register_time < ${tomorrow})::int AS today_new_players,
          COUNT(*) FILTER (WHERE r.register_time >= ${monthStart} AND r.register_time < ${nextMonth})::int AS month_new_players,
          COUNT(*)::int AS total_players
        FROM roles r
        INNER JOIN scoped_roles sr ON sr.role_id = r.role_id
      ),
      order_metrics AS (
        SELECT
          COUNT(DISTINCT o.role_id) FILTER (WHERE o.pay_time >= ${todayStart} AND o.pay_time < ${tomorrow})::int AS today_paid_players,
          COALESCE(SUM(o.pay_amount_usd) FILTER (WHERE o.pay_time >= ${todayStart} AND o.pay_time < ${tomorrow}), 0)::double precision AS today_paid_amount,
          COUNT(DISTINCT o.role_id) FILTER (WHERE o.pay_time >= ${monthStart} AND o.pay_time < ${nextMonth})::int AS month_paid_players,
          COALESCE(SUM(o.pay_amount_usd) FILTER (WHERE o.pay_time >= ${monthStart} AND o.pay_time < ${nextMonth}), 0)::double precision AS month_paid_amount,
          COUNT(DISTINCT o.role_id)::int AS total_paid_players,
          COALESCE(SUM(o.pay_amount_usd), 0)::double precision AS total_paid_amount
        FROM orders o
        INNER JOIN scoped_roles sr ON sr.role_id = o.role_id
        WHERE o.is_sandbox = false
      )
      SELECT rm.*, om.*
      FROM role_metrics rm
      CROSS JOIN order_metrics om
    `);

    const row = rows[0];

    return {
      today: {
        newPlayers: row?.today_new_players ?? 0,
        activePlayers: (row?.today_new_players || row?.today_paid_players) ?? 0,
        paidPlayers: row?.today_paid_players ?? 0,
        paidAmount: row?.today_paid_amount ?? 0,
      },
      monthly: {
        newPlayers: row?.month_new_players ?? 0,
        activePlayers: (row?.month_new_players || row?.month_paid_players) ?? 0,
        paidPlayers: row?.month_paid_players ?? 0,
        paidAmount: row?.month_paid_amount ?? 0,
      },
      total: {
        newPlayers: row?.total_players ?? 0,
        activePlayers: (row?.total_players || row?.total_paid_players) ?? 0,
        paidPlayers: row?.total_paid_players ?? 0,
        paidAmount: row?.total_paid_amount ?? 0,
      },
    };
  }
}
