import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook for debounced autosave functionality.
 * Calls `saveFn` after `delay` ms of inactivity.
 */
export function useAutosave(saveFn: (value: string) => Promise<boolean>, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValueRef = useRef<string>('');
  const isSavingRef = useRef(false);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const trigger = useCallback((value: string) => {
    latestValueRef.current = value;
    cancel();
    timerRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      await saveFn(latestValueRef.current);
      isSavingRef.current = false;
    }, delay);
  }, [saveFn, delay, cancel]);

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return { trigger, cancel };
}
