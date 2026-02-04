// src/composables/useSubmitLock.ts
import { ref } from "vue";
import { ElMessage } from "element-plus";

interface UseSubmitLockOptions {
  minInterval?: number;
  errorMessage?: string;
}

export function useSubmitLock(options: UseSubmitLockOptions = {}) {
  const { minInterval = 2000, errorMessage = "正在提交中，请稍候..." } = options;

  const isLocked = ref(false);
  const lastSubmitTime = ref(0);

  const lock = () => {
    isLocked.value = true;
  };

  const unlock = () => {
    isLocked.value = false;
    lastSubmitTime.value = Date.now();
  };

  const canSubmit = () => {
    if (isLocked.value) {
      ElMessage.warning(errorMessage);
      return false;
    }

    const now = Date.now();
    if (now - lastSubmitTime.value < minInterval) {
      ElMessage.warning("操作太频繁，请稍后再试");
      return false;
    }

    return true;
  };

  const withLock = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    if (!canSubmit()) {
      return null;
    }

    lock();
    try {
      const result = await fn();
      return result;
    } finally {
      unlock();
    }
  };

  return {
    isLocked,
    lock,
    unlock,
    canSubmit,
    withLock
  };
}
