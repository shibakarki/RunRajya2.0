import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase'; // Imported to enable instant database writes

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

    // B. Second Check (Guaranteed Fallback): Find closest cell center and capture if within 300m
    if (!matchedZone) {
      let closestZone = null;
      let minDistance = Infinity;

      activeGrid.forEach((zone) => {
        if (!zone.boundary || zone.boundary.length === 0) return;
        
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
      let synced = false;

      // 1. Optimistically paint the territory green in the local UI immediately
      setOwnedZones((prev) => ({
        ...prev,
        [matchedZone.id]: {
          capturedAt: nowISO,
          synced: false
        }
      }));

      // 2. If online, attempt to save directly and instantly to Supabase
      if (navigator.onLine) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const factionId = session?.user?.user_metadata?.faction_id || 1;

          // A. Update the zone ownership details instantly
          const { error: claimErr } = await supabase
            .from('zones')
            .update({
              owner_id: currentUserId,
              captured_at: nowISO,
              faction_id: factionId
            })
            .eq('id', matchedZone.id);

          if (!claimErr) {
            // B. Log the audit trail record instantly
            const { error: auditErr } = await supabase
              .from('captures')
              .insert({
                session_id: sessionId,
                zone_id: matchedZone.id,
                captured_at: nowISO
              });

            if (!auditErr) {
              synced = true;
              
              // Update optimistic UI state to indicate successful database sync
              setOwnedZones((prev) => ({
                ...prev,
                [matchedZone.id]: {
                  capturedAt: nowISO,
                  synced: true
                }
              }));
            }
          }
        } catch (e) {
          console.warn('Instant database write failed. Falling back to offline queue:', e);
        }
      }

      // 3. Always queue/update the capture state in local IndexedDB (RunRajyaOfflineDB v2)
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
            synced: synced // Mapped dynamically based on direct-sync outcome
          });
        };
      } catch (err) {
        console.error('Failed to update local IndexedDB cache:', err);
      }

      return matchedZone;
    }
    return null;
  }, [ownedZones]);

  return { ownedZones, setOwnedZones, evaluateCapture };
}