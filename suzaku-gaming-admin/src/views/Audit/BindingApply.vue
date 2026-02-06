<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import BindingApplyFilter from "./components/BindingApplyFilter.vue";
import { auditApi } from "@/api/audit";
import type { PaginationConfig } from "@/types/components";

const router = useRouter();

// 表格列定义 - 按目标顺序
const tableColumns = [
  { prop: "id", label: "ID", width: 60 },
  { prop: "project", label: "游戏项目", width: 80 },
  { prop: "roleId", label: "角色ID", minWidth: 100 },
  { prop: "serverId", label: "区服", width: 60 },
  { prop: "platform", label: "组名", width: 80 },
  { prop: "teamMember", label: "组员编号", width: 90 },
  { prop: "applicant", label: "申请人", minWidth: 90 },
  { prop: "status", label: "状态", width: 90 },
  { prop: "applyTime", label: "申请时间", minWidth: 140 },
  { prop: "actions", label: "操作", width: 180, fixed: "right" }
];

const tableData = ref<any[]>([]);
const loading = ref(false);
const pagination = ref<PaginationConfig>({
  page: 1,
  pageSize: 20,
  total: 0
});
const filterParams = ref<any>({});

const dialogVisible = ref(false);
const selectedRow = ref<any>(null);

// 审核相关
const reviewDialogVisible = ref(false);
const reviewRow = ref<Record<string, unknown> | null>(null);
const reviewAction = ref<'approve' | 'reject'>('approve');
const reviewRemark = ref('');

// 编辑相关
const editDialogVisible = ref(false);
const editForm = ref({
  id: 0,
  project: '',
  roleId: '',
  roleName: '',
  serverId: 0,
  serverName: '',
  teamLeader: '',
  teamMember: '',
  remark: ''
});
const editLoading = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      ...filterParams.value
    };
    const res = await auditApi.getBindingApplies(params);
    tableData.value = res.list || [];
    pagination.value.total = res.pagination?.total || 0;
  } catch (error) {
    console.error("加载数据失败:", error);
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = (values: any) => {
  filterParams.value = values;
  pagination.value.page = 1;
  fetchData();
};

const handleReset = () => {
  filterParams.value = {};
  pagination.value.page = 1;
  fetchData();
};

const handleExport = async () => {
  try {
    ElMessage.info("正在导出...");
    const blob = await auditApi.exportBindingApplies(filterParams.value);
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `binding_applies_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success("导出成功");
  } catch (error: any) {
    console.error("导出失败:", error);
    ElMessage.error(error?.message || "导出失败");
  }
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
  editForm.value = {
    id: row.id as number,
    project: (row.project as string) || '',
    roleId: (row.roleId as string) || '',
    roleName: (row.roleName as string) || '',
    serverId: (row.serverId as number) || 0,
    serverName: (row.serverName as string) || '',
    teamLeader: (row.teamLeader as string) || '',
    teamMember: (row.teamMember as string) || '',
    remark: (row.remark as string) || ''
  };
  editDialogVisible.value = true;
};

// 提交编辑
const submitEdit = async () => {
  editLoading.value = true;
  try {
    const { id, ...data } = editForm.value;
    await auditApi.updateBindingApply(id, data);
    ElMessage.success('更新成功');
    editDialogVisible.value = false;
    fetchData();
  } catch (error: any) {
    ElMessage.error(error?.message || '更新失败');
  } finally {
    editLoading.value = false;
  }
};

// 打开审核弹窗
const handleReview = (row: Record<string, unknown>, action: 'approve' | 'reject') => {
  reviewRow.value = row;
  reviewAction.value = action;
  reviewRemark.value = '';
  reviewDialogVisible.value = true;
};

// 提交审核
const submitReview = async () => {
  if (!reviewRow.value) return;
  try {
    await auditApi.reviewBindingApply(
      reviewRow.value.id as number,
      reviewAction.value,
      reviewRemark.value || undefined
    );
    ElMessage.success(reviewAction.value === 'approve' ? '审核通过' : '已拒绝');
    reviewDialogVisible.value = false;
    fetchData(); // 重新加载数据
  } catch (error: any) {
    ElMessage.error(error?.message || '审核失败');
  }
};

const handleDelete = async (row: Record<string, unknown>) => {
  try {
    await ElMessageBox.confirm("确定要删除这条记录吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });
    await auditApi.deleteBindingApply(row.id as number);
    ElMessage.success("删除成功");
    fetchData(); // 重新加载数据
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || "删除失败");
    }
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

// Phase 4: 兼容新旧数据格式
const formatGroupName = (platform: unknown) => {
  const p = String(platform || '');
  // 新数据：GroupA → A组
  if (p.startsWith('Group')) return p.replace('Group', '') + '组';
  // 旧数据：iOS/Google → 原值展示
  return p || '-';
};

const formatMemberCode = (teamMember: unknown) => {
  const m = String(teamMember || '');
  return m || '-';
};

// 获取图片完整URL
const getImageUrl = (url: string) => {
  if (!url) return '';
  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // 开发环境下，/uploads 已通过 vite proxy 代理到后端
  // 所以直接返回相对路径即可
  return url;
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
            <template v-else-if="col.prop === 'platform'">
              {{ formatGroupName(row.platform) }}
            </template>
            <template v-else-if="col.prop === 'teamMember'">
              {{ formatMemberCode(row.teamMember) }}
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
        
        <!-- 操作列 -->
        <el-table-column prop="actions" label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
              <template v-if="row.status === 'pending'">
                <el-button type="success" size="small" @click="handleReview(row, 'approve')">通过</el-button>
                <el-button type="warning" size="small" @click="handleReview(row, 'reject')">拒绝</el-button>
                <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              </template>
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
    <el-dialog v-model="dialogVisible" title="申请详情" width="600px">
      <div v-if="selectedRow" class="detail-content">
        <p><strong>ID：</strong> {{ selectedRow.id }}</p>
        <p><strong>游戏项目：</strong> {{ selectedRow.project === 'warship' ? '海战' : selectedRow.project }}</p>
        <p><strong>角色ID：</strong> {{ selectedRow.roleId }}</p>
        <p><strong>角色名称：</strong> {{ selectedRow.roleName || '-' }}</p>
        <p><strong>区服：</strong> {{ selectedRow.serverId }} - {{ selectedRow.serverName || '' }}</p>
        <p><strong>组名：</strong> {{ formatGroupName(selectedRow.platform) }}</p>
        <p><strong>组长：</strong> {{ selectedRow.teamLeader || '-' }}</p>
        <p><strong>组员编号：</strong> {{ formatMemberCode(selectedRow.teamMember) }}</p>
        <p><strong>申请人：</strong> {{ selectedRow.applicant }}</p>
        <p><strong>申请时间：</strong> {{ formatTime(selectedRow.applyTime) }}</p>
        <p><strong>状态：</strong> {{ getStatusLabel(selectedRow.status as string) }}</p>
        <p><strong>备注：</strong> {{ selectedRow.remark || '-' }}</p>
        
        <!-- 附件图片 -->
        <div class="attachments-section">
          <p><strong>证明截图：</strong></p>
          <div v-if="selectedRow.attachments && (selectedRow.attachments as string[]).length > 0" class="image-list">
            <el-image
              v-for="(url, index) in (selectedRow.attachments as string[])"
              :key="index"
              :src="getImageUrl(url)"
              :preview-src-list="(selectedRow.attachments as string[]).map(u => getImageUrl(u))"
              :initial-index="index"
              fit="cover"
              class="attachment-image"
            />
          </div>
          <span v-else class="no-attachments">暂无截图</span>
        </div>
      </div>
    </el-dialog>

    <!-- 审核弹窗 -->
    <el-dialog 
      v-model="reviewDialogVisible" 
      :title="reviewAction === 'approve' ? '审核通过' : '审核拒绝'" 
      width="400px"
    >
      <div v-if="reviewRow" class="review-content">
        <p>角色ID: <strong>{{ reviewRow.roleId }}</strong></p>
        <p>申请人: <strong>{{ reviewRow.applicant }}</strong></p>
        <el-form-item label="审核备注">
          <el-input 
            v-model="reviewRemark" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入审核备注（选填）"
          />
        </el-form-item>
      </div>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button 
          :type="reviewAction === 'approve' ? 'success' : 'warning'" 
          @click="submitReview"
        >
          {{ reviewAction === 'approve' ? '确认通过' : '确认拒绝' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑申请" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="项目">
          <el-input v-model="editForm.project" disabled />
        </el-form-item>
        <el-form-item label="角色ID">
          <el-input v-model="editForm.roleId" disabled />
        </el-form-item>
        <el-form-item label="角色名称">
          <el-input v-model="editForm.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="区服ID">
          <el-input-number v-model="editForm.serverId" :min="1" />
        </el-form-item>
        <el-form-item label="区服名称">
          <el-input v-model="editForm.serverName" placeholder="请输入区服名称" />
        </el-form-item>
        <el-form-item label="组长">
          <el-input v-model="editForm.teamLeader" placeholder="请输入组长" />
        </el-form-item>
        <el-form-item label="组员">
          <el-input v-model="editForm.teamMember" placeholder="请输入组员" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">保存</el-button>
      </template>
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

.attachments-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #EBEEF5;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.attachment-image {
  width: 120px;
  height: 120px;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
  cursor: pointer;
  
  &:hover {
    border-color: #409EFF;
  }
}

.no-attachments {
  color: #909399;
  font-size: 14px;
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
