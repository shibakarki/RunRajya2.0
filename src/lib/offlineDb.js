const DB_NAME = 'RunRajyaOfflineDB';
const DB_VERSION = 3; // Upgraded to version 3 to force browser upgrades and create missing stores

/**
 * Centralized IndexedDB Connection Helper.
 * Handles database versioning upgrades and guarantees all object stores
 * are initialized before standard read/write requests commence.
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      
      // Upgrade database schema safely
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