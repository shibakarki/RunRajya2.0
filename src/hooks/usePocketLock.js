import { useState, useCallback } from 'react';

/**
 * usePocketLock – basic state handling hook for field navigation lock overlays.
 */
export function usePocketLock() {
  const [isLocked, setIsLocked] = useState(false);

  const lockScreen = useCallback(() => {
    setIsLocked(true);
  }, []);

  const unlockScreen = useCallback(() => {
    setIsLocked(false);
  }, []);

  return {
    isLocked,
    lockScreen,
    unlockScreen
  };
}