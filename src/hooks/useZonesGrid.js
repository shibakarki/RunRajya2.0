import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const FALLBACK_CENTER = { lat: 27.5291, lng: 83.447 }; // Centered near the middle of Rupandehi

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
 * If position is null/acquiring, uses the fallback center to load adjacent grids on load.
 * 
 * @param {Object} position - Active GPS coordinates { lat, lng }
 */
export function useZonesGrid(position) {
  const [grid, setGrid] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lastQueryPosRef = useRef(null);

  useEffect(() => {
    // Falls back to the geographic center of the district if GPS is still acquiring
    const activePosition = position && position.lat && position.lng 
      ? position 
      : FALLBACK_CENTER;

    // Movement Throttle Check
    if (lastQueryPosRef.current) {
      const distanceMoved = getDistanceMeters(
        lastQueryPosRef.current.lat,
        lastQueryPosRef.current.lng,
        activePosition.lat,
        activePosition.lng
      );
      if (distanceMoved < 200) {
        return; 
      }
    }

    async function loadLocalGrid() {
      try {
        setLoading(true);
        setError(null);

        // Bounding Box Range: 0.02 degrees latitude/longitude represents ~2.2km radius
        const rangeDegrees = 0.02;

        const { data: localZones, error: fetchError } = await supabase.rpc(
          'get_local_zones',
          {
            user_lat: activePosition.lat,
            user_lng: activePosition.lng,
            range_deg: rangeDegrees
          }
        );

        if (fetchError) throw fetchError;

        setGrid(localZones || []);
        lastQueryPosRef.current = activePosition; 
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