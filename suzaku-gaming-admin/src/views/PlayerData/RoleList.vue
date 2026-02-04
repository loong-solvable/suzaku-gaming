<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import RoleListFilter from "./components/RoleListFilter.vue";
import type { PaginationConfig } from "@/types/components";

// 表格列配置 - 按目标顺序
const tableColumns = [
  { prop: "project", label: "项目", width: 80 },
  { prop: "roleId", label: "角色ID", minWidth: 100 },
  { prop: "ucid", label: "UCID", minWidth: 100 },
  { prop: "serverName", label: "区服", minWidth: 80 },
  { prop: "deviceType", label: "系统", width: 70 },
  { prop: "roleName", label: "角色名称", minWidth: 100 },
  { prop: "country", label: "国家", width: 70 },
  { prop: "roleLevel", label: "角色等级", width: 80 },
  { prop: "registerTime", label: "注册时间", minWidth: 140, sortable: true },
  { prop: "lastLoginTime", label: "最后登录时间", minWidth: 140, sortable: true },
  { prop: "lastUpdateTime", label: "最后更改时间", minWidth: 140, sortable: true },
  { prop: "totalRechargeUsd", label: "总付费金额", minWidth: 100, sortable: true },
  { prop: "totalRechargeTimes", label: "总付费笔数", width: 100 },
  { prop: "channel1", label: "一级渠道", minWidth: 90 },
  { prop: "channel2", label: "二级渠道", minWidth: 90 },
  { prop: "channel3", label: "三级渠道", minWidth: 90 }
];

const tableData = ref<Record<string, unknown>[]>([]);
const loading = ref(false);
const pagination = ref<PaginationConfig>({
  page: 1,
  pageSize: 20,
  total: 0
});
const sortInfo = ref<{ prop: string | null; order: string | null }>({ prop: null, order: null });
const filterParams = ref<Record<string, unknown>>({});

const fetchData = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: String(pagination.value.page),
      pageSize: String(pagination.value.pageSize)
    });
    
    // 添加筛选参数
    Object.entries(filterParams.value).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length === 2) {
          params.append(key + 'Start', String(value[0]));
          params.append(key + 'End', String(value[1]));
        } else {
          params.append(key, String(value));
        }
      }
    });

    // 添加排序参数
    if (sortInfo.value.prop && sortInfo.value.order) {
      params.append('sortBy', sortInfo.value.prop);
      params.append('sortOrder', sortInfo.value.order === 'ascending' ? 'asc' : 'desc');
    }

    const res = await fetch("/api/player/roles?" + params.toString());
    const json = await res.json();
    if (json.code === 0) {
      tableData.value = json.data.list || [];
      pagination.value.total = json.data.pagination?.total || 0;
    }
  } catch (error) {
    console.error("Fetch error:", error);
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = (values: Record<string, unknown>) => {
  filterParams.value = values;
  pagination.value.page = 1;
  fetchData();
};

const handleReset = () => {
  filterParams.value = {};
  pagination.value.page = 1;
  fetchData();
};

const handleExport = () => {
  ElMessage.success("正在导出CSV...");
};

const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchData();
};

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size;
  pagination.value.page = 1;
  fetchData();
};

const handleSortChange = ({ prop, order }: { prop: string | null; order: "ascending" | "descending" | null }) => {
  sortInfo.value = { prop, order };
  fetchData();
};

// 格式化金额
const formatAmount = (val: unknown) => {
  if (typeof val === 'number') {
    return val.toFixed(2);
  }
  return val || '-';
};

// 格式化时间
const formatTime = (val: unknown) => {
  if (!val) return '-';
  return String(val).replace('T', ' ').slice(0, 19);
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="role-list-page">
    <!-- 筛选区域 -->
    <RoleListFilter
      @search="handleSearch"
      @reset="handleReset"
      @export="handleExport"
    />

    <!-- 表格区域 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="tableData"
        size="small"
        border
        stripe
        style="width: 100%"
        :header-cell-style="{ background: '#FAFAFA', color: '#303133', fontWeight: 600, fontSize: '12px', padding: '8px 0' }"
        :cell-style="{ fontSize: '12px', padding: '6px 0' }"
        @sort-change="handleSortChange"
      >
        <el-table-column
          v-for="col in tableColumns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :sortable="col.sortable ? 'custom' : false"
          :show-overflow-tooltip="true"
        >
          <template #default="{ row }">
            <template v-if="col.prop === 'totalRechargeUsd'">
              {{ formatAmount(row[col.prop]) }}
            </template>
            <template v-else-if="col.prop.includes('Time')">
              {{ formatTime(row[col.prop]) }}
            </template>
            <template v-else>
              {{ row[col.prop] || '-' }}
            </template>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无数据" :image-size="80" />
        </template>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          size="small"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.role-list-page {
  width: 100%;
}

.table-container {
  background: #FFFFFF;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0;
}

:deep(.el-table) {
  --el-table-border-color: #EBEEF5;
  
  th.el-table__cell {
    background-color: #FAFAFA !important;
  }
  
  .el-table__row {
    &:hover > td {
      background-color: #F5F7FA !important;
    }
  }
}

:deep(.el-pagination) {
  .el-pagination__total,
  .el-pagination__sizes,
  .el-pagination__jump {
    font-size: 12px;
  }
}
</style>
