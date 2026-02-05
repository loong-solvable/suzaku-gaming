<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules, UploadProps, UploadFile } from "element-plus";
import { auditApi } from "@/api/audit";
import { userApi } from "@/api/user";
import { uploadApi } from "@/api/upload";

const router = useRouter();

// 用户数据
interface TeamMember {
  id: number;
  username: string;
  realName: string;
  parentId?: number;
}
const managers = ref<TeamMember[]>([]);
const operators = ref<TeamMember[]>([]);

// 加载用户数据（使用新的 team-options 接口，operator 也可访问）
const loadUsers = async () => {
  try {
    const res = await userApi.getTeamOptions();
    managers.value = res.managers || [];
    operators.value = res.operators || [];
  } catch (error) {
    console.error('加载用户数据失败:', error);
  }
};

onMounted(() => {
  loadUsers();
});
const formRef = ref<FormInstance>();
const loading = ref(false);

// 表单数据 - 与后端 DTO 字段对应
const form = reactive({
  project: "",
  roleId: "",
  serverId: null as number | null,
  serverName: "",
  roleName: "",
  platform: "",      // 一级平台 -> platform
  teamLeader: "",    // 二级组长 -> teamLeader
  teamMember: "",    // 三级组员 -> teamMember
  remark: "",
  attachments: [] as string[]
});

// 上传的文件列表
const fileList = ref<UploadFile[]>([]);
const uploadedCount = computed(() => fileList.value.filter(f => f.status === 'success').length);

// 下拉选项数据
const projectOptions = [
  { label: "JUR", value: "jur" },
  { label: "海战", value: "warship" },
  { label: "战舰", value: "warship" }
];

const platform1Options = [
  { label: "Google", value: "google" },
  { label: "Facebook", value: "facebook" },
  { label: "TikTok", value: "tiktok" },
  { label: "Organic", value: "organic" }
];

// 二级组长选项 - 从用户系统动态获取
const teamLeaderOptions = computed(() => {
  // 所有组长都可选（不再按平台过滤）
  return managers.value.map(m => ({
    label: m.realName || m.username,
    value: m.username
  }));
});

// 三级组员选项 - 从用户系统动态获取
const teamMemberOptions = computed(() => {
  // 找到选中的组长
  const selectedManager = managers.value.find(m => m.username === form.teamLeader);
  if (!selectedManager) return [];
  
  // 过滤出该组长下属的组员（根据 parentId 关联）
  const subordinates = operators.value.filter(o => o.parentId === selectedManager.id);
  
  // 如果没有关联的下属，显示所有组员
  if (subordinates.length === 0) {
    return operators.value.map(o => ({
      label: o.realName || o.username,
      value: o.username
    }));
  }
  
  return subordinates.map(o => ({
    label: o.realName || o.username,
    value: o.username
  }));
});

// 监听级联变化，清空下级选择
watch(() => form.platform, () => {
  form.teamLeader = "";
  form.teamMember = "";
});

watch(() => form.teamLeader, () => {
  form.teamMember = "";
});

// 表单校验规则
const rules: FormRules = {
  project: [{ required: true, message: "请选择项目", trigger: "change" }],
  roleId: [{ required: true, message: "请输入角色ID", trigger: "blur" }],
  serverId: [{ required: true, message: "请输入区服ID", trigger: "blur" }],
  platform: [{ required: true, message: "请选择一级平台", trigger: "change" }],
  teamLeader: [{ required: true, message: "请选择二级组长", trigger: "change" }],
  teamMember: [{ required: true, message: "请选择三级组员", trigger: "change" }]
};

// 文件上传前校验
const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const validTypes = ['image/jpeg', 'image/png'];
  if (!validTypes.includes(rawFile.type)) {
    ElMessage.error('只能上传 JPG/PNG 格式的图片！');
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

// 文件变化处理 - 自动上传
const handleFileChange: UploadProps['onChange'] = async (uploadFile, uploadFiles) => {
  fileList.value = uploadFiles;
  
  // 如果文件有 raw 属性且未上传过，则上传
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

// 文件移除处理
const handleFileRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  fileList.value = uploadFiles;
  // 更新 attachments 数组
  form.attachments = fileList.value
    .filter(f => f.status === 'success' && f.url)
    .map(f => f.url as string);
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  // 校验图片数量（暂时放宽限制，步骤7会完善文件上传）
  const successCount = fileList.value.filter(f => f.status === 'success' || f.raw).length;
  if (successCount > 5) {
    ElMessage.error('最多只能上传 5 张截图！');
    return;
  }

  try {
    await formRef.value.validate();
    loading.value = true;

    // 构建提交数据
    const submitData = {
      project: form.project,
      roleId: form.roleId,
      serverId: form.serverId || 0,
      serverName: form.serverName,
      roleName: form.roleName,
      platform: form.platform,
      teamLeader: form.teamLeader,
      teamMember: form.teamMember,
      remark: form.remark,
      attachments: form.attachments,
      applicant: '' // 后端会自动覆盖为当前用户
    };

    await auditApi.createBindingApply(submitData);
    ElMessage.success("提交成功！");
    router.push("/audit/binding-apply");
  } catch (error: any) {
    console.log("提交失败:", error);
    ElMessage.error(error?.message || "提交失败");
  } finally {
    loading.value = false;
  }
};

// 取消
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
        <el-form-item label="项目选择" prop="project" required>
          <el-select v-model="form.project" placeholder="请选择" class="form-input">
            <el-option 
              v-for="opt in projectOptions" 
              :key="opt.value" 
              :label="opt.label" 
              :value="opt.value" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="角色ID" prop="roleId" required>
          <el-input v-model="form.roleId" class="form-input" />
        </el-form-item>

        <el-form-item label="区服ID" prop="serverId" required>
          <el-input-number v-model="form.serverId" :min="1" class="form-input" controls-position="right" />
        </el-form-item>

        <el-form-item label="区服名称" prop="serverName">
          <el-input v-model="form.serverName" class="form-input" placeholder="可选" />
        </el-form-item>

        <el-form-item label="角色昵称" prop="roleName">
          <el-input v-model="form.roleName" class="form-input" />
        </el-form-item>

        <!-- 第二部分：来源更改 -->
        <div class="section-divider">
          <span class="section-title">来源更改为:</span>
        </div>

        <el-form-item label="一级平台" prop="platform" required>
          <el-select v-model="form.platform" placeholder="请选择" class="form-input">
            <el-option 
              v-for="opt in platform1Options" 
              :key="opt.value" 
              :label="opt.label" 
              :value="opt.value" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="二级组长" prop="teamLeader" required>
          <el-select 
            v-model="form.teamLeader" 
            placeholder="请选择" 
            class="form-input"
            :disabled="!form.platform"
          >
            <el-option 
              v-for="opt in teamLeaderOptions" 
              :key="opt.value" 
              :label="opt.label" 
              :value="opt.value" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="三级组员" prop="teamMember" required>
          <el-select 
            v-model="form.teamMember" 
            placeholder="请选择" 
            class="form-input"
            :disabled="!form.teamLeader"
          >
            <el-option 
              v-for="opt in teamMemberOptions" 
              :key="opt.value" 
              :label="opt.label" 
              :value="opt.value" 
            />
          </el-select>
        </el-form-item>

        <!-- 第三部分：凭证上传 -->
        <el-form-item label="截图" prop="images">
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
              <p class="hint-text">上传图片为 jpg/png 文件，且不超过 500kb</p>
              <p class="hint-count">
                已上传 <span :class="{ 'count-warning': uploadedCount < 3 }">{{ uploadedCount }}/5</span> 张图片，需上传 3-5 张且全部上传成功后方可提交
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
          />
        </el-form-item>

        <!-- 底部操作栏 -->
        <el-form-item label=" " class="form-actions">
          <el-button type="primary" :loading="loading" @click="handleSubmit">
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
