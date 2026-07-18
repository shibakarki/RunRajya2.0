import { useState, useCallback } from 'react';

// Ray-casting algorithm to evaluate coordinate inclusion inside polygon bounds
function isPointInPolygon(point, polygon) {
  const x = point.lat;
  const y = point.lng;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat ?? polygon[i][0];
    const yi = polygon[i].lng ?? polygon[i][1];
    const xj = polygon[j].lat ?? polygon[j][0];
    const yj = polygon[j].lng ?? polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Distance calculation using the Haversine formula
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

export function useZoneCaptures() {
  const [ownedZones, setOwnedZones] = useState({});

  const evaluateCapture = useCallback(async (currentPosition, activeGrid, sessionId, currentUserId) => {
    if (!currentPosition || !activeGrid || activeGrid.length === 0 || !sessionId || !currentUserId) return null;

    let matchedZone = null;

    // A. First Check: Standard ray-casting polygon math
    matchedZone = activeGrid.find((zone) => 
      isPointInPolygon(currentPosition, zone.boundary)
    );

    // B. Second Check (Gauranteed Fallback): Find closest cell center and capture if within 300m
    if (!matchedZone) {
      let closestZone = null;
      let minDistance = Infinity;

      activeGrid.forEach((zone) => {
        if (!zone.boundary || zone.boundary.length === 0) return;
        
        // Calculate cell center
        let sumLat = 0, sumLng = 0;
        zone.boundary.forEach((p) => {
          sumLat += p.lat ?? p[0];
          sumLng += p.lng ?? p[1];
        });
        const centerLat = sumLat / zone.boundary.length;
        const centerLng = sumLng / zone.boundary.length;

        const dist = getDistanceMeters(currentPosition.lat, currentPosition.lng, centerLat, centerLng);
        if (dist < minDistance) {
          minDistance = dist;
          closestZone = zone;
        }
      });

      // If the player is within 300m of the nearest cell center, trigger a capture
      if (closestZone && minDistance <= 300) {
        matchedZone = closestZone;
      }
    }

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