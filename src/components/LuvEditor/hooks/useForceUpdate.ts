// hooks/useForceUpdate.ts - 强制更新 hook

import { useState, useCallback } from 'react';

/**
 * 强制更新 hook
 */
export const useForceUpdate = () => {
  const [, setValue] = useState(0);
  
  return useCallback(() => {
    setValue((prev) => prev + 1);
  }, []);
};
