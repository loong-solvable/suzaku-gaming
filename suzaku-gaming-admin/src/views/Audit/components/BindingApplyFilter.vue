<script setup lang="ts">
import { reactive } from "vue";

interface FilterValues {
  gameProject: string;
  server: string;
  roleId: string;
  applicant: string;
  status: string;
  applyTime: Date[];
}

interface Emits {
  (e: "search", values: FilterValues): void;
  (e: "reset"): void;
  (e: "export"): void;
  (e: "apply"): void;
}

const emit = defineEmits<Emits>();

const filterValues = reactive<FilterValues>({
  gameProject: "",
  server: "",
  roleId: "",
  applicant: "",
  status: "",
  applyTime: []
});

const gameProjectOptions = [
  { label: "海战", value: "warship" },
  { label: "JUR", value: "JUR" }
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

const statusOptions = [
  { label: "未审核", value: "pending" },
  { label: "审核通过", value: "approved" },
  { label: "审核拒绝", value: "rejected" }
];

const handleSearch = () => {
  emit("search", { ...filterValues });
};

const handleReset = () => {
  Object.assign(filterValues, {
    gameProject: "",
    server: "",
    roleId: "",
    applicant: "",
    status: "",
    applyTime: []
  });
  emit("reset");
};

const handleExport = () => {
  emit("export");
};

const handleApply = () => {
  emit("apply");
};
</script>

<template>
  <div class="binding-filter">
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
        <label class="filter-label">角色ID：</label>
        <el-input v-model="filterValues.roleId" size="small" clearable />
      </div>
      <div class="filter-item">
        <label class="filter-label">申请人：</label>
        <el-input v-model="filterValues.applicant" size="small" clearable />
      </div>
      <div class="filter-item">
        <label class="filter-label">审核状态：</label>
        <el-select v-model="filterValues.status" size="small" clearable>
          <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>
    </div>

    <div class="filter-row">
      <div class="filter-item filter-item--date">
        <label class="filter-label">申请时间：</label>
        <el-date-picker
          v-model="filterValues.applyTime"
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
        <el-button class="ghost-btn" size="small" icon="Document" @click="handleApply">归因修改申请</el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.binding-filter {
  background: #FFFFFF;
  padding: 12px 0;
  margin-bottom: 12px;
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

.ghost-btn {
  background-color: rgba(64, 158, 255, 0.1);
  border-color: #409EFF;
  color: #409EFF;

  &:hover {
    background-color: rgba(64, 158, 255, 0.2);
  }
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
