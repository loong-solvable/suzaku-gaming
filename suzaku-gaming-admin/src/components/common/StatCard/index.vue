<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title: string;
  value: number | string;
  dateRange?: string;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: number;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  dateRange: '',
  unit: '',
  trend: 'flat',
  trendValue: 0,
  loading: false
});

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    // 金额格式化
    if (props.unit === 'USD' || props.unit === '元') {
      return props.value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    // 人数格式化
    return props.value.toLocaleString('en-US');
  }
  return props.value;
});

const trendClass = computed(() => {
  return {
    'trend--up': props.trend === 'up',
    'trend--down': props.trend === 'down',
    'trend--flat': props.trend === 'flat'
  };
});

const trendIcon = computed(() => {
  switch (props.trend) {
    case 'up':
      return 'Top';
    case 'down':
      return 'Bottom';
    default:
      return 'Minus';
  }
});
</script>

<template>
  <div class="stat-card" v-loading="loading">
    <div class="stat-card__header">
      <span class="stat-card__title">{{ title }}</span>
      <span v-if="dateRange" class="stat-card__date">{{ dateRange }}</span>
    </div>
    <div class="stat-card__body">
      <span class="stat-card__value">{{ formattedValue }}</span>
      <span v-if="unit" class="stat-card__unit">{{ unit }}</span>
    </div>
    <div v-if="trendValue !== 0" class="stat-card__footer">
      <span class="stat-card__trend" :class="trendClass">
        <el-icon><component :is="trendIcon" /></el-icon>
        <span>{{ Math.abs(trendValue) }}%</span>
      </span>
      <span class="stat-card__compare">较昨日</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stat-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  &__title {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
  }

  &__date {
    font-size: 12px;
    color: #909399;
  }

  &__body {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  &__value {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
    line-height: 1.2;
  }

  &__unit {
    font-size: 14px;
    color: #909399;
    margin-left: 4px;
  }

  &__footer {
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__trend {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 12px;
    font-weight: 500;

    &.trend--up {
      color: #67c23a;
    }

    &.trend--down {
      color: #f56c6c;
    }

    &.trend--flat {
      color: #909399;
    }
  }

  &__compare {
    font-size: 12px;
    color: #909399;
  }
}
</style>
