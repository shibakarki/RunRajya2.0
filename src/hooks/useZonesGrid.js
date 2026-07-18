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
        // If local cache is empty, corrupted, or has fewer than 4,000 of the 5,212 cells,
        // bypass the cache and fetch a fresh complete copy from Supabase to repair it.
        if (cachedZones && cachedZones.length >= 4000) {
          setGrid(cachedZones);
          setLoading(false);
          return;
        }

        console.log(`Cache missing or incomplete (${cachedZones.length} cells). Fetching fresh grid from Supabase...`);

        // Fetch complete active coordinates from database
        const { data: remoteZones, error: fetchError } = await supabase
          .from('zones')
          .select('id, boundary, owner_id, faction_id, captured_at');

        if (fetchError) throw fetchError;

        if (remoteZones && remoteZones.length > 0) {
          // Open fresh readwrite transaction to overwrite and repair local cache
          const writeTx = db.transaction('zones_grid', 'readwrite');
          const writeStore = writeTx.objectStore('zones_grid');
          
          // Clear any corrupt/old rows first
          writeStore.clear();

          remoteZones.forEach((zone) => {
            writeStore.put(zone);
          });
          setGrid(remoteZones);
        }
      } catch (err) {
        console.error('Failed to initialize zones grid:', err);
        setError(err.message || 'Error loading zones layout.');
      } {
        setLoading(false);
      }
    }

    loadGrid();
  }, []);

  return { grid, loading, error };
}