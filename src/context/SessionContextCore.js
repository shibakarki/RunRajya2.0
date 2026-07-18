import { createContext } from 'react';

// Isolated context anchor to break the Rollup compilation evaluation loop
export const SessionContext = createContext(null);