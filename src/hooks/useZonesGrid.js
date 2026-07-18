import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DB_NAME = 'RunRajyaOfflineDB';
const DB_VERSION = 2;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('zones_grid')) {
        db.createObjectStore('zones_grid', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('traces')) {
        db.createObjectStore('traces', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('captures')) {
        db.createObjectStore('captures', { keyPath: 'zone_id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function useZonesGrid() {
  const [grid, setGrid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadGrid() {
      try {
        setLoading(true);
        const db = await openDB();
        
        const tx = db.transaction('zones_grid', 'readonly');
        const store = tx.objectStore('zones_grid');
        
        const cachedZones = await new Promise((resolve) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });

        // Self-Healing Cache:
        // Ensure cache holds at least 4,000 of the 5,212 generated cells before skipping the download
        if (cachedZones && cachedZones.length >= 4000) {
          setGrid(cachedZones);
          setLoading(false);
          return;
        }

        console.log(`Cache incomplete (${cachedZones.length} cells). Initiating paginated database download...`);

        // Multi-page cursor pagination to bypass Supabase's default 1,000-row selection limit
        let allZones = [];
        let from = 0;
        let to = 999;
        let hasMore = true;

        while (hasMore) {
          const { data: pageData, error: fetchError } = await supabase
            .from('zones')
            .select('id, boundary, owner_id, faction_id, captured_at')
            .range(from, to); // Explicitly request segments of 1,000 rows

          if (fetchError) throw fetchError;

          if (pageData && pageData.length > 0) {
            allZones = [...allZones, ...pageData];
            from += 1000;
            to += 1000;
          } else {
            hasMore = false;
          }
        }

        console.log(`Download finished. Synced ${allZones.length} zones successfully.`);

        if (allZones.length > 0) {
          // Open fresh transaction to repair local IndexedDB cache
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

    loadGrid();
  }, []);

  return { grid, loading, error };
}