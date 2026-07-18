import React, { useState, useRef, useEffect } from 'react';
import MapCanvas from '../components/MapCanvas';
import FieldHUD from '../components/FieldHUD';
import GoalRing from '../components/GoalRing';
import AuthModal from '../components/AuthModal';
import PocketLockOverlay from '../components/PocketLockOverlay';
import DynamicIslandNav from '../components/DynamicIslandNav';
import { usePocketLock } from '../hooks/usePocketLock';
import { useRunSession } from '../hooks/useRunSession';
import { useDailyGoal } from '../hooks/useDailyGoal';
import { useGPS } from '../hooks/useGPS'; 
import { useCompass } from '../hooks/useCompass'; 
import { useProfileStats } from '../hooks/useProfileStats';
import { useAuth } from '../context/AuthContext';

import { useZonesGrid } from '../hooks/useZonesGrid';
import { useZoneCaptures } from '../hooks/useZoneCaptures';
import { useOfflineSync } from '../hooks/useOfflineSync';

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; 
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

export default function MapPage() {
  const [followPlayer, setFollowPlayer] = useState(true);
  const auth = useAuth();
  const user = auth?.session?.user;

  // 1. Initialize background sync loop
  useOfflineSync();

  // 2. Fetch the 5,212 cells from database/cache
  const { grid, loading: gridLoading } = useZonesGrid();

  // 3. Initialize capture handler
  const { ownedZones, evaluateCapture } = useZoneCaptures();

  // Fetch logged-in user profile statistics (for customized daily goals target)
  const { stats } = useProfileStats(user?.id);
  const dailyTargetM = stats?.dailyTargetM || 5000; 

  const { isLocked, lockScreen, unlockScreen } = usePocketLock();
  
  // Destructure active run tracking statistics
  const { duration, distance, calories, sessionActive, sessionId, addTrackedDistance } = useRunSession();

  // Compute daily goal metrics dynamically using custom target
  const { progressPct, currentValueKm, targetValueKm } = useDailyGoal(distance, dailyTargetM);

  const lastPositionRef = useRef(null);

  // 4. Geolocation Sensor: Evaluates distance traveled and sector captures on every physical movement
  const { position, gpsStatus, errorMsg } = useGPS((coords) => {
    if (sessionActive) {
      if (lastPositionRef.current) {
        const metersMoved = getDistanceMeters(
          lastPositionRef.current.lat,
          lastPositionRef.current.lng,
          coords.lat,
          coords.lng
        );
        addTrackedDistance(metersMoved);
      }

      if (grid && grid.length > 0) {
        evaluateCapture(coords, grid, sessionId, user?.id);
      }
    }
    lastPositionRef.current = coords;
  });

  // 5. REACTIVE INSTANT CAPTURE:
  // Evaluates a capture instantly the exact second the session turns active,
  // bypassing the need to move physically to trigger the first zone capture.
  useEffect(() => {
    if (sessionActive && position && grid && grid.length > 0 && user?.id) {
      console.log('Session activated. Executing initial zone capture check...');
      evaluateCapture(position, grid, sessionId, user.id);
    }
  }, [sessionActive, position, grid, sessionId, user?.id, evaluateCapture]);

  // Compass Magnetometer Sensor
  const { heading, requestPermission: requestCompassPermission } = useCompass();

  // Hold-to-Lock progress state
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef(null);

  // Activates the orientation permission on the first screen tap
  const handlePageClick = async () => {
    if (requestCompassPermission) {
      await requestCompassPermission();
    }
  };

  const startLockHold = (e) => {
    e.preventDefault();
    if (holdIntervalRef.current) return;
    
    const startTime = Date.now();
    const durationNeeded = 2000; 

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / durationNeeded) * 100, 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
        setHoldProgress(0);
        lockScreen(); 
      }
    }, 50);
  };

  const cancelLockHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHoldProgress(0);
  };

  return (
    <div 
      onClick={handlePageClick} // Captures first tap to authorize compass orientation
      className="w-full h-[100dvh] flex flex-col md:flex-row bg-zinc-950 text-white overflow-hidden relative md:pt-16"
    >
      
      {/* 1. Desktop Sidebar Overlay Panel */}
      <div className="hidden md:flex md:w-[360px] lg:w-[400px] xl:w-[440px] 2xl:w-[480px] h-full flex-col border-r border-zinc-900 bg-zinc-950 z-10 select-none overflow-y-auto shrink-0">
        <div className="p-6 border-b border-zinc-900 bg-zinc-950/50">
          <h1 className="text-xl font-black tracking-widest text-white uppercase font-sans">RunRajya 2.0</h1>
          <p className="text-[10px] font-mono text-amber-500 tracking-wider uppercase mt-1">Sector Navigation Control</p>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-6">
          {/* GoalRing dynamically bound to progress metrics */}
          <div className="flex justify-center bg-zinc-900/10 border border-zinc-900 rounded-xl p-4">
            <GoalRing 
              progressPct={progressPct} 
              currentValue={currentValueKm} 
              targetValue={targetValueKm} 
              size={180}
            />
          </div>

          <div className="bg-zinc-900/10 border border-zinc-900 rounded-xl p-4 flex flex-col gap-2">
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Device Sensors</h3>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">GPS Signal:</span>
              {gpsStatus === 'locked' ? (
                <span className="text-emerald-500 font-mono font-bold">LOCKED</span>
              ) : gpsStatus === 'error' ? (
                <span className="text-red-500 font-mono font-bold">ERROR</span>
              ) : (
                <span className="text-amber-500 font-mono font-bold animate-pulse">Acquiring...</span>
              )}
            </div>
            
            {/* Live Database Diagnostics Row */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">Sectors Loaded:</span>
              <span className="text-zinc-300 font-mono font-bold">
                {gridLoading ? 'Loading Grid...' : `${grid?.length || 0} cells`}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">Orientation status:</span>
              <span className="text-zinc-300 font-mono">Calibrated ({heading}°)</span>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-900 p-4 bg-zinc-950">
          <FieldHUD 
            followPlayer={followPlayer} 
            setFollowPlayer={setFollowPlayer}
            startLockHold={startLockHold}
            cancelLockHold={cancelLockHold}
            holdProgress={holdProgress}
            gpsStatus={gpsStatus}
            requestCompassPermission={requestCompassPermission}
          />
        </div>
      </div>

      {/* 2. Map Canvas (Takes 65% of mobile viewport, or 100% of desktop viewport) */}
      <div className="flex-1 h-[65%] md:h-full relative w-full">
        <MapCanvas 
          position={position} 
          zones={grid} 
          ownedZones={ownedZones} 
          following={followPlayer}
          heading={heading} 
          currentUserId={user?.id} // Pass currentUserId to paint owned zones in faction colors
        />

        {gpsStatus !== 'locked' && (
          <div className="absolute inset-0 z-[1000] bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center select-none">
            <div className="p-4 bg-amber-950/20 border border-amber-900/30 text-amber-500 rounded-full mb-4 animate-bounce">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold tracking-wider text-white uppercase">Acquiring GPS Signal...</h3>
            <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed">
              {errorMsg ? `Error: ${errorMsg}. Please enable high-accuracy location services in your system settings.` : 'Establishing a high-precision lock (<80m) to calibrate coordinate cells.'}
            </p>
          </div>
        )}
      </div>

      {/* 3. Mobile Navigation Bottom Control Sheet (Takes 35% of mobile viewport) */}
      <div className="h-[35%] w-full md:hidden bg-zinc-950 z-20 shadow-2xl">
        <FieldHUD 
          followPlayer={followPlayer} 
          setFollowPlayer={setFollowPlayer} 
          startLockHold={startLockHold}
          cancelLockHold={cancelLockHold}
          holdProgress={holdProgress}
          gpsStatus={gpsStatus}
          requestCompassPermission={requestCompassPermission}
        />
      </div>

      {/* 4. Root Level Pocket Lock Overlay (Mounts cleanly above everything) */}
      {isLocked && (
        <PocketLockOverlay 
          duration={duration} 
          distance={distance} 
          unlockScreen={unlockScreen} 
        />
      )}

      <DynamicIslandNav />

      <AuthModal />
    </div>
  );
}