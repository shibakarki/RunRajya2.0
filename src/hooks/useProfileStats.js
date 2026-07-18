import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useProfileStats(userId) {
  const [stats, setStats] = useState({
    username: '',
    factionId: '',
    dailyTargetM: 5000, // Added default daily target
    totalDistanceM: 0,
    totalCaloriesKcal: 0,
    zonesOwnedCount: 0,
    runsCompletedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function getStats() {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch user bio details (safely using maybeSingle() instead of single())
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('name, faction_id, daily_target_m') // Fetched daily_target_m
          .eq('id', userId)
          .maybeSingle();

        if (profileErr) throw profileErr;

        // 2. Fetch history records (using distance_m)
        const { data: sessions, error: sessionsErr } = await supabase
          .from('sessions')
          .select('distance_m, calories')
          .eq('user_id', userId);

        if (sessionsErr) throw sessionsErr;

        // 3. Fetch current captured count
        const { count, error: countErr } = await supabase
          .from('zones')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', userId);

        if (countErr) throw countErr;

        const distanceSum = (sessions || []).reduce((acc, s) => acc + (Number(s.distance_m) || 0), 0);
        const caloriesSum = (sessions || []).reduce((acc, s) => acc + (Number(s.calories) || 0), 0);

        // Gracefully handle the case where the user profile row does not exist yet
        if (!profile) {
          setStats({
            username: 'Explorer',
            factionId: 1, 
            dailyTargetM: 5000,
            totalDistanceM: distanceSum,
            totalCaloriesKcal: caloriesSum,
            zonesOwnedCount: count || 0,
            runsCompletedCount: sessions?.length || 0
          });
        } else {
          setStats({
            username: profile.name || 'Explorer',
            factionId: profile.faction_id || 1,
            dailyTargetM: profile.daily_target_m || 5000, // Synced target value
            totalDistanceM: distanceSum,
            totalCaloriesKcal: caloriesSum,
            zonesOwnedCount: count || 0,
            runsCompletedCount: sessions?.length || 0
          });
        }
      } catch (err) {
        console.error('Failed to pull user statistics profiles:', err);
        setError(err.message || 'Error processing bio data.');
      } finally {
        setLoading(false);
      }
    }

    getStats();
  }, [userId]);

  return { stats, loading, error };
}