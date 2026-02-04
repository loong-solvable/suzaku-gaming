// src/composables/useFilter.ts
import { reactive, toRaw } from 'vue';

interface UseFilterOptions<T> {
  defaultValues: T;
  onSearch?: (values: T) => void;
  onReset?: () => void;
}

export function useFilter<T extends Record<string, unknown>>(options: UseFilterOptions<T>) {
  const { defaultValues, onSearch, onReset } = options;

  // 创建响应式筛选值，深拷贝默认值
  const filterValues = reactive<T>(JSON.parse(JSON.stringify(defaultValues)));

  const handleSearch = () => {
    const rawValues = toRaw(filterValues) as T;
    onSearch?.(rawValues);
  };

  const handleReset = () => {
    // 重置所有值为默认值
    Object.keys(defaultValues).forEach((key) => {
      (filterValues as Record<string, unknown>)[key] = (defaultValues as Record<string, unknown>)[key];
    });
    onReset?.();
  };

  const getFilterValues = (): T => {
    return JSON.parse(JSON.stringify(toRaw(filterValues)));
  };

  const setFilterValue = <K extends keyof T>(key: K, value: T[K]) => {
    (filterValues as Record<string, unknown>)[key as string] = value;
  };

  return {
    filterValues,
    handleSearch,
    handleReset,
    getFilterValues,
    setFilterValue
  };
}
