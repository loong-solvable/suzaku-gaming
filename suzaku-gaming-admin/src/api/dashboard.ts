// src/api/dashboard.ts
import { request } from '@/utils/request';

export interface DashboardStats {
  today: {
    newPlayers: number;
    activePlayers: number;
    paidPlayers: number;
    paidAmount: number;
    ingameAmount: number;
    thirdpartyAmount: number;
  };
  monthly: {
    newPlayers: number;
    activePlayers: number;
    paidPlayers: number;
    paidAmount: number;
    ingameAmount: number;
    thirdpartyAmount: number;
  };
  total: {
    newPlayers: number;
    activePlayers: number;
    paidPlayers: number;
    paidAmount: number;
    ingameAmount: number;
    thirdpartyAmount: number;
  };
}

export const dashboardApi = {
  getStatistics(): Promise<DashboardStats> {
    return request.get('/dashboard/statistics');
  }
};
