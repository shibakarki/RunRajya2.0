import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Updated import to target your exact file: rupandehi.json
import rupandehiGeoJson from '../data/rupandehi.json'; 

const FALLBACK_CENTER = [27.5500, 83.4300];

const WORLD_OUTER_RING = [
  [90, -180],
  [90, 180],
  [-90, 180],
  [-90, -180]
];

/**
 * Robust GIS Parser:
 * Auto-detects whether coordinates are stored as objects ({lat, lng} / {latitude, longitude})
 * or standard arrays, swaps axes only if needed, and guarantees valid numeric values.
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
  const [boundary, setBoundary] = useState([]);

  useEffect(() => {
    if (rupandehiGeoJson) {
      const parsedCoords = getLeafletBoundaryCoords(rupandehiGeoJson);
      if (parsedCoords) {
        setBoundary(parsedCoords);
      }
    }
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

      {/* Static MapContainer */}
      <div className="flex-1 w-full h-full">
        <MapContainer
          center={FALLBACK_CENTER}
          zoom={9}
          minZoom={9}
          maxZoom={9}
          zoomControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          boxZoom={false}
          touchZoom={false}
          keyboard={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution="&copy; Google Maps"
            url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            maxZoom={20}
          />

          {boundary.length > 0 && (
            <Polygon
              positions={[WORLD_OUTER_RING, boundary]}
              pathOptions={{
                color: '#d97706', 
                weight: 1.5,
                dashArray: '4, 4',
                fillColor: '#000000',
                fillOpacity: 0.65, 
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Footer Details Bar including static warning note */}
      <div className="border-t border-zinc-900 px-4 py-2 bg-zinc-950/80 flex items-center justify-between text-[9px] font-mono text-zinc-500 z-[10]">
        <span>STATIC PREVIEW • NON-INTERACTIVE</span>
        <span>TOTAL AREA: 4,814 UNITS</span>
      </div>
    </div>
  );
}