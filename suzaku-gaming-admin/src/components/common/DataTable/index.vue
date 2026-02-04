<script setup lang="ts">
import type { TableColumn, PaginationConfig } from "@/types/components";

interface Props {
  columns: TableColumn[];
  data: Record<string, unknown>[];
  loading?: boolean;
  pagination?: PaginationConfig;
  stripe?: boolean;
  border?: boolean;
}

interface Emits {
  (e: "sort-change", data: { prop: string | null; order: "ascending" | "descending" | null }): void;
  (e: "page-change", page: number): void;
  (e: "size-change", size: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  stripe: true,
  border: true
});

const emit = defineEmits<Emits>();

const handleSortChange = ({ prop, order }: { prop: string | null; order: "ascending" | "descending" | null }) => {
  emit("sort-change", { prop, order });
};

const handlePageChange = (page: number) => {
  emit("page-change", page);
};

const handleSizeChange = (size: number) => {
  emit("size-change", size);
};
</script>

<template>
  <div class="data-table">
    <el-table
      v-loading="loading"
      :data="data"
      :stripe="stripe"
      :border="border"
      style="width: 100%"
      @sort-change="handleSortChange"
    >
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth || 80"
        :sortable="column.sortable"
        :fixed="column.fixed"
        :align="column.align || 'left'"
      >
        <template v-if="column.slot" #default="scope">
          <slot :name="column.slot" :row="scope.row" :column="column" />
        </template>
        <template v-else-if="column.formatter" #default="scope">
          {{ column.formatter(scope.row, column, scope.row[column.prop]) }}
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无数据" />
      </template>
    </el-table>

    <div v-if="pagination" class="pagination-wrapper">
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="pagination.pageSizes || [10, 20, 50, 100]"
        :layout="pagination.layout || 'total, sizes, prev, pager, next, jumper'"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.data-table {
  background: #FFFFFF;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;

  :deep(.el-table) {
    width: 100% !important;
    
    th.el-table__cell {
      background-color: #FAFAFA;
      font-weight: 600;
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  border-top: 1px solid #EBEEF5;
}
</style>
