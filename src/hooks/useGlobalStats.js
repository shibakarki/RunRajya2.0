import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useGlobalStats() {
  const [globalStats, setGlobalStats] = useState({
    activePlayersCount: 0,
    totalCombinedDistanceM: 0,
    totalZonesCapturedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadGlobalStats() {
      setLoading(true);
      setError(null);

      try {
        // 1. Retrieve total active player records
        const { count: playerCount, error: playerErr } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (playerErr) throw playerErr;

        // 2. Calculate aggregate session statistics (using distance_m)
        const { data: sessions, error: sessionErr } = await supabase
          .from('sessions')
          .select('distance_m'); // Corrected column name

        if (sessionErr) throw sessionErr;

        const sumDistance = (sessions || []).reduce((acc, s) => acc + (s.distance_m || 0), 0);

        // 3. Calculate total captured map cells
        const { count: capturedCount, error: capturedErr } = await supabase
          .from('zones')
          .select('*', { count: 'exact', head: true })
          .not('owner_id', 'is', null);

        if (capturedErr) throw capturedErr;

        setGlobalStats({
          activePlayersCount: playerCount || 0,
          totalCombinedDistanceM: sumDistance,
          totalZonesCapturedCount: capturedCount || 0
        });
      } catch (err) {
        console.error('Failed to retrieve platform global statistics:', err);
        setError(err.message || 'Error loading platform stats.');
      } finally {
        setLoading(false);
      }
    }

    loadGlobalStats();
  }, []);

  return { globalStats, loading, error };
}