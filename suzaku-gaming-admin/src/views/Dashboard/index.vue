<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import StatCard from "@/components/common/StatCard/index.vue";

interface DashboardData {
  today: {
    newPlayers: number;
    activePlayers: number;
    paidPlayers: number;
    paidAmount: number;
  };
  monthly: {
    newPlayers: number;
    activePlayers: number;
    paidPlayers: number;
    paidAmount: number;
  };
  total: {
    newPlayers: number;
    activePlayers: number;
    paidPlayers: number;
    paidAmount: number;
  };
}

const loading = ref(true);
const dashboardData = ref<DashboardData | null>(null);

// 按时间范围分组的卡片配置
const cardGroups = [
  {
    label: "今日",
    cards: [
      { key: "today.newPlayers", title: "新增玩家", dateRange: "今日", unit: "人" },
      { key: "today.activePlayers", title: "活跃玩家", dateRange: "今日", unit: "人" },
      { key: "today.paidPlayers", title: "付费玩家", dateRange: "今日", unit: "人" },
      { key: "today.paidAmount", title: "充值金额", dateRange: "今日", unit: "USD" }
    ]
  },
  {
    label: "本月",
    cards: [
      { key: "monthly.newPlayers", title: "新增玩家", dateRange: "本月", unit: "人" },
      { key: "monthly.activePlayers", title: "活跃玩家", dateRange: "本月", unit: "人" },
      { key: "monthly.paidPlayers", title: "付费玩家", dateRange: "本月", unit: "人" },
      { key: "monthly.paidAmount", title: "充值金额", dateRange: "本月", unit: "USD" }
    ]
  },
  {
    label: "历史累计",
    cards: [
      { key: "total.newPlayers", title: "新增玩家", dateRange: "历史累计", unit: "人" },
      { key: "total.activePlayers", title: "活跃玩家", dateRange: "历史累计", unit: "人" },
      { key: "total.paidPlayers", title: "付费玩家", dateRange: "历史累计", unit: "人" },
      { key: "total.paidAmount", title: "充值金额", dateRange: "历史累计", unit: "USD" }
    ]
  }
];

const getValue = (key: string): number => {
  if (!dashboardData.value) return 0;
  const [period, metric] = key.split(".") as ["today" | "monthly" | "total", keyof DashboardData["today"]];
  return dashboardData.value[period][metric];
};

const fetchDashboardData = async () => {
  loading.value = true;
  try {
    const res = await fetch("/api/dashboard/statistics");
    const json = await res.json();
    if (json.code === 0) {
      dashboardData.value = json.data;
    } else {
      ElMessage.error("加载数据失败");
    }
  } catch (error) {
    console.error("Dashboard API error:", error);
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <div v-loading="loading" class="dashboard">
    <div v-for="(group, groupIndex) in cardGroups" :key="groupIndex" class="dashboard-section">
      <h3 class="dashboard-section__title">{{ group.label }}</h3>
      <div class="dashboard-grid">
        <StatCard
          v-for="(card, cardIndex) in group.cards"
          :key="cardIndex"
          :title="card.title"
          :date-range="card.dateRange"
          :value="getValue(card.key)"
          :unit="card.unit"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  min-height: 400px;
}

.dashboard-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px 0;
    padding-left: 8px;
    border-left: 3px solid #409eff;
  }
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 1280px) {
  .dashboard-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
