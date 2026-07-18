import React from 'react';

export default function GoalRing({
  progressPct = 0,
  currentValue = 0, 
  targetValue = 5,   
  unit = "km",
  size = 160,
  strokeWidth = 12
}) {
  const normalizedProgress = Math.max(0, progressPct);
  const cappedProgress = Math.min(normalizedProgress, 100);

  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cappedProgress / 100) * circumference;

  const isGoalAchieved = normalizedProgress >= 100;

  return (
    <div className="flex flex-col items-center justify-center select-none" style={{ width: size, height: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          <defs>
            <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#18181b" 
            strokeWidth={strokeWidth}
          />

          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={isGoalAchieved ? "#10b981" : "#f59e0b"} 
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter={isGoalAchieved ? "url(#ringGlow)" : undefined}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Daily Goal
          </span>
          <span className="text-2xl font-black font-mono tracking-tight text-white leading-none mt-1">
            {Math.round(normalizedProgress)}%
          </span>
          
          <div className="mt-2 flex items-baseline gap-0.5 text-zinc-400">
            <span className="text-xs font-bold font-mono text-zinc-200">
              {currentValue.toFixed(1)}
            </span>
            <span className="text-[10px] font-mono text-zinc-600">/</span>
            <span className="text-[10px] font-mono text-zinc-500">
              {targetValue} {unit}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}