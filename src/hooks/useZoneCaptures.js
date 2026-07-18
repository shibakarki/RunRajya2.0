import { useState, useCallback } from 'react';

// Ray-casting algorithm to evaluate coordinate inclusion inside polygon bounds
function isPointInPolygon(point, polygon) {
  const x = point.lat;
  const y = point.lng;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat || polygon[i][0];
    const yi = polygon[i].lng || polygon[i][1];
    const xj = polygon[j].lat || polygon[j][0];
    const yj = polygon[j].lng || polygon[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function useZoneCaptures(initialGrid = []) {
  const [ownedZones, setOwnedZones] = useState({});

  // Scans player positioning against boundaries to record territory claims
  const evaluateCapture = useCallback(async (currentPosition, activeGrid, sessionId, currentUserId) => {
    if (!currentPosition || !activeGrid || !sessionId || !currentUserId) return null;

    const matchedZone = activeGrid.find((zone) => 
      isPointInPolygon(currentPosition, zone.boundary)
    );

    if (matchedZone && !ownedZones[matchedZone.id]) {
      const nowISO = new Date().toISOString();

      // Paint territory color instantly in UI
      setOwnedZones((prev) => ({
        ...prev,
        [matchedZone.id]: {
          capturedAt: nowISO,
          synced: false
        }
      }));

      // Queue capture in local IndexedDB store
      try {
        const dbRequest = indexedDB.open('RunRajyaOfflineDB', 2);
        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const tx = db.transaction('captures', 'readwrite');
          const store = tx.objectStore('captures');
          
          store.put({
            zone_id: matchedZone.id,
            session_id: sessionId,
            captured_at: nowISO,
            owner_id: currentUserId,
            synced: false
          });
        };
      } catch (err) {
        console.error('Failed to queue capture inside offline storage:', err);
      }

      return matchedZone;
    }
    return null;
  }, [ownedZones]);

  return { ownedZones, setOwnedZones, evaluateCapture };
}