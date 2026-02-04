// src/mock/dashboard.ts
import Mock from 'mockjs';

// Dashboard统计数据
Mock.mock(/\/api\/dashboard\/statistics/, 'get', () => {
  return {
    code: 0,
    message: 'success',
    data: {
      today: {
        newPlayers: 286,
        activePlayers: 1035,
        paidPlayers: 126,
        paidAmount: 1050.35
      },
      monthly: {
        newPlayers: 8036,
        activePlayers: 20350,
        paidPlayers: 3150,
        paidAmount: 30150.98
      },
      total: {
        newPlayers: 206350,
        activePlayers: 806350,
        paidPlayers: 10350,
        paidAmount: 150350.98
      }
    },
    timestamp: Date.now()
  };
});
