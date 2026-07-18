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

export default function ZoneLayer({ zones = [], ownedZones = {} }) {
  return (
    <>
      {zones.map((zone) => {
        const positions = zone.boundary.map((p) => {
          if (Array.isArray(p)) {
            return [p[0], p[1]];
          }
          return [p.lat ?? p[0], p.lng ?? p[1]];
        });

        const isMine = !!ownedZones[zone.id];
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