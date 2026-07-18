import React, { createContext, useState, useEffect, useRef } from 'react';
import { useCalorieCounter } from '../hooks/useCalorieCounter';

export const SessionContext = createContext(null);

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function SessionProvider({ children }) {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);

  const trackerIntervalRef = useRef(null);

  // Calculates metric parameters dynamically via the calorie counter hook
  const { calories } = useCalorieCounter(distance, duration);

  // Hot recovery on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('run_session_hot_recovery');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSessionId(parsed.id);
        setDistance(parsed.distance);
        setDuration(parsed.duration);
        setSessionActive(true);
      } catch (e) {
        console.warn('Could not restore session state:', e);
      }
    }
  }, []);

  // Sync state to localStorage to prevent data loss on crashes
  useEffect(() => {
    if (sessionActive && sessionId) {
      localStorage.setItem('run_session_hot_recovery', JSON.stringify({
        id: sessionId,
        distance,
        duration
      }));
    } else {
      localStorage.removeItem('run_session_hot_recovery');
    }
  }, [sessionActive, sessionId, distance, duration]);

  // Global background tick loop
  useEffect(() => {
    if (sessionActive) {
      trackerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (trackerIntervalRef.current) {
        clearInterval(trackerIntervalRef.current);
        trackerIntervalRef.current = null;
      }
    }
    return () => {
      if (trackerIntervalRef.current) clearInterval(trackerIntervalRef.current);
    };
  }, [sessionActive]);

  const startSession = () => {
    const nextUUID = generateUUID();
    setSessionId(nextUUID);
    setDuration(0);
    setDistance(0);
    setSessionActive(true);
  };

  const endSession = () => {
    setSessionActive(false);
    
    // Queue final session telemetry stats into IndexedDB traces sync queue
    try {
      const request = indexedDB.open('RunRajyaOfflineDB', 2);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('traces', 'readwrite');
        const store = tx.objectStore('traces');
        
        store.add({
          session_id: sessionId,
          distance_m: distance,
          calories_kcal: calories,
          duration_s: duration,
          timestamp: new Date().toISOString(),
          status: 'ended',
          synced: false
        });
      };
    } catch (e) {
      console.error('Could not queue session tracing stats:', e);
    }

    setSessionId(null);
  };

  const addTrackedDistance = (meters) => {
    if (sessionActive) {
      setDistance((prev) => prev + meters);
    }
  };

  return (
    <SessionContext.Provider value={{
      sessionActive,
      sessionId,
      duration,
      distance,
      calories,
      startSession,
      endSession,
      addTrackedDistance
    }}>
      {children}
    </SessionContext.Provider>
  );
}