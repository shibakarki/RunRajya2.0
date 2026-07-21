import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * useCompass – handles device orientation to track magnetometer heading.
 * Gates hardware access behind active authentication states.
 */
export function useCompass() {
  const [heading, setHeading] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Resolve active session to gate hardware access
  const auth = useAuth();
  const userId = auth?.session?.user?.id;

  const requestPermission = useCallback(async () => {
    // SECURITY GATE: Prevent calibration prompts if signed out
    if (!userId) return false;

    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          setPermissionGranted(true);
          return true;
        }
      } catch (err) {
        console.error('Magnetometer permission denied:', err);
      }
    } else {
      setPermissionGranted(true);
      return true;
    }
    return false;
  }, [userId]);

  useEffect(() => {
    // SECURITY GATE: Prevent listener registration if signed out
    if (!userId || !permissionGranted) {
      return;
    }

    const handleOrientation = (e) => {
      let absoluteHeading = 0;
      
      if (e.webkitCompassHeading !== undefined) {
        absoluteHeading = e.webkitCompassHeading;
      } else if (e.alpha !== null) {
        absoluteHeading = 360 - e.alpha;
      }
      
      setHeading(Math.round(absoluteHeading));
    };

    const isAbsoluteSupported = 'ondeviceorientationabsolute' in window;
    const eventName = isAbsoluteSupported ? 'deviceorientationabsolute' : 'deviceorientation';

    window.addEventListener(eventName, handleOrientation);

    return () => {
      window.removeEventListener(eventName, handleOrientation);
    };
  }, [permissionGranted, userId]);

  return { 
    heading, 
    requestPermission, 
    permissionGranted 
  };
}