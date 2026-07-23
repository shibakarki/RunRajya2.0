import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { openDB } from '../lib/offlineDb'; // Imported central database helper

const FACTION_MAP = {
  'lumbini_guardians': 1,
  'devdaha_dynasty': 2,
  'tilaurakot_sentinels': 3,
  'siddharth_force': 4,
  'manimukunda_warriors': 5,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5
};

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
    if (!currentPosition || !activeGrid || activeGrid.length === 0 || !sessionId || !currentUserId) {
      return null;
    }

    let matchedZone = null;

    const parsedGrid = activeGrid.map(zone => {
      try {
        const coords = typeof zone.boundary === 'string' ? JSON.parse(zone.boundary) : zone.boundary;
        return { ...zone, parsedBoundary: coords };
      } catch (e) {
        return { ...zone, parsedBoundary: [] };
      }
    });

    matchedZone = parsedGrid.find((zone) => 
      Array.isArray(zone.parsedBoundary) && zone.parsedBoundary.length > 0 && 
      isPointInPolygon(currentPosition, zone.parsedBoundary)
    );

    if (!matchedZone) {
      let closestZone = null;
      let minDistance = Infinity;

      parsedGrid.forEach((zone) => {
        const coords = zone.parsedBoundary;
        if (!Array.isArray(coords) || coords.length === 0) return;
        
        let sumLat = 0, sumLng = 0;
        coords.forEach((p) => {
          if (p && typeof p === 'object') {
            const latVal = p.lat !== undefined ? p.lat : p[0];
            const lngVal = p.lng !== undefined ? p.lng : p[1];
            sumLat += Number(latVal) || 0;
            sumLng += Number(lngVal) || 0;
          } else if (Array.isArray(p)) {
            sumLat += Number(p[0]) || 0;
            sumLng += Number(p[1]) || 0;
          }
        });
        const centerLat = sumLat / coords.length;
        const centerLng = sumLng / coords.length;

        const dist = getDistanceMeters(currentPosition.lat, currentPosition.lng, centerLat, centerLng);
        if (dist < minDistance) {
          minDistance = dist;
          closestZone = zone;
        }
      });

      if (closestZone && minDistance <= 400) {
        matchedZone = closestZone;
      }
    }

    if (matchedZone && !ownedZones[matchedZone.id]) {
      const nowISO = new Date().toISOString();
      let synced = false;

      setOwnedZones((prev) => ({
        ...prev,
        [matchedZone.id]: {
          capturedAt: nowISO,
          synced: false
        }
      }));

      if (navigator.onLine) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const rawFaction = session?.user?.user_metadata?.faction_id;
          const factionId = FACTION_MAP[rawFaction] || Number(rawFaction) || 1;

          const { error: claimErr } = await supabase
            .from('zones')
            .update({
              owner_id: currentUserId,
              captured_at: nowISO,
              faction_id: factionId
            })
            .eq('id', matchedZone.id);

          if (!claimErr) {
            const { error: auditErr } = await supabase
              .from('captures')
              .insert({
                session_id: sessionId,
                zone_id: matchedZone.id,
                captured_at: nowISO
              });

            if (!auditErr) {
              synced = true;
              
              setOwnedZones((prev) => ({
                ...prev,
                [matchedZone.id]: {
                  capturedAt: nowISO,
                  synced: true
                }
              }));
            }
          } else {
            console.error('Database write error during capture claim:', claimErr.message);
          }
        } catch (e) {
          console.warn('Instant database write failed. Falling back to offline queue:', e);
        }
      }

      try {
        const db = await openDB(); // Access database safely
        const tx = db.transaction('captures', 'readwrite');
        const store = tx.objectStore('captures');
        
        store.put({
          zone_id: matchedZone.id,
          session_id: sessionId,
          captured_at: nowISO,
          owner_id: currentUserId,
          synced: synced 
        });
      } catch (err) {
        console.error('Failed to update local IndexedDB cache:', err);
      }

      return matchedZone;
    }
    return null;
  }, [ownedZones]);

  return { ownedZones, setOwnedZones, evaluateCapture };
}