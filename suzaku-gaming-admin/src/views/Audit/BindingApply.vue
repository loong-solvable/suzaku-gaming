<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import BindingApplyFilter from "./components/BindingApplyFilter.vue";
import type { PaginationConfig } from "@/types/components";

const router = useRouter();

// 表格列定义 - 按目标顺序
const tableColumns = [
  { prop: "id", label: "ID", width: 60 },
  { prop: "project", label: "游戏项目", width: 80 },
  { prop: "roleId", label: "角色ID", minWidth: 100 },
  { prop: "serverId", label: "区服", width: 60 },
  { prop: "applicant", label: "申请人", minWidth: 90 },
  { prop: "status", label: "状态", width: 90 },
  { prop: "applyTime", label: "申请时间", minWidth: 140 },
  { prop: "actions", label: "操作", width: 180, fixed: "right" }
];

const tableData = ref<Record<string, unknown>[]>([]);
const loading = ref(false);
const pagination = ref<PaginationConfig>({
  page: 1,
  pageSize: 20,
  total: 0
});
const filterParams = ref<Record<string, unknown>>({});

const dialogVisible = ref(false);
const selectedRow = ref<Record<string, unknown> | null>(null);

const fetchData = async () => {
  loading.value = true;
  try {
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 300));
    const mockData = [];
    const applicants = ['星禾组1', '星禾组2', '星禾组3', '运营组A', '运营组B'];
    for (let i = 0; i < 20; i++) {
      mockData.push({
        id: i + 1,
        project: 'JUR',
        roleId: `900031000${1000 + i}`,
        serverId: 13 + (i % 5),
        applicant: applicants[i % applicants.length],
        applyTime: new Date(Date.now() - i * 86400000).toISOString(),
        status: ["pending", "approved", "rejected"][i % 3],
        remark: "申请备注" + i
      });
    }
    tableData.value = mockData;
    pagination.value.total = 100;
  } catch (error) {
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

const handleNewAttribution = () => {
  router.push("/audit/new-attribution");
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

const handleView = (row: Record<string, unknown>) => {
  selectedRow.value = row;
  dialogVisible.value = true;
};

const handleEdit = (row: Record<string, unknown>) => {
  ElMessage.info(`编辑申请: ${row.id}`);
};

const handleDelete = async (row: Record<string, unknown>) => {
  try {
    await ElMessageBox.confirm("确定要删除这条记录吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });
    tableData.value = tableData.value.filter(item => item.id !== row.id);
    ElMessage.success("删除成功");
  } catch {
    // User cancelled
  }
};

// 获取状态样式类
const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: "status-pending",
    approved: "status-approved",
    rejected: "status-rejected"
  };
  return map[status] || "";
};

// 获取状态文字
const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: "未审核",
    approved: "审核通过",
    rejected: "已拒绝"
  };
  return map[status] || status;
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
  <div class="binding-apply-page">
    <!-- 筛选区域 -->
    <BindingApplyFilter
      @search="handleSearch"
      @reset="handleReset"
      @export="handleExport"
      @apply="handleNewAttribution"
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
      >
        <el-table-column
          v-for="col in tableColumns.filter(c => c.prop !== 'status' && c.prop !== 'actions')"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :show-overflow-tooltip="true"
        >
          <template #default="{ row }">
            <template v-if="col.prop.includes('Time')">
              {{ formatTime(row[col.prop]) }}
            </template>
            <template v-else>
              {{ row[col.prop] || '-' }}
            </template>
          </template>
        </el-table-column>
        
        <!-- 状态列 - 彩色文字链接 -->
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <span class="status-link" :class="getStatusClass(row.status)">
              {{ getStatusLabel(row.status) }}
            </span>
          </template>
        </el-table-column>
        
        <!-- 操作列 - 三色按钮组 -->
        <el-table-column prop="actions" label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
              <el-button type="success" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </div>
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

    <!-- 详情弹窗 -->
    <el-dialog v-model="dialogVisible" title="申请详情" width="500px">
      <div v-if="selectedRow" class="detail-content">
        <p><strong>ID：</strong> {{ selectedRow.id }}</p>
        <p><strong>游戏项目：</strong> {{ selectedRow.project }}</p>
        <p><strong>角色ID：</strong> {{ selectedRow.roleId }}</p>
        <p><strong>区服：</strong> {{ selectedRow.serverId }}</p>
        <p><strong>申请人：</strong> {{ selectedRow.applicant }}</p>
        <p><strong>申请时间：</strong> {{ formatTime(selectedRow.applyTime) }}</p>
        <p><strong>状态：</strong> {{ getStatusLabel(selectedRow.status as string) }}</p>
        <p><strong>备注：</strong> {{ selectedRow.remark }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.binding-apply-page {
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

// 状态文字链接样式
.status-link {
  cursor: pointer;
  font-size: 12px;
  
  &.status-pending {
    color: #409EFF;
  }
  
  &.status-approved {
    color: #67C23A;
  }
  
  &.status-rejected {
    color: #F56C6C;
  }
  
  &:hover {
    text-decoration: underline;
  }
}

// 操作按钮组
.action-btns {
  display: flex;
  gap: 4px;
  
  .el-button {
    padding: 4px 8px;
    font-size: 12px;
  }
}

.detail-content {
  p {
    margin-bottom: 12px;
    line-height: 1.6;
  }
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
