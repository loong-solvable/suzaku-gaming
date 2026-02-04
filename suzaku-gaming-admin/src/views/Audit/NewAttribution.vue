<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules, UploadProps, UploadFile } from "element-plus";

const router = useRouter();
const formRef = ref<FormInstance>();
const loading = ref(false);

// 表单数据
const form = reactive({
  project: "",
  roleId: "",
  server: "",
  roleName: "",
  platform1: "",
  platform2: "",
  platform3: "",
  remark: ""
});

// 上传的文件列表
const fileList = ref<UploadFile[]>([]);
const uploadedCount = computed(() => fileList.value.filter(f => f.status === 'success').length);

// 下拉选项数据
const projectOptions = [
  { label: "JUR", value: "jur" },
  { label: "朱雀", value: "suzaku" },
  { label: "战舰", value: "warship" }
];

const platform1Options = [
  { label: "Google", value: "google" },
  { label: "Facebook", value: "facebook" },
  { label: "TikTok", value: "tiktok" },
  { label: "Organic", value: "organic" }
];

// 二级组长选项（根据一级平台动态变化）
const platform2Options = computed(() => {
  const options: Record<string, { label: string; value: string }[]> = {
    google: [
      { label: "星禾组", value: "xinghe" },
      { label: "运营组A", value: "opsA" },
      { label: "运营组B", value: "opsB" }
    ],
    facebook: [
      { label: "FB组1", value: "fb1" },
      { label: "FB组2", value: "fb2" }
    ],
    tiktok: [
      { label: "TK组1", value: "tk1" },
      { label: "TK组2", value: "tk2" }
    ],
    organic: [
      { label: "自然组", value: "natural" }
    ]
  };
  return options[form.platform1] || [];
});

// 三级组员选项（根据二级组长动态变化）
const platform3Options = computed(() => {
  const options: Record<string, { label: string; value: string }[]> = {
    xinghe: [
      { label: "星禾组1", value: "xinghe1" },
      { label: "星禾组2", value: "xinghe2" },
      { label: "星禾组3", value: "xinghe3" }
    ],
    opsA: [
      { label: "运营A-1", value: "opsA1" },
      { label: "运营A-2", value: "opsA2" }
    ],
    opsB: [
      { label: "运营B-1", value: "opsB1" },
      { label: "运营B-2", value: "opsB2" }
    ],
    fb1: [
      { label: "FB1-成员1", value: "fb1m1" },
      { label: "FB1-成员2", value: "fb1m2" }
    ],
    fb2: [
      { label: "FB2-成员1", value: "fb2m1" }
    ],
    tk1: [
      { label: "TK1-成员1", value: "tk1m1" }
    ],
    tk2: [
      { label: "TK2-成员1", value: "tk2m1" }
    ],
    natural: [
      { label: "自然-1", value: "natural1" }
    ]
  };
  return options[form.platform2] || [];
});

// 监听级联变化，清空下级选择
watch(() => form.platform1, () => {
  form.platform2 = "";
  form.platform3 = "";
});

watch(() => form.platform2, () => {
  form.platform3 = "";
});

// 表单校验规则
const rules: FormRules = {
  project: [{ required: true, message: "请选择项目", trigger: "change" }],
  roleId: [{ required: true, message: "请输入角色ID", trigger: "blur" }],
  server: [{ required: true, message: "请输入区服", trigger: "blur" }],
  platform1: [{ required: true, message: "请选择一级平台", trigger: "change" }],
  platform2: [{ required: true, message: "请选择二级组长", trigger: "change" }],
  platform3: [{ required: true, message: "请选择三级组员", trigger: "change" }]
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

// 文件变化处理
const handleFileChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
  fileList.value = uploadFiles;
};

// 文件移除处理
const handleFileRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  fileList.value = uploadFiles;
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  // 校验图片数量
  const successCount = fileList.value.filter(f => f.status === 'success' || f.raw).length;
  if (successCount < 3) {
    ElMessage.error('请上传至少 3 张截图！');
    return;
  }
  if (successCount > 5) {
    ElMessage.error('最多只能上传 5 张截图！');
    return;
  }

  try {
    await formRef.value.validate();
    loading.value = true;

    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000));

    ElMessage.success("提交成功！");
    router.push("/audit/binding-apply");
  } catch (error) {
    console.log("Validation failed:", error);
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

        <el-form-item label="区服" prop="server" required>
          <el-input v-model="form.server" class="form-input" />
        </el-form-item>

        <el-form-item label="角色昵称" prop="roleName">
          <el-input v-model="form.roleName" class="form-input" />
        </el-form-item>

        <!-- 第二部分：来源更改 -->
        <div class="section-divider">
          <span class="section-title">来源更改为:</span>
        </div>

        <el-form-item label="一级平台" prop="platform1" required>
          <el-select v-model="form.platform1" placeholder="请选择" class="form-input">
            <el-option 
              v-for="opt in platform1Options" 
              :key="opt.value" 
              :label="opt.label" 
              :value="opt.value" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="二级组长" prop="platform2" required>
          <el-select 
            v-model="form.platform2" 
            placeholder="请选择" 
            class="form-input"
            :disabled="!form.platform1"
          >
            <el-option 
              v-for="opt in platform2Options" 
              :key="opt.value" 
              :label="opt.label" 
              :value="opt.value" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="三级组员" prop="platform3" required>
          <el-select 
            v-model="form.platform3" 
            placeholder="请选择" 
            class="form-input"
            :disabled="!form.platform2"
          >
            <el-option 
              v-for="opt in platform3Options" 
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
              accept=".jpg,.jpeg,.png"
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
