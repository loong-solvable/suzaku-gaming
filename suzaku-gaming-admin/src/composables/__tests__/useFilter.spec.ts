// src/composables/__tests__/useFilter.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { useFilter } from '../useFilter';
import { isReactive } from 'vue';

describe('useFilter', () => {
  const defaultValues = {
    name: '',
    status: 'all',
    page: 1
  };

  it('initializes filterValues with default values', () => {
    const { filterValues } = useFilter({
      defaultValues
    });

    expect(filterValues.name).toBe('');
    expect(filterValues.status).toBe('all');
    expect(filterValues.page).toBe(1);
  });

  it('creates reactive filterValues', () => {
    const { filterValues } = useFilter({
      defaultValues
    });

    expect(isReactive(filterValues)).toBe(true);
  });

  it('deep copies default values to avoid mutation', () => {
    const original = { nested: { value: 1 } };
    const { filterValues } = useFilter({
      defaultValues: original
    });

    // Modify filterValues
    (filterValues as any).nested.value = 2;

    // Original should not be affected
    expect(original.nested.value).toBe(1);
  });

  it('handleSearch calls onSearch with current values', () => {
    const onSearch = vi.fn();
    const { filterValues, handleSearch } = useFilter({
      defaultValues,
      onSearch
    });

    filterValues.name = 'test';
    filterValues.status = 'active';

    handleSearch();

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test',
        status: 'active',
        page: 1
      })
    );
  });

  it('handleReset resets values to defaults', () => {
    const { filterValues, handleReset } = useFilter({
      defaultValues
    });

    // Modify values
    filterValues.name = 'test';
    filterValues.status = 'inactive';
    filterValues.page = 5;

    // Reset
    handleReset();

    expect(filterValues.name).toBe('');
    expect(filterValues.status).toBe('all');
    expect(filterValues.page).toBe(1);
  });

  it('handleReset calls onReset callback', () => {
    const onReset = vi.fn();
    const { handleReset } = useFilter({
      defaultValues,
      onReset
    });

    handleReset();

    expect(onReset).toHaveBeenCalled();
  });

  it('getFilterValues returns non-reactive copy', () => {
    const { filterValues, getFilterValues } = useFilter({
      defaultValues
    });

    filterValues.name = 'test';

    const values = getFilterValues();

    // Modify returned values
    values.name = 'modified';

    // Original should not be affected
    expect(filterValues.name).toBe('test');
  });

  it('setFilterValue updates a single filter value', () => {
    const { filterValues, setFilterValue } = useFilter({
      defaultValues
    });

    setFilterValue('name', 'new name');
    setFilterValue('status', 'pending');

    expect(filterValues.name).toBe('new name');
    expect(filterValues.status).toBe('pending');
    expect(filterValues.page).toBe(1); // unchanged
  });

  it('works without callbacks', () => {
    const { handleSearch, handleReset } = useFilter({
      defaultValues
    });

    // Should not throw
    expect(() => handleSearch()).not.toThrow();
    expect(() => handleReset()).not.toThrow();
  });
});
