import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Helper to calculate approximate distance in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * useZonesGrid – dynamically loads local grid cells in real-time.
 * Bypasses local IndexedDB caching and fetches active adjacent zones on-demand.
 * 
 * @param {Object} position - Active GPS coordinates { lat, lng }
 */
export function useZonesGrid(position) {
  const [grid, setGrid] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track the last position used to query the database to prevent spamming
  const lastQueryPosRef = useRef(null);

  useEffect(() => {
    if (!position || !position.lat || !position.lng) {
      return;
    }

    // Movement Throttle Check:
    // Only fetch new cells if the user has moved more than 200m from their last queried location
    if (lastQueryPosRef.current) {
      const distanceMoved = getDistanceMeters(
        lastQueryPosRef.current.lat,
        lastQueryPosRef.current.lng,
        position.lat,
        position.lng
      );
      if (distanceMoved < 200) {
        return; // Skip query if movement is minor
      }
    }

    async function loadLocalGrid() {
      try {
        setLoading(true);
        setError(null);

        // Bounding Box Range: 0.02 degrees latitude/longitude represents ~2.2km radius
        const rangeDegrees = 0.02;

        // Call our Supabase RPC function to fetch only local adjacent zones
        const { data: localZones, error: fetchError } = await supabase.rpc(
          'get_local_zones',
          {
            user_lat: position.lat,
            user_lng: position.lng,
            range_deg: rangeDegrees
          }
        );

        if (fetchError) throw fetchError;

        setGrid(localZones || []);
        lastQueryPosRef.current = position; // Lock new position reference
      } catch (err) {
        console.error('Failed to load local zones from database:', err);
        setError(err.message || 'Error loading local zones.');
      } finally {
        setLoading(false);
      }
    }

    loadLocalGrid();
  }, [position]);

  return { grid, loading, error };
}