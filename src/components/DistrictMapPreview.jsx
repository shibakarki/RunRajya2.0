import React, { useState, useEffect } from 'react';

// Import your precise Rupandehi boundary data
import rupandehiGeoJson from '../data/rupandehi.json'; 

// Standard mathematical mapping bounding parameters
const WORLD_OUTER_RING = [
  [90, -180],
  [90, 180],
  [-90, 180],
  [-90, -180]
];

/**
 * Robust GIS Parser:
 * Auto-detects whether coordinates are stored as objects ({lat, lng} / {latitude, longitude})
 * or standard arrays, and guarantees valid numeric values in [latitude, longitude] order.
 */
const getLeafletBoundaryCoords = (geoJson) => {
  try {
    let rawCoords = [];
    const geometry = geoJson.features 
      ? geoJson.features[0].geometry 
      : geoJson.geometry;

    if (geometry.type === 'Polygon') {
      rawCoords = geometry.coordinates[0];
    } else if (geometry.type === 'MultiPolygon') {
      rawCoords = geometry.coordinates[0][0];
    } else if (Array.isArray(geoJson)) {
      rawCoords = geoJson;
    }

    if (rawCoords && rawCoords.length > 0) {
      const firstPoint = rawCoords[0];
      let isObject = false;
      let firstVal = 0;
      
      // Auto-detect structure type
      if (firstPoint && typeof firstPoint === 'object' && !Array.isArray(firstPoint)) {
        isObject = true;
        firstVal = firstPoint.lng || firstPoint.longitude || 0;
      } else if (Array.isArray(firstPoint)) {
        firstVal = firstPoint[0];
      }

      // Nepal coordinates sit around Lng 83.x / Lat 27.x
      const needsSwap = firstVal > 50;

      return rawCoords.map(coord => {
        if (isObject) {
          const latVal = coord.lat !== undefined ? coord.lat : coord.latitude;
          const lngVal = coord.lng !== undefined ? coord.lng : coord.longitude;
          return [Number(latVal) || 0, Number(lngVal) || 0];
        } else if (Array.isArray(coord)) {
          if (needsSwap) {
            return [Number(coord[1]) || 0, Number(coord[0]) || 0]; // Swap Lng/Lat to Lat/Lng
          } else {
            return [Number(coord[0]) || 0, Number(coord[1]) || 0]; // Keep Lat/Lng
          }
        }
        return [0, 0];
      });
    }
  } catch (err) {
    console.error('Error parsing dynamic Rupandehi boundary data:', err);
  }
  return null;
};

export default function DistrictMapPreview() {
  const [svgPath, setSvgPath] = useState('');
  const [centerPoint, setCenterPoint] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (!rupandehiGeoJson) return;

    const coords = getLeafletBoundaryCoords(rupandehiGeoJson);
    if (!coords || coords.length === 0) return;

    // 1. Calculate boundaries
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    coords.forEach(([lat, lng]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });

    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    const maxRange = Math.max(latRange, lngRange);

    // 2. Map GPS coordinates to a 100x100 SVG viewbox, maintaining geographical aspect ratio
    const svgPoints = coords.map(([lat, lng]) => {
      const xOffset = (maxRange - lngRange) / 2;
      const yOffset = (maxRange - latRange) / 2;
      
      const x = (((lng - minLng) + xOffset) / maxRange) * 100;
      const y = 100 - (((lat - minLat) + yOffset) / maxRange) * 100; // Flip Y-axis for SVG
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    // 3. Generate center point coordinates for the radar ping indicator
    const centerLat = minLat + (latRange / 2);
    const centerLng = minLng + (lngRange / 2);
    const xOffset = (maxRange - lngRange) / 2;
    const yOffset = (maxRange - latRange) / 2;
    const centerX = (((centerLng - minLng) + xOffset) / maxRange) * 100;
    const centerY = 100 - (((centerLat - minLat) + yOffset) / maxRange) * 100;

    setCenterPoint({ x: centerX, y: centerY });
    setSvgPath(`M ${svgPoints.join(' L ')} Z`);
  }, []);

  return (
    <div className="w-full h-64 md:h-80 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col relative overflow-hidden select-none shadow-2xl">
      
      {/* Absolute Header Overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-0.5 z-[10] pointer-events-none drop-shadow-md">
        <span className="text-[10px] font-mono tracking-widest text-zinc-300 uppercase">Sector: Rupandehi</span>
        <span className="text-[9px] font-mono text-zinc-400">27.55° N, 83.43° E</span>
      </div>

      <div className="absolute top-4 right-4 z-[10] pointer-events-none drop-shadow-md">
        <span className="px-2 py-0.5 rounded border border-zinc-800 text-[9px] font-mono text-amber-500 bg-amber-950/40 uppercase tracking-wider">
          District Boundaries
        </span>
      </div>

      {/* Pure Vector Canvas Panel (Loads instantly, 100% offline, zero package overhead) */}
      <div className="flex-1 w-full h-full relative bg-zinc-950">
        
        {svgPath && (
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full p-8"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Tactical grid pattern representing the 500m cells */}
              <pattern id="sectorPreviewGrid" width="4" height="4" patternUnits="userSpaceOnUse">
                <path 
                  d="M 4 0 L 0 0 0 4" 
                  fill="none" 
                  stroke="rgba(245, 158, 11, 0.08)" 
                  strokeWidth="0.3"
                />
              </pattern>

              {/* Mask: Cuts out a transparent hole inside a dark solid overlay */}
              <mask id="districtOuterMask">
                <rect width="100" height="100" fill="#ffffff" />
                <path d={svgPath} fill="#000000" />
              </mask>
            </defs>

            {/* A. Inside: Fill Rupandehi district with our tactical cell grid pattern */}
            <path d={svgPath} fill="url(#sectorPreviewGrid)" />

            {/* B. Outside: Darken everything outside the district line by 65% */}
            <rect width="100" height="100" fill="#000000" opacity="0.65" mask="url(#districtOuterMask)" />

            {/* C. Boundary Outline: Amber dashed border line */}
            <path 
              d={svgPath} 
              fill="none" 
              stroke="#d97706" 
              strokeWidth="0.8" 
              strokeDasharray="1.5, 1.5" 
              opacity="0.8"
            />

            {/* D. Radar Ping Indicator */}
            <g transform={`translate(${centerPoint.x}, ${centerPoint.y})`}>
              <circle 
                r="4" 
                fill="none" 
                stroke="#d97706" 
                strokeWidth="0.4" 
                className="animate-ping origin-center"
                style={{ transformOrigin: 'center' }}
              />
              <circle 
                r="1.2" 
                fill="#d97706" 
              />
            </g>
          </svg>
        )}
      </div>

      {/* Footer Details Bar including static warning note */}
      <div className="border-t border-zinc-900 px-4 py-2 bg-zinc-950/80 flex items-center justify-between text-[9px] font-mono text-zinc-500 z-[10]">
        <span>STATIC PREVIEW • NON-INTERACTIVE</span>
        <span>TOTAL AREA: 4,814 UNITS</span>
      </div>
    </div>
  );
}