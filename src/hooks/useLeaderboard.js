import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useLeaderboard(scope = 'rupandehi') {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRankings() {
      setLoading(true);
      setError(null);

      // Local District Rankings (Rupandehi)
      if (scope === 'rupandehi') {
        try {
          const { data, error: queryError } = await supabase
            .from('profiles')
            .select(`
              id,
              name,
              faction_id,
              sessions ( distance_m ) -- Corrected column name
            `);

          if (queryError) throw queryError;

          // Aggregate distances client-side for general leaderboard sorting
          const calculatedRanks = data.map((profile) => {
            const totalMeters = (profile.sessions || []).reduce(
              (acc, s) => acc + (s.distance_m || 0), // Corrected column name
              0
            );
            return {
              userId: profile.id,
              username: profile.name || 'Explorer',
              factionId: profile.faction_id,
              distanceKm: parseFloat((totalMeters / 1000).toFixed(2))
            };
          }).sort((a, b) => b.distanceKm - a.distanceKm);

          setRankings(calculatedRanks);
        } catch (err) {
          console.error('Failed to load local leaderboard:', err);
          setError(err.message || 'Error pulling leaderboard indexes.');
        } finally {
          setLoading(false);
        }
      } 
      
      // Global Rankings
      else if (scope === 'global') {
        setRankings([]); 
        setLoading(false);
      }
    }

    fetchRankings();
  }, [scope]);

  return { rankings, loading, error, isGlobalComingSoon: scope === 'global' };
}