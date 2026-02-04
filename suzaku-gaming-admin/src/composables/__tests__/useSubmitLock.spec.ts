// src/composables/__tests__/useSubmitLock.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSubmitLock } from '../useSubmitLock';

// Mock Element Plus ElMessage
vi.mock('element-plus', () => ({
  ElMessage: {
    warning: vi.fn()
  }
}));

import { ElMessage } from 'element-plus';

describe('useSubmitLock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with unlocked state', () => {
    const { isLocked } = useSubmitLock();
    expect(isLocked.value).toBe(false);
  });

  it('lock sets isLocked to true', () => {
    const { isLocked, lock } = useSubmitLock();

    lock();
    expect(isLocked.value).toBe(true);
  });

  it('unlock sets isLocked to false', () => {
    const { isLocked, lock, unlock } = useSubmitLock();

    lock();
    expect(isLocked.value).toBe(true);

    unlock();
    expect(isLocked.value).toBe(false);
  });

  it('canSubmit returns true when not locked', () => {
    const { canSubmit } = useSubmitLock();

    // Wait for minInterval to pass
    vi.advanceTimersByTime(3000);

    expect(canSubmit()).toBe(true);
  });

  it('canSubmit returns false when locked and shows warning', () => {
    const { lock, canSubmit } = useSubmitLock();

    lock();
    const result = canSubmit();

    expect(result).toBe(false);
    expect(ElMessage.warning).toHaveBeenCalledWith('正在提交中，请稍候...');
  });

  it('canSubmit returns false when called too frequently', () => {
    const { unlock, canSubmit } = useSubmitLock({ minInterval: 2000 });

    // Simulate a previous submission
    unlock();

    // Try to submit immediately
    vi.advanceTimersByTime(500);
    const result = canSubmit();

    expect(result).toBe(false);
    expect(ElMessage.warning).toHaveBeenCalledWith('操作太频繁，请稍后再试');
  });

  it('canSubmit returns true after minInterval passes', () => {
    const { unlock, canSubmit } = useSubmitLock({ minInterval: 2000 });

    unlock();
    vi.advanceTimersByTime(2500);

    expect(canSubmit()).toBe(true);
  });

  it('withLock executes function and locks during execution', async () => {
    const { isLocked, withLock } = useSubmitLock();
    vi.advanceTimersByTime(3000);

    let lockedDuringExecution = false;
    const mockFn = vi.fn().mockImplementation(async () => {
      lockedDuringExecution = isLocked.value;
      return 'result';
    });

    const result = await withLock(mockFn);

    expect(mockFn).toHaveBeenCalled();
    expect(lockedDuringExecution).toBe(true);
    expect(isLocked.value).toBe(false); // Unlocked after completion
    expect(result).toBe('result');
  });

  it('withLock returns null when canSubmit fails', async () => {
    const { lock, withLock } = useSubmitLock();
    lock();

    const mockFn = vi.fn().mockResolvedValue('result');
    const result = await withLock(mockFn);

    expect(mockFn).not.toHaveBeenCalled();
    expect(result).toBe(null);
  });

  it('withLock unlocks even when function throws', async () => {
    const { isLocked, withLock } = useSubmitLock();
    vi.advanceTimersByTime(3000);

    const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));

    await expect(withLock(mockFn)).rejects.toThrow('Test error');
    expect(isLocked.value).toBe(false);
  });

  it('uses custom error message', () => {
    const { lock, canSubmit } = useSubmitLock({
      errorMessage: '自定义提示'
    });

    lock();
    canSubmit();

    expect(ElMessage.warning).toHaveBeenCalledWith('自定义提示');
  });

  it('uses custom minInterval', () => {
    const { unlock, canSubmit } = useSubmitLock({ minInterval: 5000 });

    unlock();
    vi.advanceTimersByTime(4000);

    expect(canSubmit()).toBe(false);

    vi.advanceTimersByTime(2000);
    expect(canSubmit()).toBe(true);
  });
});
