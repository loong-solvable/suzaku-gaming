<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules, UploadProps, UploadFile } from "element-plus";
import { auditApi } from "@/api/audit";
import type { RoleCheckResult } from "@/api/audit";
import { userApi } from "@/api/user";
import { uploadApi } from "@/api/upload";
import { useUserStore } from "@/stores/user";

const router = useRouter();
const userStore = useUserStore();

// ========== 团队数据 ==========
interface GroupOption {
  id: number;
  username: string;
  realName: string;
  cpsGroupCode?: string;
}
interface MemberOption {
  id: number;
  username: string;
  realName: string;
  cpsGroupCode?: string;
  memberCode?: string;
  parentId?: number;
}
const groups = ref<GroupOption[]>([]);
const members = ref<MemberOption[]>([]);

// 加载团队数据
const loadTeamData = async () => {
  try {
    const res = await userApi.getTeamOptions();
    // Phase 4: 使用新 key groups/members
    groups.value = res.groups || res.managers || [];
    members.value = res.members || res.operators || [];
  } catch (error) {
    console.error('加载团队数据失败:', error);
  }
};

onMounted(() => {
  loadTeamData();
});

// ========== 角色 ID 预校验 ==========
const roleCheckLoading = ref(false);
const roleCheckResult = ref<RoleCheckResult | null>(null);
// 'idle' | 'checking' | 'bindable' | 'bound' | 'not_found' | 'error'
const roleCheckStatus = ref<string>('idle');

const handleRoleIdBlur = async () => {
  const roleId = form.roleId.trim();
  if (!roleId) {
    roleCheckResult.value = null;
    roleCheckStatus.value = 'idle';
    return;
  }

  roleCheckLoading.value = true;
  roleCheckStatus.value = 'checking';
  try {
    const result = await auditApi.checkRole(roleId);
    roleCheckResult.value = result;

    if (result.valid) {
      roleCheckStatus.value = 'bindable';
      // 自动填充区服和角色名
      if (result.role) {
        if (result.role.serverId) form.serverId = result.role.serverId;
        if (result.role.serverName) form.serverName = result.role.serverName;
        if (result.role.roleName) form.roleName = result.role.roleName;
      }
    } else {
      // 根据 reason 判断状态
      const reason = result.reason || '';
      if (reason.includes('不存在') || reason.includes('不在') || reason.includes('not found')) {
        roleCheckStatus.value = 'not_found';
      } else {
        roleCheckStatus.value = 'bound'; // 已绑定或有 pending 申请
      }
    }
  } catch (error: any) {
    roleCheckStatus.value = 'error';
    roleCheckResult.value = null;
    console.error('角色校验失败:', error);
  } finally {
    roleCheckLoading.value = false;
  }
};

// 校验提示文字和颜色
const roleCheckMessage = computed(() => {
  switch (roleCheckStatus.value) {
    case 'checking': return '校验中...';
    case 'bindable': return '✓ 角色可绑定';
    case 'bound': return '⚠ ' + (roleCheckResult.value?.reason || '该角色已绑定或有待审核申请');
    case 'not_found': return '✕ 角色不存在';
    case 'error': return '✕ 校验失败，请重试';
    default: return '';
  }
});

const roleCheckColor = computed(() => {
  switch (roleCheckStatus.value) {
    case 'bindable': return '#67C23A';   // 绿色
    case 'bound': return '#E6A23C';      // 橙色
    case 'not_found':
    case 'error': return '#F56C6C';      // 红色
    default: return '#909399';
  }
});

// 是否可提交（角色校验必须通过）
const roleCheckPassed = computed(() => roleCheckStatus.value === 'bindable');

// ========== 组名下拉（按角色隔离） ==========
const groupOptions = computed(() => {
  if (userStore.isAdmin) {
    // 管理员：所有组
    return groups.value.map(g => ({
      label: (g.cpsGroupCode || '').replace('Group', '') + '组',
      value: g.cpsGroupCode || ''
    }));
  }
  // 组长/组员：锁定为本组
  const myGroupCode = userStore.cpsGroupCode;
  if (myGroupCode) {
    return [{
      label: myGroupCode.replace('Group', '') + '组',
      value: myGroupCode
    }];
  }
  return [];
});

// 非管理员自动锁定组名
const isGroupLocked = computed(() => !userStore.isAdmin);

// ========== 组员编号下拉（联动组名） ==========
const memberOptions = computed(() => {
  if (!form.platform) return [];
  // 过滤选中组的所有成员
  return members.value
    .filter(m => m.cpsGroupCode === form.platform && m.memberCode)
    .map(m => ({
      label: `${m.memberCode} (${m.realName || m.username})`,
      value: m.memberCode!
    }));
});

// ========== 表单数据 ==========
const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  project: "warship",       // 固定为海战
  roleId: "",
  serverId: null as number | null,
  serverName: "",
  roleName: "",
  platform: "",             // 组名 -> cpsGroupCode
  teamMember: "",           // 组员编号 -> memberCode
  remark: "",
  attachments: [] as string[]
});

// 上传的文件列表
const fileList = ref<UploadFile[]>([]);
const uploadedCount = computed(() => fileList.value.filter(f => f.status === 'success').length);

// 非管理员自动设置组名
onMounted(() => {
  if (!userStore.isAdmin && userStore.cpsGroupCode) {
    form.platform = userStore.cpsGroupCode;
  }
});

// 监听组名变化，清空组员编号
watch(() => form.platform, () => {
  form.teamMember = "";
});

// 监听角色ID变化，重置校验状态
watch(() => form.roleId, () => {
  roleCheckStatus.value = 'idle';
  roleCheckResult.value = null;
});

// ========== 表单校验规则 ==========
const rules: FormRules = {
  roleId: [{ required: true, message: "请输入角色ID", trigger: "blur" }],
  serverId: [{ required: true, message: "请输入区服ID", trigger: "blur" }],
  platform: [{ required: true, message: "请选择组名", trigger: "change" }],
  teamMember: [{ required: true, message: "请选择组员编号", trigger: "change" }]
};

// ========== 文件上传 ==========
const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(rawFile.type)) {
    ElMessage.error('只能上传 JPG/PNG/GIF/WebP 格式的图片！');
    return false;
  }
  if (rawFile.size / 1024 > 500) {
    ElMessage.error('图片大小不能超过 500KB！');
    return false;
  }
  if (fileList.value.length >= 5) {
    ElMessage.error('最多只能上传 5 张图片！');
    return false;
  }
  return true;
};

const handleFileChange: UploadProps['onChange'] = async (uploadFile, uploadFiles) => {
  fileList.value = uploadFiles;

  if (uploadFile.raw && uploadFile.status === 'ready') {
    try {
      uploadFile.status = 'uploading';
      const result = await uploadApi.uploadImage(uploadFile.raw);
      uploadFile.status = 'success';
      uploadFile.url = result.url;
      // 更新 attachments 数组
      form.attachments = fileList.value
        .filter(f => f.status === 'success' && f.url)
        .map(f => f.url as string);
      ElMessage.success('上传成功');
    } catch (error: any) {
      uploadFile.status = 'fail';
      ElMessage.error(error?.message || '上传失败');
    }
  }
};

const handleFileRemove: UploadProps['onRemove'] = (_uploadFile, uploadFiles) => {
  fileList.value = uploadFiles;
  form.attachments = fileList.value
    .filter(f => f.status === 'success' && f.url)
    .map(f => f.url as string);
};

// ========== 提交表单 ==========
const handleSubmit = async () => {
  if (!formRef.value) return;

  // 前端校验：角色ID 必须通过预校验
  if (!roleCheckPassed.value) {
    ElMessage.error('请先通过角色ID校验');
    return;
  }

  // 前端校验：截图 3-5 张
  if (uploadedCount.value < 3) {
    ElMessage.error('至少需要上传 3 张截图！');
    return;
  }
  if (uploadedCount.value > 5) {
    ElMessage.error('最多只能上传 5 张截图！');
    return;
  }

  try {
    await formRef.value.validate();
    loading.value = true;

    // 构建提交数据（R1: 使用现有字段名）
    const submitData = {
      project: 'warship',               // 固定海战
      roleId: form.roleId.trim(),
      serverId: form.serverId || 0,
      serverName: form.serverName,
      roleName: form.roleName,
      platform: form.platform,           // cpsGroupCode
      teamMember: form.teamMember,       // memberCode
      attachments: form.attachments,
      remark: form.remark,
      applicant: ''                      // 后端自动覆盖
    };

    await auditApi.createBindingApply(submitData);
    ElMessage.success("提交成功！");
    router.push("/audit/binding-apply");
  } catch (error: any) {
    console.error("提交失败:", error);
    ElMessage.error(error?.message || "提交失败");
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  router.back();
};
</script>

<template>
  <div class="new-attribution-page">
    <div class="form-container">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        label-position="left"
        size="default"
      >
        <!-- 第一部分：基础信息 -->
        <el-form-item label="项目">
          <span class="readonly-text">海战</span>
        </el-form-item>

        <el-form-item label="角色ID" prop="roleId" required>
          <div class="role-id-wrapper">
            <el-input
              v-model="form.roleId"
              class="form-input"
              placeholder="请输入角色ID"
              @blur="handleRoleIdBlur"
              :suffix-icon="roleCheckLoading ? 'Loading' : undefined"
            />
            <div
              v-if="roleCheckMessage"
              class="role-check-hint"
              :style="{ color: roleCheckColor }"
            >
              {{ roleCheckMessage }}
            </div>
          </div>
        </el-form-item>

        <el-form-item label="区服ID" prop="serverId" required>
          <el-input-number v-model="form.serverId" :min="1" class="form-input" controls-position="right" />
        </el-form-item>

        <el-form-item label="区服名称" prop="serverName">
          <el-input v-model="form.serverName" class="form-input" placeholder="自动填充或手动输入" />
        </el-form-item>

        <el-form-item label="角色昵称" prop="roleName">
          <el-input v-model="form.roleName" class="form-input" placeholder="自动填充或手动输入" />
        </el-form-item>

        <!-- 第二部分：来源更改 -->
        <div class="section-divider">
          <span class="section-title">来源更改为:</span>
        </div>

        <el-form-item label="组名" prop="platform" required>
          <el-select
            v-model="form.platform"
            placeholder="请选择组名"
            class="form-input"
            :disabled="isGroupLocked"
          >
            <el-option
              v-for="opt in groupOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="组员编号" prop="teamMember" required>
          <el-select
            v-model="form.teamMember"
            placeholder="请选择组员编号"
            class="form-input"
            :disabled="!form.platform"
            filterable
          >
            <el-option
              v-for="opt in memberOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <!-- 第三部分：凭证上传 -->
        <el-form-item label="截图" required>
          <div class="upload-section">
            <el-upload
              class="upload-dragger"
              drag
              action="#"
              :auto-upload="false"
              :file-list="fileList"
              :before-upload="beforeUpload"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              multiple
              list-type="picture"
            >
              <div class="upload-content">
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="upload-text">
                  将文件拖到此处，或 <span class="upload-link">点击上传</span>
                </div>
              </div>
            </el-upload>
            <div class="upload-hints">
              <p class="hint-text">上传图片为 jpg/png/gif/webp 文件，且不超过 500KB</p>
              <p class="hint-count">
                已上传 <span :class="{ 'count-ok': uploadedCount >= 3, 'count-warning': uploadedCount < 3 }">{{ uploadedCount }}/5</span> 张图片，需上传 3-5 张且全部上传成功后方可提交
              </p>
            </div>
          </div>
        </el-form-item>

        <!-- 第四部分：备注 -->
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="4"
            class="form-input"
            resize="vertical"
            placeholder="请输入备注（选填）"
          />
        </el-form-item>

        <!-- 底部操作栏 -->
        <el-form-item label=" " class="form-actions">
          <el-button type="primary" :loading="loading" :disabled="!roleCheckPassed" @click="handleSubmit">
            提交
          </el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.new-attribution-page {
  width: 100%;
  background: #FFFFFF;
  padding: 20px;
}

.form-container {
  max-width: 700px;
}

.form-input {
  width: 400px;
}

.readonly-text {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  line-height: 32px;
}

// 角色 ID 校验提示
.role-id-wrapper {
  display: flex;
  flex-direction: column;
}

.role-check-hint {
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.4;
}

// 分节标题
.section-divider {
  margin: 24px 0 16px 0;
  padding-left: 120px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

// 上传区域
.upload-section {
  width: 100%;
}

.upload-dragger {
  width: 400px;

  :deep(.el-upload-dragger) {
    padding: 30px 20px;
    border: 1px dashed #D9D9D9;
    border-radius: 4px;
    background: #FAFAFA;

    &:hover {
      border-color: #409EFF;
    }
  }
}

.upload-content {
  text-align: center;
}

.upload-icon {
  font-size: 40px;
  color: #C0C4CC;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  color: #606266;
}

.upload-link {
  color: #409EFF;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.upload-hints {
  margin-top: 8px;
}

.hint-text {
  font-size: 12px;
  color: #909399;
  margin: 0 0 4px 0;
}

.hint-count {
  font-size: 12px;
  color: #909399;
  margin: 0;

  .count-warning {
    color: #E6A23C;
  }
  .count-ok {
    color: #67C23A;
  }
}

// 底部操作栏
.form-actions {
  margin-top: 32px;

  :deep(.el-form-item__content) {
    margin-left: 0 !important;
    padding-left: 120px;
  }
}

// 必填标识样式
:deep(.el-form-item.is-required:not(.is-no-asterisk) > .el-form-item__label:before) {
  content: '*';
  color: #F56C6C;
  margin-right: 4px;
}

// 上传列表样式
:deep(.el-upload-list--picture) {
  width: 400px;

  .el-upload-list__item {
    margin-top: 8px;
  }
}
</style>
