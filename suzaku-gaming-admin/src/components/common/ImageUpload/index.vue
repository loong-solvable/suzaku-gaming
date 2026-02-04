<script setup lang="ts">
import { ref, computed } from "vue";
import type { UploadFile, UploadRawFile } from "element-plus";
import { ElMessage } from "element-plus";

interface Props {
  modelValue: string[];
  maxSize?: number;
  maxCount?: number;
  accept?: string[];
}

interface Emits {
  (e: "update:modelValue", value: string[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  maxSize: 500,
  maxCount: 10,
  accept: () => ["image/jpeg", "image/png"]
});

const emit = defineEmits<Emits>();

const fileList = ref<UploadFile[]>([]);

const acceptString = computed(() => props.accept.join(","));

const beforeUpload = (file: UploadRawFile) => {
  const isValidType = props.accept.includes(file.type);
  if (!isValidType) {
    ElMessage.error("只支持 jpg/png 格式");
    return false;
  }

  const isLtSize = file.size / 1024 < props.maxSize;
  if (!isLtSize) {
    ElMessage.error("文件大小不能超过 " + props.maxSize + " KB");
    return false;
  }

  if (fileList.value.length >= props.maxCount) {
    ElMessage.error("最多只能上传 " + props.maxCount + " 个文件");
    return false;
  }

  return true;
};

const handleSuccess = (_response: unknown, _file: UploadFile, uploadFiles: UploadFile[]) => {
  fileList.value = uploadFiles;
  const urls = uploadFiles.map((f) => f.url || "").filter((url) => url);
  emit("update:modelValue", urls);
};

const handleRemove = (_file: UploadFile, uploadFiles: UploadFile[]) => {
  fileList.value = uploadFiles;
  const urls = uploadFiles.map((f) => f.url || "").filter((url) => url);
  emit("update:modelValue", urls);
};

const handleExceed = () => {
  ElMessage.error("最多只能上传 " + props.maxCount + " 个文件");
};
</script>

<template>
  <el-upload
    class="image-upload"
    action="#"
    :file-list="fileList"
    :limit="maxCount"
    :accept="acceptString"
    :before-upload="beforeUpload"
    :on-success="handleSuccess"
    :on-remove="handleRemove"
    :on-exceed="handleExceed"
    list-type="picture-card"
    drag
    multiple
  >
    <el-icon class="upload-icon"><Plus /></el-icon>
    <template #tip>
      <div class="upload-tip">
        只支持 jpg/png 格式，单个文件不超过 {{ maxSize }}KB，最多 {{ maxCount }} 个文件
      </div>
    </template>
  </el-upload>
</template>

<style lang="scss" scoped>
.image-upload {
  :deep(.el-upload--picture-card) {
    width: 120px;
    height: 120px;
    border-radius: 8px;
    border: 1px dashed #dcdfe6;
  }

  :deep(.el-upload-list__item) {
    width: 120px;
    height: 120px;
    border-radius: 8px;
  }
}

.upload-icon {
  font-size: 28px;
  color: #909399;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
</style>
