import React, { useState, useRef } from 'react';

export default function PocketLockOverlay({ duration = 0, distance = 0, unlockScreen }) {
  const [slideX, setSlideX] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const sliderTrackRef = useRef(null);
  const startDragX = useRef(0);

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

  const handleSlideStart = (e) => {
    setIsSliding(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    startDragX.current = clientX - slideX;
  };

  const handleSlideMove = (e) => {
    if (!isSliding || !sliderTrackRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const trackWidth = sliderTrackRef.current.clientWidth;
    const handleWidth = 48; 
    const maxSlide = trackWidth - handleWidth;

    let currentSlide = clientX - startDragX.current;
    currentSlide = Math.max(0, Math.min(currentSlide, maxSlide));
    setSlideX(currentSlide);

    if (currentSlide >= maxSlide - 2) {
      setIsSliding(false);
      setSlideX(0);
      unlockScreen();
    }
  };

  const handleSlideEnd = () => {
    setIsSliding(false);
    setSlideX(0);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/98 z-[99999] flex flex-col justify-between p-8 select-none touch-none"
      style={{ touchAction: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header Info */}
      <div className="text-center mt-12">
        <div className="inline-flex p-3 bg-amber-950/40 border border-amber-900/50 rounded-full mb-3 text-amber-500 animate-pulse">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h2 className="text-sm font-mono tracking-widest text-zinc-400 uppercase">Pocket Lock Active</h2>
        <p className="text-xs text-zinc-600 mt-1">Screen inputs are securely blocked</p>
      </div>

      {/* Stats Display */}
      <div className="grid grid-cols-2 gap-4 text-center my-auto">
        <div>
          <span className="block text-[10px] font-mono tracking-wider text-zinc-500 uppercase">Distance</span>
          <span className="text-3xl font-black font-mono text-white">{formatDistance(distance)}</span>
        </div>
        <div>
          <span className="block text-[10px] font-mono tracking-wider text-zinc-500 uppercase">Time</span>
          <span className="text-3xl font-black font-mono text-amber-500">{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Drag Tracker Slider */}
      <div className="mb-12">
        <div 
          ref={sliderTrackRef}
          className="relative w-full h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center overflow-hidden"
        >
          <span className="text-xs font-mono font-medium text-zinc-500 pointer-events-none select-none">
            Slide track to unlock
          </span>

          <div
            style={{ transform: `translateX(${slideX}px)` }}
            className="absolute left-1 w-10 h-10 bg-amber-500 hover:bg-amber-400 active:scale-95 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-75 text-zinc-950 shadow-md"
            onTouchStart={handleSlideStart}
            onTouchMove={handleSlideMove}
            onTouchEnd={handleSlideEnd}
            onMouseDown={handleSlideStart}
            onMouseMove={handleSlideMove}
            onMouseUp={handleSlideEnd}
            onMouseLeave={handleSlideEnd}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}