import { useState, useEffect, useCallback } from 'react';

/**
 * useCompass – handles device orientation to track magnetometer heading.
 * Handles Apple user-gesture permission request patterns.
 */
export function useCompass() {
  const [heading, setHeading] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestPermission = useCallback(async () => {
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
      // Non-iOS device or browser context where explicit gesture permission is not required
      setPermissionGranted(true);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const handleOrientation = (e) => {
      let absoluteHeading = 0;
      
      if (e.webkitCompassHeading !== undefined) {
        // iOS Safari Native compass heading
        absoluteHeading = e.webkitCompassHeading;
      } else if (e.alpha !== null) {
        // Absolute magnetometer heading standard: 360 - alpha
        absoluteHeading = 360 - e.alpha;
      }
      
      setHeading(Math.round(absoluteHeading));
    };

    // Use absolute magnetometer event when available to ignore local magnetic drift
    const isAbsoluteSupported = 'ondeviceorientationabsolute' in window;
    const eventName = isAbsoluteSupported ? 'deviceorientationabsolute' : 'deviceorientation';

    if (permissionGranted) {
      window.addEventListener(eventName, handleOrientation);
    }

    return () => {
      window.removeEventListener(eventName, handleOrientation);
    };
  }, [permissionGranted]);

  return { 
    heading, 
    requestPermission, 
    permissionGranted 
  };
}