// src/composables/__tests__/useTable.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTable } from '../useTable';
import { nextTick } from 'vue';

// Mock onUnmounted
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    onUnmounted: vi.fn()
  };
});

describe('useTable', () => {
  let mockFetchApi: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetchApi = vi.fn().mockResolvedValue({
      list: [{ id: 1, name: 'Test' }],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 100,
        totalPages: 5
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default values', () => {
    const { loading, data, pagination, sort } = useTable({
      fetchApi: mockFetchApi,
      immediate: false
    });

    expect(loading.value).toBe(false);
    expect(data.value).toEqual([]);
    expect(pagination.page).toBe(1);
    expect(pagination.pageSize).toBe(20);
    expect(pagination.total).toBe(0);
    expect(sort.prop).toBe(null);
    expect(sort.order).toBe(null);
  });

  it('uses custom default page size', () => {
    const { pagination } = useTable({
      fetchApi: mockFetchApi,
      defaultPageSize: 50,
      immediate: false
    });

    expect(pagination.pageSize).toBe(50);
  });

  it('fetches data immediately when immediate is true', async () => {
    useTable({
      fetchApi: mockFetchApi,
      immediate: true
    });

    await nextTick();
    expect(mockFetchApi).toHaveBeenCalled();
  });

  it('does not fetch data when immediate is false', async () => {
    useTable({
      fetchApi: mockFetchApi,
      immediate: false
    });

    await nextTick();
    expect(mockFetchApi).not.toHaveBeenCalled();
  });

  it('fetchData updates data and pagination', async () => {
    const { fetchData, data, pagination } = useTable({
      fetchApi: mockFetchApi,
      immediate: false
    });

    await fetchData();

    expect(data.value).toEqual([{ id: 1, name: 'Test' }]);
    expect(pagination.total).toBe(100);
    expect(pagination.totalPages).toBe(5);
  });

  it('handlePageChange updates page', () => {
    const { handlePageChange, pagination } = useTable({
      fetchApi: mockFetchApi,
      immediate: false
    });

    handlePageChange(3);
    expect(pagination.page).toBe(3);
  });

  it('handleSizeChange updates pageSize and resets page to 1', () => {
    const { handlePageChange, handleSizeChange, pagination } = useTable({
      fetchApi: mockFetchApi,
      immediate: false
    });

    handlePageChange(3);
    expect(pagination.page).toBe(3);

    handleSizeChange(50);
    expect(pagination.pageSize).toBe(50);
    expect(pagination.page).toBe(1);
  });

  it('handleSortChange updates sort and resets page to 1', () => {
    const { handlePageChange, handleSortChange, pagination, sort } = useTable({
      fetchApi: mockFetchApi,
      immediate: false
    });

    handlePageChange(3);

    handleSortChange({ prop: 'name', order: 'ascending' });

    expect(sort.prop).toBe('name');
    expect(sort.order).toBe('ascending');
    expect(pagination.page).toBe(1);
  });

  it('reset clears all state', async () => {
    const { fetchData, reset, data, pagination, sort, handleSortChange, handlePageChange } = useTable({
      fetchApi: mockFetchApi,
      immediate: false
    });

    await fetchData();
    handlePageChange(3);
    handleSortChange({ prop: 'name', order: 'ascending' });

    reset();

    expect(data.value).toEqual([]);
    expect(pagination.page).toBe(1);
    expect(pagination.pageSize).toBe(20);
    expect(pagination.total).toBe(0);
    expect(pagination.totalPages).toBe(0);
    expect(sort.prop).toBe(null);
    expect(sort.order).toBe(null);
  });

  it('fetchData includes sort params when set', async () => {
    const { fetchData, handleSortChange } = useTable({
      fetchApi: mockFetchApi,
      immediate: false
    });

    handleSortChange({ prop: 'createdAt', order: 'descending' });
    await fetchData();

    expect(mockFetchApi).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
    );
  });

  it('fetchData filters out empty values', async () => {
    const { fetchData } = useTable({
      fetchApi: mockFetchApi,
      immediate: false
    });

    await fetchData({ name: 'test', empty: '', nullable: null });

    expect(mockFetchApi).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test'
      })
    );

    const callArgs = mockFetchApi.mock.calls[0][0];
    expect(callArgs.empty).toBeUndefined();
    expect(callArgs.nullable).toBeUndefined();
  });

  it('refresh calls fetchData with provided params', async () => {
    const { refresh } = useTable({
      fetchApi: mockFetchApi,
      immediate: false
    });

    await refresh({ status: 'active' });

    expect(mockFetchApi).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active'
      })
    );
  });
});
