import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// Distance calculation using the Haversine formula
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of Earth in meters
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

/**
 * useGPS – standard geolocation sensor hook.
 * Streams real-time position and GPS lock status.
 */
export function useGPS() {
  const [position, setPosition] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('acquiring'); // 'acquiring' | 'locked' | 'error'
  const [errorMsg, setErrorMsg] = useState(null);
  
  const auth = useAuth();
  const userId = auth?.session?.user?.id;

  const lastPositionRef = useRef(null);
  const lastTimestampRef = useRef(0);

  useEffect(() => {
    // SECURITY GATE: Prevent GPS initialization if the explorer is signed out
    if (!userId) {
      setGpsStatus('error');
      setErrorMsg('Authentication required to initialize GPS sensors.');
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus('error');
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const timestamp = pos.timestamp;

        // GPS Threshold constraint check (80m)
        if (accuracy > 80) {
          setGpsStatus('acquiring');
          return;
        }

        // Anti-cheat verification
        if (lastPositionRef.current) {
          const distanceMoved = getDistanceMeters(
            lastPositionRef.current.lat,
            lastPositionRef.current.lng,
            latitude,
            longitude
          );
          
          const timeElapsedSeconds = (timestamp - lastTimestampRef.current) / 1000;

          if (timeElapsedSeconds > 0) {
            const speedMps = distanceMoved / timeElapsedSeconds;
            // Speed constraint check: ~15 km/h limit (4.16 m/s)
            if (speedMps > 4.16) {
              console.warn(`GPS point rejected. Speed limit exceeded.`);
              return; 
            }
          }
        }

        const validCoords = { lat: latitude, lng: longitude };
        setPosition(validCoords);
        setGpsStatus('locked');
        
        lastPositionRef.current = validCoords;
        lastTimestampRef.current = timestamp;
      },
      (error) => {
        console.error('GPS error status:', error.message);
        setGpsStatus('error');
        setErrorMsg(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userId]); // Re-bind securely when authentication state changes

  return { position, gpsStatus, errorMsg };
}