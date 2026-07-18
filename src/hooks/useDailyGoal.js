import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * useDailyGoal – tracks cumulative daily physical progress.
 * Dynamically aggregates online Supabase sessions completed today,
 * unsynced offline sessions from IndexedDB, and active session distances.
 * 
 * @param {number} activeSessionDistanceM - Distance in meters of currently running session
 * @param {number} targetDistanceM - Daily distance target in meters (default 5km / 5000m)
 */
export function useDailyGoal(activeSessionDistanceM = 0, targetDistanceM = 5000) {
  const auth = useAuth();
  const userId = auth?.session?.user?.id;

  const [completedTodayM, setCompletedTodayM] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCompletedTodayM(0);
      setLoading(false);
      return;
    }

    async function calculateDailyDistance() {
      setLoading(true);
      let dbTotalM = 0;
      let localTotalM = 0;

      // Calculate today's midnight in local system time
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStartISO = today.toISOString();

      try {
        // 1. Fetch completed sessions from Supabase logged today
        const { data: remoteSessions, error: dbError } = await supabase
          .from('sessions')
          .select('distance_m')
          .eq('user_id', userId)
          .gte('started_at', todayStartISO);

        if (!dbError && remoteSessions) {
          dbTotalM = remoteSessions.reduce((acc, s) => acc + (Number(s.distance_m) || 0), 0);
        }

        // 2. Fetch completed offline sessions from IndexedDB traces store (RunRajyaOfflineDB v2)
        const dbRequest = indexedDB.open('RunRajyaOfflineDB', 2);
        await new Promise((resolve) => {
          dbRequest.onsuccess = () => {
            const idb = dbRequest.result;
            if (!idb.objectStoreNames.contains('traces')) {
              resolve();
              return;
            }
            const tx = idb.transaction('traces', 'readonly');
            const store = tx.objectStore('traces');
            const req = store.getAll();
            req.onsuccess = () => {
              const localTraces = req.result || [];
              const todayLocalTraces = localTraces.filter((t) => {
                const isToday = new Date(t.timestamp).getTime() >= today.getTime();
                return isToday && !t.synced; // Only sum unsynced items to prevent double-counting
              });
              localTotalM = todayLocalTraces.reduce((acc, t) => acc + (Number(t.distance_m) || 0), 0);
              resolve();
            };
            req.onerror = () => resolve();
          };
          dbRequest.onerror = () => resolve();
        });

        // Set combined completed distance (Online DB + Offline Cache)
        setCompletedTodayM(dbTotalM + localTotalM);
      } catch (err) {
        console.error('Error calculating daily distance statistics:', err);
      } finally {
        setLoading(false);
      }
    }

    calculateDailyDistance();
  }, [userId]);

  // Combine already completed runs with the current active session distance
  const totalDistanceM = completedTodayM + activeSessionDistanceM;
  
  // Calculate relative progress percentage
  const progressPct = targetDistanceM <= 0 ? 0 : (totalDistanceM / targetDistanceM) * 100;

  return {
    progressPct: Math.round(progressPct),
    currentValueKm: Number((totalDistanceM / 1000).toFixed(2)),
    targetValueKm: Number((targetDistanceM / 1000).toFixed(2)),
    loading
  };
}