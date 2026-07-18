import { useContext } from 'react';
import { SessionContext } from '../context/SessionContext';

/**
 * useRunSession – consumes the global session tracking parameters.
 * Keeps running timers and distances synchronized across active page routing.
 */
export function useRunSession() {
  const context = useContext(SessionContext);
  
  if (!context) {
    throw new Error('useRunSession must be used within a SessionProvider wrapper.');
  }
  
  return context;
}