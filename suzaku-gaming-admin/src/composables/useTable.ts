// src/composables/useTable.ts
import { ref, reactive, onUnmounted, type Ref } from 'vue';

interface UseTableOptions<T> {
  fetchApi: (params: Record<string, unknown>) => Promise<{
    list: T[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>;
  defaultPageSize?: number;
  immediate?: boolean;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface Sort {
  prop: string | null;
  order: 'ascending' | 'descending' | null;
}

export function useTable<T = unknown>(options: UseTableOptions<T>) {
  const { fetchApi, defaultPageSize = 20, immediate = true } = options;

  const loading = ref(false);
  const data: Ref<T[]> = ref([]);
  const pagination = reactive<Pagination>({
    page: 1,
    pageSize: defaultPageSize,
    total: 0,
    totalPages: 0
  });
  const sort = reactive<Sort>({
    prop: null,
    order: null
  });

  let abortController: AbortController | null = null;

  const fetchData = async (filterParams: Record<string, unknown> = {}) => {
    // 取消之前的请求
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    loading.value = true;
    try {
      const params: Record<string, unknown> = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filterParams
      };

      if (sort.prop && sort.order) {
        params.sortBy = sort.prop;
        params.sortOrder = sort.order === 'ascending' ? 'asc' : 'desc';
      }

      // 过滤掉空值
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
      );

      const result = await fetchApi(cleanParams);
      data.value = result.list;
      pagination.total = result.pagination.total;
      pagination.totalPages = result.pagination.totalPages;
    } catch (error: unknown) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Table fetch error:', error);
      }
    } finally {
      loading.value = false;
    }
  };

  const handlePageChange = (page: number) => {
    pagination.page = page;
  };

  const handleSizeChange = (size: number) => {
    pagination.pageSize = size;
    pagination.page = 1;
  };

  const handleSortChange = ({ prop, order }: { prop: string | null; order: 'ascending' | 'descending' | null }) => {
    sort.prop = prop;
    sort.order = order;
    pagination.page = 1;
  };

  const reset = () => {
    pagination.page = 1;
    pagination.pageSize = defaultPageSize;
    pagination.total = 0;
    pagination.totalPages = 0;
    sort.prop = null;
    sort.order = null;
    data.value = [];
  };

  const refresh = (filterParams: Record<string, unknown> = {}) => {
    return fetchData(filterParams);
  };

  onUnmounted(() => {
    if (abortController) {
      abortController.abort();
    }
  });

  // 立即执行首次加载
  if (immediate) {
    fetchData();
  }

  return {
    loading,
    data,
    pagination,
    sort,
    fetchData,
    handlePageChange,
    handleSizeChange,
    handleSortChange,
    reset,
    refresh
  };
}
