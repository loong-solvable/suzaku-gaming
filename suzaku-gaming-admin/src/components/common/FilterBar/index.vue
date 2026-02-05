<script setup lang="ts">
import { ref, watch } from "vue";
import type { FilterField } from "@/types/components";

interface Props {
  fields: FilterField[];
  modelValue: Record<string, unknown>;
  showExport?: boolean;
}

interface Emits {
  (e: "update:modelValue", value: Record<string, unknown>): void;
  (e: "search"): void;
  (e: "reset"): void;
  (e: "export"): void;
}

const props = withDefaults(defineProps<Props>(), {
  showExport: false
});

const emit = defineEmits<Emits>();

const localValue = ref<Record<string, unknown>>({ ...props.modelValue });

watch(
  () => props.modelValue,
  (newVal) => {
    localValue.value = { ...newVal };
  },
  { deep: true }
);

const handleFieldChange = (key: string, value: unknown) => {
  localValue.value[key] = value;
  emit("update:modelValue", { ...localValue.value });
};

const handleSearch = () => {
  emit("search");
};

const handleReset = () => {
  const resetValue: Record<string, unknown> = {};
  props.fields.forEach((field) => {
    resetValue[field.key] = field.type === "daterange" ? [] : "";
  });
  localValue.value = resetValue;
  emit("update:modelValue", resetValue);
  emit("reset");
};

const handleExport = () => {
  emit("export");
};
</script>

<template>
  <div class="filter-bar">
    <el-form :model="localValue" inline>
      <el-form-item
        v-for="field in fields"
        :key="field.key"
        :label="field.label"
      >
        <el-input
          v-if="field.type === 'input'"
          :model-value="localValue[field.key] as string"
          :placeholder="field.placeholder || '请输入'"
          :style="{ width: field.width || '200px' }"
          clearable
          @update:model-value="handleFieldChange(field.key, $event)"
        />
        <el-select
          v-else-if="field.type === 'select'"
          :model-value="localValue[field.key] as string"
          :placeholder="field.placeholder || '请选择'"
          :style="{ width: field.width || '200px' }"
          clearable
          @update:model-value="handleFieldChange(field.key, $event)"
        >
          <el-option
            v-for="option in field.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-date-picker
          v-else-if="field.type === 'daterange'"
          :model-value="localValue[field.key] as Date[]"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :style="{ width: field.width || '320px' }"
          unlink-panels
          @update:model-value="handleFieldChange(field.key, $event)"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="'Search'" class="btn-search" @click="handleSearch">
          查询
        </el-button>
        <el-button :icon="'Delete'" @click="handleReset">
          清空
        </el-button>
        <el-button
          v-if="showExport"
          type="success"
          :icon="'Download'"
          @click="handleExport"
        >
          导出
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
.filter-bar {
  background: #FFFFFF;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;

  :deep(.el-form-item) {
    margin-bottom: 12px;
    margin-right: 16px;
  }
}
</style>
