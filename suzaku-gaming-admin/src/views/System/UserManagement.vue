<template>
  <div class="user-management">
    <!-- 搜索筛选 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline>
        <el-form-item label="用户名">
          <el-input v-model="filterForm.username" placeholder="用户名" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="filterForm.realName" placeholder="真实姓名" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="filterForm.role" placeholder="请选择" clearable style="width: 120px">
            <el-option label="管理员" value="admin" />
            <el-option label="组长" value="manager" />
            <el-option label="组员" value="operator" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择" clearable style="width: 100px">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleCreate">新增用户</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="真实姓名" width="100" />
        <el-table-column prop="role" label="角色" width="80">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)">{{ getRoleName(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cpsGroupCode" label="CPS组" width="100" />
        <el-table-column prop="memberCode" label="组员编号" width="110">
          <template #default="{ row }">
            {{ row.memberCode || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="160">
          <template #default="{ row }">
            {{ formatTime(row.lastLoginAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button 
              :type="row.status === 1 ? 'danger' : 'success'" 
              link 
              size="small"
              :disabled="row.id === currentUserId"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button type="warning" link size="small" @click="handleResetPassword(row)">重置密码</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="500px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" :disabled="isEdit" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="formData.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="formData.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" placeholder="请选择角色" :disabled="!isAdmin" style="width: 100%">
            <el-option label="管理员" value="admin" :disabled="!isAdmin" />
            <el-option label="组长" value="manager" :disabled="!isAdmin" />
            <el-option label="组员" value="operator" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="resetPwdVisible" title="重置密码" width="400px">
      <el-form ref="resetPwdFormRef" :model="resetPwdForm" :rules="resetPwdRules" label-width="80px">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="resetPwdForm.password" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="resetPwdForm.confirmPassword" type="password" show-password placeholder="请确认新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleResetPwdSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import { userApi, type UserInfo } from '@/api/user';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

const loading = ref(false);
const submitLoading = ref(false);
const tableData = ref<UserInfo[]>([]);
const dialogVisible = ref(false);
const resetPwdVisible = ref(false);
const isEdit = ref(false);
const editingId = ref<number | null>(null);

const formRef = ref<FormInstance>();
const resetPwdFormRef = ref<FormInstance>();

const currentUserId = computed(() => userStore.userInfo?.id);
const isAdmin = computed(() => userStore.isAdmin);

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const filterForm = reactive({
  username: '',
  realName: '',
  role: '',
  status: undefined as number | undefined,
});

const formData = reactive({
  username: '',
  password: '',
  realName: '',
  role: 'operator',
});

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
};

const resetPwdForm = reactive({
  password: '',
  confirmPassword: '',
});

const resetPwdRules = {
  password: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: Function) => {
        if (value !== resetPwdForm.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

const getRoleName = (role: string) => {
  const map: Record<string, string> = { admin: '管理员', manager: '组长', operator: '组员' };
  return map[role] || role;
};

const getRoleTagType = (role: string) => {
  const map: Record<string, string> = { admin: 'danger', manager: 'warning', operator: '' };
  return map[role] || '';
};

const formatTime = (time?: string) => {
  if (!time) return '-';
  return time.replace('T', ' ').slice(0, 19);
};

const fetchData = async () => {
  loading.value = true;
  try {
    const data = await userApi.getUsers({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filterForm,
    });
    tableData.value = data.list;
    pagination.total = data.pagination.total;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

const handleReset = () => {
  filterForm.username = '';
  filterForm.realName = '';
  filterForm.role = '';
  filterForm.status = undefined;
  pagination.page = 1;
  fetchData();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchData();
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
  fetchData();
};

const handleCreate = () => {
  isEdit.value = false;
  editingId.value = null;
  formData.username = '';
  formData.password = '';
  formData.realName = '';
  formData.role = 'operator';
  dialogVisible.value = true;
};

const handleEdit = (row: UserInfo) => {
  isEdit.value = true;
  editingId.value = row.id;
  formData.username = row.username;
  formData.password = '';
  formData.realName = row.realName;
  formData.role = row.role;
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitLoading.value = true;
  try {
    if (isEdit.value && editingId.value) {
      await userApi.updateUser(editingId.value, {
        realName: formData.realName,
        role: formData.role,
      });
      ElMessage.success('更新成功');
    } else {
      await userApi.createUser({
        username: formData.username,
        password: formData.password,
        realName: formData.realName,
        role: formData.role,
      });
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    fetchData();
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    submitLoading.value = false;
  }
};

const handleToggleStatus = async (row: UserInfo) => {
  const action = row.status === 1 ? '禁用' : '启用';
  try {
    await ElMessageBox.confirm(`确定要${action}用户 "${row.username}" 吗？`, '提示', {
      type: 'warning',
    });
    await userApi.toggleStatus(row.id);
    ElMessage.success(`${action}成功`);
    fetchData();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败');
    }
  }
};

const handleResetPassword = (row: UserInfo) => {
  editingId.value = row.id;
  resetPwdForm.password = '';
  resetPwdForm.confirmPassword = '';
  resetPwdVisible.value = true;
};

const handleResetPwdSubmit = async () => {
  const valid = await resetPwdFormRef.value?.validate().catch(() => false);
  if (!valid || !editingId.value) return;

  submitLoading.value = true;
  try {
    await userApi.updateUser(editingId.value, {
      password: resetPwdForm.password,
    });
    ElMessage.success('密码重置成功');
    resetPwdVisible.value = false;
  } catch (error: any) {
    ElMessage.error(error.message || '重置失败');
  } finally {
    submitLoading.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.user-management {
  padding: 0;
}

.filter-card {
  margin-bottom: 16px;
}

.table-card {
  :deep(.el-card__body) {
    padding: 16px;
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
