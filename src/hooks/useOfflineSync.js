import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { openDB } from '../lib/offlineDb'; // Imported central database helper

const FACTION_MAP = {
  'lumbini_guardians': 1,
  'devdaha_dynasty': 2,
  'tilaurakot_sentinels': 3,
  'siddharth_force': 4,
  'manimukunda_warriors': 5,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5
};

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  const performSync = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        setSyncing(false);
        return;
      }

      const db = await openDB(); // Access database safely

      // ==========================================
      // 1. SYNCHRONIZE PENDING TRACES (SESSIONS)
      // ==========================================
      const traceReadTx = db.transaction('traces', 'readonly');
      const traceReadStore = traceReadTx.objectStore('traces');
      
      const unsyncedTraces = await new Promise((res) => {
        const req = traceReadStore.getAll();
        req.onsuccess = () => res(req.result.filter(t => !t.synced));
        req.onerror = () => res([]);
      });

      const succeededTraceIds = [];
      for (const trace of unsyncedTraces) {
        const { error: sessionErr } = await supabase
          .from('sessions')
          .upsert({
            id: trace.session_id,
            user_id: userId, 
            distance_m: trace.distance_m,
            calories: trace.calories_kcal,
            started_at: trace.timestamp, 
            status: trace.status,
            duration_s: trace.duration_s 
          });

        if (!sessionErr) {
          succeededTraceIds.push(trace.id);
        } else {
          console.error('Failed to sync session trace:', sessionErr.message);
        }
      }

      if (succeededTraceIds.length > 0) {
        const traceWriteTx = db.transaction('traces', 'readwrite');
        const traceWriteStore = traceWriteTx.objectStore('traces');
        for (const id of succeededTraceIds) {
          traceWriteStore.delete(id);
        }
      }

      // ==========================================
      // 2. SYNCHRONIZE CAPTURES (ZONES)
      // ==========================================
      const capReadTx = db.transaction('captures', 'readonly');
      const capReadStore = capReadTx.objectStore('captures');

      const unsyncedCaps = await new Promise((res) => {
        const req = capReadStore.getAll();
        req.onsuccess = () => res(req.result.filter(c => !c.synced));
        req.onerror = () => res([]);
      });

      const succeededCapIds = [];
      for (const cap of unsyncedCaps) {
        const { data: serverZone, error: zoneErr } = await supabase
          .from('zones')
          .select('captured_at')
          .eq('id', cap.zone_id)
          .maybeSingle();

        if (!zoneErr) {
          const serverCapturedAt = serverZone?.captured_at ? new Date(serverZone.captured_at).getTime() : 0;
          const localCapturedAt = new Date(cap.captured_at).getTime();

          if (!serverZone?.captured_at || localCapturedAt < serverCapturedAt) {
            const rawFaction = session?.user?.user_metadata?.faction_id;
            const factionId = FACTION_MAP[rawFaction] || Number(rawFaction) || 1;

            const { error: claimErr } = await supabase
              .from('zones')
              .update({
                owner_id: cap.owner_id,
                captured_at: cap.captured_at,
                faction_id: factionId
              })
              .eq('id', cap.zone_id);

            if (!claimErr) {
              const { error: auditErr } = await supabase
                .from('captures')
                .insert({
                  session_id: cap.session_id,
                  zone_id: cap.zone_id,
                  captured_at: cap.captured_at
                });
              
              if (!auditErr) {
                succeededCapIds.push(cap.zone_id);
              } else {
                console.error('Failed to log capture audit:', auditErr.message);
              }
            } else {
              console.error('Failed to update zone claim in database:', claimErr.message);
            }
          } else {
            succeededCapIds.push(cap.zone_id);
          }
        }
      }

      if (succeededCapIds.length > 0) {
        const capWriteTx = db.transaction('captures', 'readwrite');
        const capWriteStore = capWriteTx.objectStore('captures');
        for (const id of succeededCapIds) {
          capWriteStore.delete(id);
        }
      }
    } catch (e) {
      console.error('Synchronization failed:', e);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      performSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (isOnline) {
      performSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline, performSync]);

  return { isOnline, syncing, performSync };
}