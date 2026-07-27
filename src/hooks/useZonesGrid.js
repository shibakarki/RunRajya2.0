import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { openDB } from '../lib/offlineDb';

const FALLBACK_CENTER = { lat: 27.5291, lng: 83.447 }; 

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
 * useZonesGrid – dynamically loads local grids and global claimed sectors.
 */
export function useZonesGrid(position) {
  const [grid, setGrid] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lastQueryPosRef = useRef(null);

  useEffect(() => {
    const activePosition = position && position.lat && position.lng 
      ? position 
      : FALLBACK_CENTER;

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
        const db = await openDB();
        
        const cachedZones = await new Promise((resolve) => {
          const tx = db.transaction('zones_grid', 'readonly');
          const store = tx.objectStore('zones_grid');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });

        if (cachedZones && cachedZones.length >= 4000) {
          setGrid(cachedZones);
          setLoading(false);
          return;
        }

        console.log(`Cache incomplete (${cachedZones.length} cells). Fetching local & global sectors...`);

        // 1. Fetch adjacent zones based on player position (Batch of 100 max)
        const rangeDegrees = 0.02;
        const { data: localZones, error: localError } = await supabase.rpc(
          'get_local_zones',
          {
            user_lat: activePosition.lat,
            user_lng: activePosition.lng,
            range_deg: rangeDegrees
          }
        );

        if (localError) throw localError;

        // 2. Fetch ALL globally claimed/contested zones in the district (where owner_id is NOT null)
        const { data: globalClaims, error: claimsError } = await supabase
          .from('zones')
          .select('id, boundary, owner_id, faction_id, captured_at')
          .not('owner_id', 'is', null);

        if (claimsError) throw claimsError;

        // 3. Combine both lists and remove duplicate IDs
        const combinedZones = [...(localZones || [])];
        const localIds = new Set(combinedZones.map(z => z.id));

        (globalClaims || []).forEach((zone) => {
          if (!localIds.has(zone.id)) {
            combinedZones.push(zone);
          }
        });

        // 4. Overwrite and repair local cache
        if (combinedZones.length > 0) {
          const writeTx = db.transaction('zones_grid', 'readwrite');
          const writeStore = writeTx.objectStore('zones_grid');
          writeStore.clear();

          combinedZones.forEach((zone) => {
            writeStore.put(zone);
          });
          setGrid(combinedZones);
        }
      } catch (err) {
        console.error('Failed to initialize zones grid:', err);
        setError(err.message || 'Error loading zones layout.');
      } finally {
        setLoading(false);
      }
    }

    loadLocalGrid();
  }, [position]);

  return { grid, loading, error };
}