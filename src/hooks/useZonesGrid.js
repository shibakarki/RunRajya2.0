import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { openDB } from '../lib/offlineDb'; // Imported central database helper

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
        const db = await openDB(); // Access database safely
        
        const tx = db.transaction('zones_grid', 'readonly');
        const store = tx.objectStore('zones_grid');
        
        const cachedZones = await new Promise((resolve) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });

        // Skip downloading if cache holds complete boundaries
        if (cachedZones && cachedZones.length >= 4000) {
          setGrid(cachedZones);
          setLoading(false);
          return;
        }

        console.log(`Cache incomplete (${cachedZones.length} cells). Fetching fresh grid from Supabase...`);

        // Multi-page cursor pagination to bypass Supabase's default 1,000-row selection limit
        let allZones = [];
        let from = 0;
        let to = 999;
        let hasMore = true;

        while (hasMore) {
          const { data: pageData, error: fetchError } = await supabase
            .from('zones')
            .select('id, boundary, owner_id, faction_id, captured_at')
            .range(from, to); 

          if (fetchError) throw fetchError;

          if (pageData && pageData.length > 0) {
            allZones = [...allZones, ...pageData];
            from += 1000;
            to += 1000;
          } else {
            hasMore = false;
          }
        }

        if (allZones.length > 0) {
          const writeTx = db.transaction('zones_grid', 'readwrite');
          const writeStore = writeTx.objectStore('zones_grid');
          
          writeStore.clear();

          allZones.forEach((zone) => {
            writeStore.put(zone);
          });
          setGrid(allZones);
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