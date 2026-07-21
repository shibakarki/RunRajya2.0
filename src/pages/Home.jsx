import React from 'react';
import { Link } from 'react-router-dom';
import { useGlobalStats } from '../hooks/useGlobalStats';
import DistrictMapPreview from '../components/DistrictMapPreview';

const FACTION_CARDS = [
  { id: 1, name: 'Lumbini Guardians', color: 'text-yellow-500', border: 'border-yellow-900/40', bg: 'bg-yellow-950/10', desc: 'Guardians of the sacred birthplace. Peaceful, focused, and steady.' },
  { id: 2, name: 'Devdaha Dynasty', color: 'text-blue-500', border: 'border-blue-900/40', bg: 'bg-blue-950/10', desc: 'Representatives of ancient maternal roots. Strategic and calculated.' },
  { id: 3, name: 'Tilaurakot Sentinels', color: 'text-emerald-500', border: 'border-emerald-900/40', bg: 'bg-emerald-950/10', desc: 'Protectors of historic kingdom ruins. Balanced, enduring, and resilient.' },
  { id: 4, name: 'Siddharth Force', color: 'text-red-500', border: 'border-red-900/40', bg: 'bg-red-950/10', desc: 'Force of active progress. High velocity, energetic, and aggressive.' },
  { id: 5, name: 'Manimukunda Warriors', color: 'text-purple-500', border: 'border-purple-900/40', bg: 'bg-purple-950/10', desc: 'Fortress tactical division. Strong, defensive, and unyielding.' }
];

export default function Home() {
  const { globalStats, loading, error } = useGlobalStats();

  const formatGlobalDistance = (meters) => {
    if (!meters || meters <= 0) return '0.00';
    return (meters / 1000).toFixed(2);
  };

  return (
    /* pt-20 applied globally to create spacing on both mobile and desktop initial loads */
    <div className="w-full min-h-screen bg-zinc-950 text-white flex flex-col items-center overflow-y-auto pt-20">
      
      {/* Tactical Header with capped max-width for 4K displays */}
      <header className="w-full max-w-7xl px-6 md:px-12 py-6 flex items-center justify-between border-b border-zinc-900 select-none mx-auto">
        <div className="flex flex-col">
          <span className="text-sm font-black tracking-widest text-white uppercase font-sans">RunRajya</span>
          <span className="text-[9px] font-mono text-amber-500 uppercase tracking-wider">Sector-Grid Fitness v2.0</span>
        </div>
        <Link 
          to="/map" 
          className="px-4 py-2 border border-zinc-800 hover:border-amber-500/50 bg-zinc-900 hover:bg-zinc-900/50 rounded-xl text-xs font-mono text-zinc-300 hover:text-amber-500 transition-all uppercase tracking-wider"
        >
          Open Sector Grid
        </Link>
      </header>

      {/* Main Grid Wrapper capped to max-width to keep typography readable on 4K */}
      <main className="w-full max-w-7xl px-6 md:px-12 py-12 flex flex-col gap-12 md:gap-16 lg:gap-20 mx-auto">
        
        {/* Hero split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
          
          <div className="flex flex-col gap-6">
            <div className="inline-flex max-w-fit px-2.5 py-0.5 rounded border border-amber-900/40 text-[9px] font-mono text-amber-500 bg-amber-950/10 uppercase tracking-widest animate-pulse">
              System Active: Rupandehi District, Nepal
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-none text-white uppercase">
              Claim Your Sector.<br />
              Dominate the Grid.
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-lg">
              RunRajya lays a digital 500m × 500m tactical coordinate map over the geography of Rupandehi. Connect your phone’s GPS to join one of five competitive factions, claim active grid zones, and sync physical running progress to local leaderboards.
            </p>
            <div className="flex gap-3">
              <Link
                to="/map"
                className="py-3 px-6 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black font-mono text-xs tracking-wider rounded-xl uppercase transition-all shadow-lg shadow-amber-500/5"
              >
                Launch Active Map
              </Link>
              <a
                href="#factions"
                className="py-3 px-5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/50 text-zinc-300 hover:text-white font-bold font-mono text-xs tracking-wider rounded-xl uppercase transition-all"
              >
                Inspect Factions
              </a>
            </div>
          </div>

          <div className="w-full max-w-xl lg:max-w-none mx-auto lg:mx-0">
            <DistrictMapPreview />
          </div>
        </div>

        {/* Live Global Stats Band */}
        <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col gap-2 mb-6 pb-4 border-b border-zinc-900">
            <h2 className="text-xs md:text-sm font-mono text-zinc-400 uppercase tracking-wider">Live Platform Status</h2>
            <p className="text-[10px] text-zinc-600 font-mono uppercase">Real-time aggregate telemetry synced across the district</p>
          </div>

          {error && (
            <div className="mb-4 p-3 text-xs bg-red-950/40 border border-red-800/40 text-red-200 rounded-lg">
              Telemetry Sync Warning: {error}. Displaying zero values.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12 text-center">
            
            <div className="flex flex-col gap-1">
              <span className="text-[10px] md:text-xs font-mono text-zinc-500 uppercase tracking-widest">Active Explorers</span>
              <span className="text-3xl lg:text-4xl font-black font-mono mt-1 text-white">
                {loading ? '...' : (globalStats?.activePlayersCount || 0)}
              </span>
              <span className="text-[9px] font-mono text-zinc-600 uppercase mt-1">Verified Accounts</span>
            </div>

            <div className="flex flex-col gap-1 border-y md:border-y-0 md:border-x border-zinc-900 py-4 md:py-0">
              <span className="text-[10px] md:text-xs font-mono text-zinc-500 uppercase tracking-widest">Sector Distance Sync</span>
              <span className="text-3xl lg:text-4xl font-black font-mono mt-1 text-amber-500">
                {loading ? '...' : formatGlobalDistance(globalStats?.totalCombinedDistanceM)} km
              </span>
              <span className="text-[9px] font-mono text-zinc-600 uppercase mt-1">Total Distance Logged</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] md:text-xs font-mono text-zinc-500 uppercase tracking-widest">Captured Sectors</span>
              <span className="text-3xl lg:text-4xl font-black font-mono mt-1 text-white">
                {loading ? '...' : (globalStats?.totalZonesCapturedCount || 0)}
              </span>
              <span className="text-[9px] font-mono text-zinc-600 uppercase mt-1">Out of 4,814 total grids</span>
            </div>

          </div>
        </div>

        {/* Rule of Play Section */}
        <div className="flex flex-col gap-6">
          <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-2">
            Standard Rules of Engagement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            
            <div className="border border-zinc-900 bg-zinc-950/40 rounded-xl p-5 lg:p-6 flex flex-col gap-2">
              <div className="text-amber-500 font-mono font-bold text-xs uppercase">Step 01 / Initialize</div>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                Open the map, calibrate your compass rose, and start an active run session. GPS coordinates will monitor your location in real time.
              </p>
            </div>

            <div className="border border-zinc-900 bg-zinc-950/40 rounded-xl p-5 lg:p-6 flex flex-col gap-2">
              <div className="text-amber-500 font-mono font-bold text-xs uppercase">Step 02 / Territory Capture</div>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                Physical entry into any unclaimed 500m coordinate grid paints the territory instantly under your faction’s control (optimistic UI rendering).
              </p>
            </div>

            <div className="border border-zinc-900 bg-zinc-950/40 rounded-xl p-5 lg:p-6 flex flex-col gap-2">
              <div className="text-amber-500 font-mono font-bold text-xs uppercase">Step 03 / Resolve & Sync</div>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                Once connection is re-established, the database synchronizes. In contested zones, standard chronological rules apply: the earliest physical arrival wins.
              </p>
            </div>

          </div>
        </div>

        {/* Factions Section */}
        <div id="factions" className="flex flex-col gap-6">
          <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-2">
            Competitive Faction Division
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
            {FACTION_CARDS.map((faction) => (
              <div 
                key={faction.id} 
                className={`border ${faction.border} ${faction.bg} rounded-xl p-4 flex flex-col justify-between min-h-[160px] select-none`}
              >
                <div>
                  <span className={`text-[10px] font-mono uppercase tracking-widest font-black ${faction.color}`}>
                    Sector {String(faction.id).padStart(2, '0')}
                  </span>
                  <h4 className="text-xs font-black tracking-tight text-white mt-1">
                    {faction.name}
                  </h4>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed mt-4">
                  {faction.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-900 bg-zinc-950/40 py-8 px-6 mt-12 flex justify-center text-[10px] font-mono text-zinc-600 select-none">
        <span>RUNRAJYA GAME ENGINE v2.0 • ACADEMIC BUILD</span>
      </footer>
    </div>
  );
}