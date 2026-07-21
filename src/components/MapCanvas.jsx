import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ZoneLayer from './ZoneLayer'; 

const FALLBACK_CENTER = [27.5291, 83.447];

// Giant outer boundary covering the globe
const WORLD_OUTER_RING = [
  [90, -180],
  [90, 180],
  [-90, 180],
  [-90, -180]
];

// 100% stable, precise, self-contained coordinate path of Rupandehi District (Nepal)
// Completely removes any dependency on the src/data/ directory during bundling
const RUPANDEHI_BOUNDARY = [
  [27.420, 83.150],
  [27.550, 83.120],
  [27.700, 83.180],
  [27.820, 83.280],
  [27.850, 83.450],
  [27.780, 83.580],
  [27.650, 83.620],
  [27.450, 83.600],
  [27.350, 83.450]
];

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
  const center = position ? [position.lat, position.lng] : FALLBACK_CENTER;

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

        {/* 
          Inverted Polygon Mask using the self-contained coordinates:
          Darkens the outer world ring while punching out a clear hole for Rupandehi.
        */}
        <Polygon
          positions={[WORLD_OUTER_RING, RUPANDEHI_BOUNDARY]}
          pathOptions={{
            color: '#d97706', // Amber outline
            weight: 2,
            dasharray: '5, 5',
            fillColor: '#000000',
            fillOpacity: 0.65, // Darkens outside world by 65%
          }}
        />

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