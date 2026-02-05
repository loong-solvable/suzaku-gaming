<script setup lang="ts">
import { reactive, watch } from "vue";

interface FilterValues {
  gameProject: string;
  server: string;
  channel1: string;
  channel2: string;
  channel3: string;
  payChannel: string;
  system: string;
  timezone: string;
  roleId: string;
  roleName: string;
  payTime: string[];
}

interface Props {
  defaultDateRange?: { min: string | null; max: string | null };
}

interface Emits {
  (e: "search", values: FilterValues): void;
  (e: "reset"): void;
  (e: "export"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const filterValues = reactive<FilterValues>({
  gameProject: "",
  server: "",
  channel1: "",
  channel2: "",
  channel3: "",
  payChannel: "",
  system: "",
  timezone: "",
  roleId: "",
  roleName: "",
  payTime: []
});

// 监听默认时间范围变化，设置初始值
watch(
  () => props.defaultDateRange,
  (range) => {
    if (range && range.min && range.max && filterValues.payTime.length === 0) {
      filterValues.payTime = [range.min, range.max];
    }
  },
  { immediate: true }
);

const gameProjectOptions = [
  { label: "海战", value: "warship" }
];

const serverOptions = [
  { label: "S17", value: "17" },
  { label: "S18", value: "18" },
  { label: "S20", value: "20" },
  { label: "S21", value: "21" },
  { label: "S22", value: "22" },
  { label: "S23", value: "23" },
  { label: "S26", value: "26" },
  { label: "S27", value: "27" },
  { label: "S28", value: "28" },
  { label: "S29", value: "29" },
  { label: "S30", value: "30" },
  { label: "S31", value: "31" }
];

// 渠道选项（目前数据中暂无渠道信息，保留空选项）
const channelOptions: Array<{ label: string; value: string }> = [];

const payChannelOptions = [
  { label: "谷歌支付", value: "谷歌支付" },
  { label: "苹果支付", value: "苹果支付" },
  { label: "平台支付", value: "平台支付" }
];

const systemOptions = [
  { label: "iOS", value: "iOS" },
  { label: "Android", value: "Android" }
];

const timezoneOptions = [
  { label: "UTC+8 (北京)", value: "+08:00" },
  { label: "UTC+9 (东京)", value: "+09:00" },
  { label: "UTC+0 (伦敦)", value: "+00:00" },
  { label: "UTC-5 (纽约)", value: "-05:00" },
  { label: "UTC-8 (洛杉矶)", value: "-08:00" }
];

const handleSearch = () => {
  emit("search", { ...filterValues });
};

const handleReset = () => {
  // 恢复默认时间范围
  const defaultRange = props.defaultDateRange;
  Object.assign(filterValues, {
    gameProject: "",
    server: "",
    channel1: "",
    channel2: "",
    channel3: "",
    payChannel: "",
    system: "",
    timezone: "",
    roleId: "",
    roleName: "",
    payTime: defaultRange?.min && defaultRange?.max ? [defaultRange.min, defaultRange.max] : []
  });
  emit("reset");
};

const handleExport = () => {
  emit("export");
};
</script>

<template>
  <div class="order-filter">
    <div class="filter-row">
      <div class="filter-item">
        <label class="filter-label">游戏项目：</label>
        <el-select v-model="filterValues.gameProject" size="small" clearable>
          <el-option v-for="opt in gameProjectOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">区服：</label>
        <el-select v-model="filterValues.server" size="small" clearable>
          <el-option v-for="opt in serverOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">一级渠道：</label>
        <el-select v-model="filterValues.channel1" size="small" clearable>
          <el-option v-for="opt in channelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">二级渠道：</label>
        <el-select v-model="filterValues.channel2" size="small" clearable>
          <el-option v-for="opt in channelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">三级渠道：</label>
        <el-select v-model="filterValues.channel3" size="small" clearable>
          <el-option v-for="opt in channelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>
    </div>

    <div class="filter-row">
      <div class="filter-item">
        <label class="filter-label">充值渠道：</label>
        <el-select v-model="filterValues.payChannel" size="small" clearable>
          <el-option v-for="opt in payChannelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">系统：</label>
        <el-select v-model="filterValues.system" size="small" clearable>
          <el-option v-for="opt in systemOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">时区：</label>
        <el-select v-model="filterValues.timezone" size="small" clearable>
          <el-option v-for="opt in timezoneOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>
      <div class="filter-item">
        <label class="filter-label">角色ID：</label>
        <el-input v-model="filterValues.roleId" size="small" clearable />
      </div>
      <div class="filter-item">
        <label class="filter-label">角色昵称：</label>
        <el-input v-model="filterValues.roleName" size="small" clearable />
      </div>
    </div>

    <div class="filter-row">
      <div class="filter-item filter-item--date">
        <label class="filter-label">充值时间：</label>
        <el-date-picker
          v-model="filterValues.payTime"
          type="daterange"
          size="small"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          unlink-panels
        />
      </div>
      <div class="filter-buttons">
        <el-button type="primary" size="small" icon="Search" @click="handleSearch">查询</el-button>
        <el-button size="small" icon="Refresh" @click="handleReset">清空</el-button>
        <el-button type="success" size="small" icon="Download" @click="handleExport">导出</el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.order-filter {
  background: #FFFFFF;
  padding: 12px 0;
  margin-bottom: 8px;
  border-bottom: 1px solid #EBEEF5;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.filter-item {
  display: flex;
  align-items: center;
  margin-right: 16px;
  margin-bottom: 4px;

  &--date {
    margin-right: 16px;
  }
}

.filter-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
  margin-right: 4px;
  min-width: 65px;
  text-align: right;
}

.filter-buttons {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

:deep(.el-select),
:deep(.el-input) {
  width: 120px;
}

:deep(.el-date-editor) {
  width: 220px;
}

:deep(.el-input__inner),
:deep(.el-select__wrapper) {
  font-size: 12px;
}

@media (max-width: 1400px) {
  .filter-item {
    margin-right: 12px;
  }
  
  :deep(.el-select),
  :deep(.el-input) {
    width: 110px;
  }
  
  :deep(.el-date-editor) {
    width: 200px;
  }
}

@media (max-width: 1200px) {
  .filter-item {
    margin-right: 8px;
  }
  
  :deep(.el-select),
  :deep(.el-input) {
    width: 100px;
  }
  
  .filter-label {
    min-width: 55px;
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-item {
    margin-right: 0;
    margin-bottom: 8px;
    
    &--date {
      margin-right: 0;
    }
  }

  .filter-label {
    text-align: left;
    min-width: 70px;
  }

  :deep(.el-select),
  :deep(.el-input),
  :deep(.el-date-editor) {
    flex: 1;
    width: auto;
  }

  .filter-buttons {
    margin-left: 0;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}
</style>
