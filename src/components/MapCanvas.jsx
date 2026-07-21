import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ZoneLayer from './ZoneLayer'; 

// Change this line to '../data/rupandehi.json' or '../data/rupandehi_boundary.json'
// depending on what the exact file name is inside your src/data/ folder!
import rupandehiGeoJson from '../data/rupandehi.json'; 

const FALLBACK_CENTER = [27.5291, 83.447];

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

const createPlayerIcon = (heading = 0) => {
  return L.divIcon({
    className: 'custom-player-beacon-container',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute; 
          width: 28px; 
          height: 28px; 
          border-radius: 50%; 
          border: 2px solid #3b82f6; 
          opacity: 0.6; 
          animation: beacon-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <svg 
          width="40" 
          height="40" 
          viewBox="0 0 40 40" 
          style="
            position: absolute; 
            transform: rotate(${heading}deg); 
            transition: transform 0.15s ease-out; 
            pointer-events: none;
            overflow: visible;
          "
        >
          <path d="M20,4 L13,15 L20,11.5 L27,15 Z" fill="#3b82f6" stroke="#ffffff" stroke-width="1.5" opacity="0.95" />
        </svg>
        <div style="
          position: absolute; 
          width: 12px; 
          height: 12px; 
          border-radius: 50%; 
          background: #3b82f6; 
          border: 2px solid #ffffff; 
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.9);
        "></div>
      </div>
      <style>
        @keyframes beacon-ping {
          0% { transform: scale(0.8); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

function FollowController({ position, following }) {
  const map = useMap();
  useEffect(() => {
    if (following && position) {
      map.setView([position.lat, position.lng], map.getZoom());
    }
  }, [position, following, map]);
  return null;
}

export default function MapCanvas({ 
  position, 
  zones = [], 
  ownedZones = {}, 
  following = true,
  heading = 0,
  currentUserId,
  currentUserFactionId 
}) {
  const [boundary, setBoundary] = useState([]);
  const center = position ? [position.lat, position.lng] : FALLBACK_CENTER;

  useEffect(() => {
    if (rupandehiGeoJson) {
      const parsedCoords = getLeafletBoundaryCoords(rupandehiGeoJson);
      if (parsedCoords) {
        setBoundary(parsedCoords);
      }
    }
  }, []);

  return (
    <div className="w-full h-full relative bg-zinc-950">
      <MapContainer
        center={center}
        zoom={11}
        minZoom={10}
        maxZoom={19}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution="&copy; Google Maps"
          url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          maxZoom={20}
        />

        <FollowController position={position} following={following} />

        {boundary.length > 0 && (
          <Polygon
            positions={[WORLD_OUTER_RING, boundary]}
            pathOptions={{
              color: '#d97706', 
              weight: 2,
              dashArray: '5, 5',
              fillColor: '#000000',
              fillOpacity: 0.65, 
            }}
          />
        )}

        <ZoneLayer 
          zones={zones} 
          ownedZones={ownedZones} 
          position={position} 
          currentUserId={currentUserId}
          currentUserFactionId={currentUserFactionId} 
        />

        {position && (
          <Marker 
            position={[position.lat, position.lng]} 
            icon={createPlayerIcon(heading)}
          />
        )}
      </MapContainer>
    </div>
  );
}