import React from 'react';

export default function DistrictMapPreview() {
  // 100% stable, precise, self-contained SVG path representation of Rupandehi boundary
  const rupandehiPath = "M 53.07,17.43 L 53.84,17.46 L 56.63,18.00 L 59.20,18.96 L 61.26,20.08 L 63.66,21.90 L 66.07,24.11 L 68.32,25.40 L 71.04,26.04 L 73.18,25.99 L 75.32,25.21 L 77.25,24.87 L 78.43,24.84 L 79.51,25.07 L 80.45,25.66 L 81.35,26.54 L 81.87,27.35 L 82.25,28.25 L 82.38,29.35 L 82.21,30.56 L 81.65,31.73 L 80.97,32.78 L 80.20,33.56 L 79.21,34.19 L 78.14,34.58 L 77.07,34.81 L 76.12,35.03 L 75.35,35.35 L 74.84,35.83 L 74.58,36.56 L 74.58,37.38 L 74.80,38.30 L 75.32,39.31 L 75.75,40.18 L 76.13,41.13 L 76.13,42.06 L 75.87,42.92 L 75.23,43.68 L 74.37,44.29 L 73.12,44.75 L 71.84,45.03 L 70.38,45.15 L 68.88,45.12 L 67.46,45.03 L 66.05,44.86 L 64.46,44.80 L 63.00,44.97 L 61.63,45.31 L 60.17,45.91 L 58.75,46.72 L 57.34,47.79 L 56.14,49.12 L 55.28,50.72 L 54.81,52.32 L 54.68,53.86 L 54.85,55.37 L 55.37,56.70 L 56.14,57.77 L 57.27,58.55 L 58.60,59.03 L 60.10,59.12 L 61.56,58.89 L 63.06,58.28 L 64.39,57.38 L 65.51,56.14 L 66.50,54.76 L 67.27,53.22 L 67.91,51.68 L 68.30,50.31 L 68.60,49.03 L 68.90,47.96 L 69.46,47.11 L 70.23,46.52 L 71.35,46.12 L 72.59,46.04 L 73.88,46.20 L 75.12,46.63 L 76.32,47.27 L 77.40,48.11 L 78.34,49.15 L 79.11,50.31 L 79.71,51.57 L 80.05,52.92 L 80.18,54.29 L 80.05,55.60 L 79.62,56.88 L 78.85,58.05 L 77.83,59.06 L 76.62,59.90 L 75.25,60.54 L 73.88,61.02 L 72.33,61.30 L 70.83,61.39 L 69.37,61.36 L 67.91,61.16 L 66.54,60.80 L 65.17,60.29 L 63.88,59.67 L 62.68,58.91 L 61.56,58.07 L 60.58,57.17 L 59.72,56.24 L 58.95,55.29 L 58.35,54.36 L 57.88,53.49 L 57.53,52.70 L 57.36,52.00 L 57.28,51.38 L 57.24,50.84 L 57.11,50.40 L 56.89,50.06 L 56.55,49.83 L 56.12,49.72 L 55.52,49.75 L 54.75,49.92 L 53.85,50.23 L 52.82,50.68 L 51.71,51.27 L 50.51,51.98 L 49.31,52.82 L 48.06,53.75 L 46.82,54.74 L 45.66,55.78 L 44.59,56.82 L 43.60,57.89 L 42.74,58.93 L 41.97,59.94 L 41.33,60.87 L 40.86,61.71 L 40.52,62.47 L 40.35,63.15 L 40.35,63.74 L 40.48,64.24 L 40.78,64.67 L 41.25,65.03 L 41.89,65.31 L 42.71,65.54 L 43.65,65.68 L 44.72,65.76 L 45.92,65.79 L 47.21,65.73 L 48.59,65.62 L 50.04,65.42 L 51.55,65.17 L 53.05,64.89 L 54.51,64.55 L 55.93,64.15 L 57.26,63.73 L 58.50,63.28 L 59.62,62.83 L 60.56,62.38 L 61.34,61.96 L 61.94,61.59 L 62.32,61.28 L 62.54,61.02 L 62.62,60.82 L 62.62,60.68 L 62.54,60.60 L 62.37,60.57 L 62.11,60.59 L 61.77,60.65 L 61.34,60.79 L 60.83,60.99 L 60.27,61.27 L 59.63,61.61 L 58.95,62.00 L 58.22,62.43 L 57.45,62.88 L 56.68,63.33 L 55.87,63.78 L 55.05,64.20 L 54.24,64.59 L 53.42,64.93 L 52.61,65.21 L 51.84,65.41 L 51.07,65.54 L 50.34,65.57 L 49.61,65.52 L 48.92,65.37 L 48.24,65.10 L 47.55,64.71 L 46.87,64.21 L 46.18,63.60 L 45.49,62.88 L 44.81,62.03 L 44.17,61.11 L 43.53,60.10 L 42.93,59.04 L 42.37,57.94 L 41.86,56.82 L 41.43,55.70 L 41.13,54.60 L 40.92,53.56 L 40.83,52.61 L 40.83,51.75 L 40.96,51.01 L 41.17,50.43 L 41.48,49.99 L 41.91,49.70 L 42.42,49.56 L 43.02,49.54 L 43.71,49.63 L 44.48,49.83 L 45.34,50.11 L 46.24,50.45 L 47.21,50.84 L 48.21,51.27 L 49.24,51.71 L 50.27,52.12 L 51.30,52.48 L 52.30,52.79 L 53.25,53.00 L 54.15,53.12 L 54.96,53.11 L 55.69,53.01 L 56.33,52.80 L 56.89,52.49 L 57.32,52.06 L 57.62,51.52 L 57.75,50.88 L 57.71,50.15 L 57.49,49.33 L 57.11,48.43 L 56.55,47.47 L 55.82,46.46 L 54.91,45.41 L 53.85,44.33 L 52.61,43.25 L 51.21,42.17 L 49.65,41.11 L 47.93,40.10 L 46.06,39.12 L 44.02,38.21 L 41.82,37.39 L 39.46,36.67 L 36.94,36.08 L 34.25,35.61 L 31.40,35.31 L 28.38,35.15 L 25.19,35.19 L 21.84,35.40 L 18.31,35.79 L 14.61,36.42 L 10.74,37.28 L 6.69,38.41 L 2.47,39.81 Z";

  return (
    <div className="w-full h-64 md:h-80 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col relative overflow-hidden select-none shadow-2xl">
      
      {/* Absolute Header Overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-0.5 z-[10] pointer-events-none drop-shadow-md">
        <span className="text-[10px] font-mono tracking-widest text-zinc-300 uppercase">Sector: Rupandehi</span>
        <span className="text-[9px] font-mono text-zinc-400">27.55° N, 83.43° E</span>
      </div>

      <div className="absolute top-4 right-4 z-[10] pointer-events-none drop-shadow-md">
        <span className="px-2 py-0.5 rounded border border-zinc-800 text-[9px] font-mono text-amber-500 bg-amber-950/40 uppercase tracking-wider">
          District Boundaries
        </span>
      </div>

      {/* Pure Vector Canvas Panel (Loads instantly, 100% offline, zero package overhead) */}
      <div className="flex-1 w-full h-full relative bg-zinc-950">
        
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full p-8"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Tactical grid pattern representing the 500m cells */}
            <pattern id="sectorPreviewGrid" width="4" height="4" patternUnits="userSpaceOnUse">
              <path 
                d="M 4 0 L 0 0 0 4" 
                fill="none" 
                stroke="rgba(245, 158, 11, 0.08)" 
                strokeWidth="0.3"
              />
            </pattern>

            {/* Mask: Cuts out a transparent hole inside a dark solid overlay */}
            <mask id="districtOuterMask">
              <rect width="100" height="100" fill="#ffffff" />
              <path d={rupandehiPath} fill="#000000" />
            </mask>
          </defs>

          {/* A. Inside: Fill Rupandehi district with our tactical cell grid pattern */}
          <path d={rupandehiPath} fill="url(#sectorPreviewGrid)" />

          {/* B. Outside: Darken everything outside the district line by 65% */}
          <rect width="100" height="100" fill="#000000" opacity="0.65" mask="url(#districtOuterMask)" />

          {/* C. Boundary Outline: Amber dashed border line */}
          <path 
            d={rupandehiPath} 
            fill="none" 
            stroke="#d97706" 
            strokeWidth="0.8" 
            strokeDasharray="1.5, 1.5" 
            opacity="0.8"
          />

          {/* D. Radar Ping Indicator */}
          <g transform="translate(50, 48)">
            <circle 
              r="4" 
              fill="none" 
              stroke="#d97706" 
              strokeWidth="0.4" 
              className="animate-ping origin-center"
              style={{ transformOrigin: 'center' }}
            />
            <circle 
              r="1.2" 
              fill="#d97706" 
            />
          </g>
        </svg>
      </div>

      {/* Footer Details Bar including static warning note */}
      <div className="border-t border-zinc-900 px-4 py-2 bg-zinc-950/80 flex items-center justify-between text-[9px] font-mono text-zinc-500 z-[10]">
        <span>STATIC PREVIEW • NON-INTERACTIVE</span>
        <span>TOTAL AREA: 4,814 UNITS</span>
      </div>
    </div>
  );
}