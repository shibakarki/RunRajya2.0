import { useContext } from 'react';
import { SessionContext } from '../context/SessionContextCore'; // Imported directly from core to break circular dependencies

/**
 * useRunSession – consumes the global session tracking context.
 */
export function useRunSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useRunSession must be used within a SessionProvider.');
  }
  return context;
}