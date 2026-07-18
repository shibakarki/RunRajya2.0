import { useState, useEffect, useRef } from 'react';

export function useWakeLock() {
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const wakeLockRef = useRef(null);
  const videoRef = useRef(null);

  // Fallback: Creates a looping, invisible 1px silent video stream element
  const enableVideoFallback = () => {
    if (videoRef.current) return;

    const video = document.createElement('video');
    // Minimal valid base64 webm loop
    video.src = 'data:video/webm;base64,GkXfo0AgQoaBAUL3g3e0IEQCwdVcdcEAQUBFZmFzc2VsbXNfV0VNQY0SAE0TAnEBAAAAAAAVAhEBAAAAAAAWBAEBAAAAAAAiAgEBAAAAAAArAgEBAAAAAAA4AgEBAAAAAABFAgEBAAAAAABSAgEBAAAAAABfAgEBAAAAAABsAgEBAAAAAAB5AgEBAAAAAACGAgEBAAAAAACSAgEBAAAAAACfAgEBAAAAAACsAgEBAAAAAAC5AgEBAAAAAADEAgEBAAAAAADRAgEBAAAAAADeAgEBAAAAAADpAg';
    video.setAttribute('loop', 'true');
    video.setAttribute('muted', 'true');
    video.setAttribute('playsinline', 'true');
    video.style.position = 'fixed';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0.01';
    video.style.pointerEvents = 'none';

    document.body.appendChild(video);
    videoRef.current = video;

    video.play().catch((e) => {
      console.warn('Video Wake Lock fallback play blocked:', e);
    });
  };

  const disableVideoFallback = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      document.body.removeChild(videoRef.current);
      videoRef.current = null;
    }
  };

  const requestWakeLock = async () => {
    // 1. Attempt standard Screen Wake Lock API
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setWakeLockActive(true);
        return;
      } catch (err) {
        console.warn('Standard Wake Lock failed, switching to video loop fallback:', err);
      }
    }

    // 2. Trigger fallback stream loop if native APIs fail
    enableVideoFallback();
    setWakeLockActive(true);
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (e) {
        console.error('Error releasing Wake Lock token:', e);
      }
    }
    
    disableVideoFallback();
    setWakeLockActive(false);
  };

  // Re-acquire Wake Lock token if user navigates back to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && wakeLockActive) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      disableVideoFallback();
    };
  }, [wakeLockActive]);

  return {
    wakeLockActive,
    requestWakeLock,
    releaseWakeLock
  };
}