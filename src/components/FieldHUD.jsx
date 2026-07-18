import React from 'react';
import { useRunSession } from '../hooks/useRunSession';

export default function FieldHUD({ 
  followPlayer, 
  setFollowPlayer, 
  startLockHold, 
  cancelLockHold, 
  holdProgress, 
  gpsStatus, // Prop determines starting permissions
  requestCompassPermission 
}) {
  const { 
    sessionActive, 
    startSession, 
    endSession, 
    duration = 0, 
    distance = 0, 
    calories = 0 
  } = useRunSession();

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const formatDistance = (meters) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  // Safe launcher triggers permissions checklists before initiating run sessions
  const handleStartTrigger = async () => {
    if (gpsStatus !== 'locked') return;

    // iOS WebKit orientation sensor permission prompt requires an active user gesture
    if (requestCompassPermission) {
      await requestCompassPermission();
    }
    
    startSession();
  };

  return (
    <div className="h-full w-full bg-zinc-950 border-t border-zinc-900 flex flex-col justify-between p-4 relative select-none">
      
      {/* 1. Run Session Statistics Header */}
      <div className="grid grid-cols-3 gap-2 bg-zinc-900/30 border border-zinc-900 rounded-xl p-3">
        <div className="text-center">
          <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Distance</span>
          <span className="text-lg font-bold font-mono text-zinc-100">{formatDistance(distance)}</span>
        </div>
        <div className="text-center border-x border-zinc-900">
          <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Elapsed</span>
          <span className="text-lg font-bold font-mono text-amber-500">{formatDuration(duration)}</span>
        </div>
        <div className="text-center">
          <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Calories</span>
          <span className="text-lg font-bold font-mono text-zinc-100">{Math.round(calories)} kcal</span>
        </div>
      </div>

      {/* 2. Tactical Map HUD Controls */}
      <div className="flex justify-between gap-3 mt-3">
        <button
          type="button"
          onClick={() => setFollowPlayer(prev => !prev)}
          className={`flex-1 py-3 px-2 rounded-xl border font-mono text-xs flex flex-col items-center justify-center gap-1 transition-colors ${
            followPlayer 
              ? 'bg-amber-950/20 border-amber-500/50 text-amber-500' 
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v2M12 20v2M4 12H2M22 12h-2" />
          </svg>
          <span>{followPlayer ? 'Tracking ON' : 'Follow Off'}</span>
        </button>

        <button
          type="button"
          onPointerDown={startLockHold}
          onPointerUp={cancelLockHold}
          onPointerLeave={cancelLockHold}
          onTouchStart={startLockHold}
          onTouchEnd={cancelLockHold}
          style={{ touchAction: 'none' }}
          className="flex-1 py-3 px-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-900/70 text-zinc-400 hover:text-zinc-200 font-mono text-xs flex flex-col items-center justify-center gap-1 relative overflow-hidden"
        >
          <div 
            style={{ height: `${holdProgress}%` }}
            className="absolute bottom-0 left-0 right-0 bg-amber-500/10 transition-all duration-75 pointer-events-none"
          />
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <span>{holdProgress > 0 ? `Hold (${Math.round(holdProgress)}%)` : 'Hold to Lock'}</span>
        </button>
      </div>

      {/* 3. Main Session State Button (GPS Gated) */}
      <div className="mt-3">
        {!sessionActive ? (
          gpsStatus === 'locked' ? (
            <button
              type="button"
              onClick={handleStartTrigger}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black font-mono text-sm tracking-widest rounded-xl transition-all shadow-lg active:scale-[0.99]"
            >
              START RUN SESSION
            </button>
          ) : (
            /* Disabled state blocks session start if GPS coordinates stream has not locked */
            <button
              type="button"
              disabled
              className="w-full py-4 bg-zinc-900 border border-zinc-850 text-zinc-500 font-black font-mono text-sm tracking-widest rounded-xl transition-all cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="animate-spin h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              WAITING FOR GPS LOCK...
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={endSession}
            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black font-mono text-sm tracking-widest rounded-xl transition-all shadow-lg active:scale-[0.99]"
          >
            END & SYNC SESSION
          </button>
        )}
      </div>
    </div>
  );
}