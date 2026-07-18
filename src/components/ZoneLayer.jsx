import React from 'react';
import { Polygon } from 'react-leaflet';

const FACTION_COLORS = {
  1: '#e2554f', // Red faction (Siddharth / standard fallback)
  2: '#3f8cf2', // Blue faction
  3: '#22e6b0', // Green faction
  4: '#f2a93c', // Yellow faction
  5: '#9b6fe8', // Purple faction
};

const UNOWNED_COLOR = '#546069'; 

/**
 * ZoneLayer – renders captured/uncaptured cells over MapCanvas.
 * Optimized to only render a 5x5 grid (25 closest zones) centered around the player
 * to ensure high-performance rendering on mobile devices.
 */
export default function ZoneLayer({ 
  zones = [], 
  ownedZones = {}, 
  position, 
  currentUserId,
  currentUserFactionId // Added prop to dynamicize capture colors
}) {
  if (!position) {
    return null;
  }

  const getDistanceSquared = (zone) => {
    try {
      const coords = typeof zone.boundary === 'string' ? JSON.parse(zone.boundary) : zone.boundary;
      if (!Array.isArray(coords) || coords.length === 0) return Infinity;
      
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

      const dLat = centerLat - position.lat;
      const dLng = centerLng - position.lng;
      return dLat * dLat + dLng * dLng;
    } catch (e) {
      return Infinity;
    }
  };

  const localGrid = [...zones]
    .sort((a, b) => getDistanceSquared(a) - getDistanceSquared(b))
    .slice(0, 25);

  return (
    <>
      {localGrid.map((zone) => {
        const coords = typeof zone.boundary === 'string' ? JSON.parse(zone.boundary) : zone.boundary;
        if (!Array.isArray(coords)) return null;

        const positions = coords.map((p) => {
          if (Array.isArray(p)) {
            return [p[0], p[1]];
          }
          return [p.lat ?? p[0], p.lng ?? p[1]];
        });

        const isMine = !!ownedZones[zone.id] || zone.owner_id === currentUserId;
        const isOwned = isMine || !!zone.owner_id;
        
        // Dynamically resolve active capture color based on your associated faction
        const activeMineColor = currentUserFactionId && FACTION_COLORS[currentUserFactionId]
          ? FACTION_COLORS[currentUserFactionId]
          : '#22e6b0'; // Fallback green if unaligned/loading

        const color = isMine
          ? activeMineColor
          : zone.faction_id
          ? FACTION_COLORS[zone.faction_id] || UNOWNED_COLOR
          : UNOWNED_COLOR;

        return (
          <Polygon
            key={zone.id}
            positions={positions}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: isOwned ? 0.35 : 0.08, 
              weight: 1,                          
            }}
          />
        );
      })}
    </>
  );
}