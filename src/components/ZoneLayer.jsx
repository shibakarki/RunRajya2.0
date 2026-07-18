import React, { useState, useEffect } from 'react';
import { Polygon, useMap } from 'react-leaflet';

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
 * Optimized with a dynamic viewport bounds filter and a zoom gate (>= 13)
 * to prevent SVG rendering bottlenecks on mobile browsers.
 */
export default function ZoneLayer({ zones = [], ownedZones = {} }) {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());
  const [visibleBounds, setVisibleBounds] = useState(map.getBounds());

  // Listen to map movement and zoom events to update clip bounds dynamically
  useEffect(() => {
    const updateViewport = () => {
      setCurrentZoom(map.getZoom());
      setVisibleBounds(map.getBounds());
    };

    map.on('moveend zoomend', updateViewport);
    return () => {
      map.off('moveend zoomend', updateViewport);
    };
  }, [map]);

  // Zoom Gate: To protect mobile browser performance, do not render micro-grids 
  // when zoomed out too far (below zoom level 13).
  if (currentZoom < 13) {
    return null;
  }

  // Viewport Clip Filter: Only render cells that physically intersect with the current screen viewport bounds
  const visibleZones = zones.filter((zone) => {
    if (!zone.boundary || zone.boundary.length === 0) return false;
    
    return zone.boundary.some((p) => {
      const lat = p.lat ?? p[0];
      const lng = p.lng ?? p[1];
      return visibleBounds.contains([lat, lng]);
    });
  });

  return (
    <>
      {visibleZones.map((zone) => {
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