import React from 'react';
import { Polygon } from 'react-leaflet';

const FACTION_COLORS = {
  1: '#e2554f', // Red faction
  2: '#3f8cf2', // Blue faction
  3: '#22e6b0', // Green faction
  4: '#f2a93c', // Yellow faction
  5: '#9b6fe8', // Purple faction
};

const UNOWNED_COLOR = '#546069'; 
const MINE_COLOR = '#22e6b0';    

/**
 * ZoneLayer – renders captured/uncaptured cells over MapCanvas.
 * Optimized to only render a 5x5 grid (25 closest zones) centered around the player
 * to ensure high-performance rendering on mobile devices.
 */
export default function ZoneLayer({ zones = [], ownedZones = {}, position, currentUserId }) {
  // If no GPS lock is acquired yet, do not render any local grids
  if (!position) {
    return null;
  }

  // Calculates squared distance from player position to cell center for fast sorting
  const getDistanceSquared = (zone) => {
    if (!zone.boundary || zone.boundary.length === 0) return Infinity;
    
    let sumLat = 0, sumLng = 0;
    zone.boundary.forEach((p) => {
      sumLat += p.lat ?? p[0];
      sumLng += p.lng ?? p[1];
    });
    const centerLat = sumLat / zone.boundary.length;
    const centerLng = sumLng / zone.boundary.length;

    const dLat = centerLat - position.lat;
    const dLng = centerLng - position.lng;
    return dLat * dLat + dLng * dLng;
  };

  // Sort and slice to only render the 25 closest cells (5x5 grid surrounding the player)
  const localGrid = [...zones]
    .sort((a, b) => getDistanceSquared(a) - getDistanceSquared(b))
    .slice(0, 25);

  return (
    <>
      {localGrid.map((zone) => {
        const positions = zone.boundary.map((p) => {
          if (Array.isArray(p)) {
            return [p[0], p[1]];
          }
          return [p.lat ?? p[0], p.lng ?? p[1]];
        });

        // Safe checks matching both local cache states and database persistent ownership
        const isMine = !!ownedZones[zone.id] || zone.owner_id === currentUserId;
        const isOwned = isMine || !!zone.owner_id;
        
        const color = isMine
          ? MINE_COLOR
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