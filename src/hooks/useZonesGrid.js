import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DB_NAME = 'RunRajyaOfflineDB';
const DB_VERSION = 2;

// Utility to open the local DB and configure its stores
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
        
        // 1. Attempt to fetch from local IndexedDB cache
        const tx = db.transaction('zones_grid', 'readonly');
        const store = tx.objectStoreName ? tx.objectStore('zones_grid') : tx.objectStore('zones_grid');
        
        const cachedZones = await new Promise((resolve) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve([]);
        });

        if (cachedZones && cachedZones.length > 0) {
          setGrid(cachedZones);
          setLoading(false);
          return;
        }

        // 2. Fetch from Supabase if IndexedDB is empty
        const { data: remoteZones, error: fetchError } = await supabase
          .from('zones')
          .select('id, boundary, owner_id, faction_id, captured_at');

        if (fetchError) throw fetchError;

        // 3. Cache the fetched data into IndexedDB
        if (remoteZones && remoteZones.length > 0) {
          const writeTx = db.transaction('zones_grid', 'readwrite');
          const writeStore = writeTx.objectStore('zones_grid');
          remoteZones.forEach((zone) => {
            writeStore.put(zone);
          });
          setGrid(remoteZones);
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