import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FACTION_ACCENTS = {
  1: { name: 'LGM', text: 'text-yellow-500', border: 'border-yellow-500/20', bg: 'bg-yellow-500/10' },
  2: { name: 'DDN', text: 'text-blue-500', border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
  3: { name: 'TST', text: 'text-emerald-500', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
  4: { name: 'SDF', text: 'text-red-500', border: 'border-red-500/20', bg: 'bg-red-500/10' },
  5: { name: 'MNW', text: 'text-purple-500', border: 'border-purple-500/20', bg: 'bg-purple-500/10' }
};

export default function DynamicIslandNav() {
  const location = useLocation();
  const auth = useAuth();
  const user = auth?.session?.user;
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [networkOnline, setNetworkOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setNetworkOnline(true);
    const handleOffline = () => setNetworkOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleAuthTrigger = () => {
    const openFn = auth?.openModal || auth?.setModalOpen || auth?.toggleModal || auth?.requireAuth;
    if (typeof openFn === 'function') {
      if (openFn.name === 'bound dispatchAction' || openFn.toString().includes('dispatch')) {
        openFn(true);
      } else {
        openFn();
      }
    }
  };

  const currentFaction = FACTION_ACCENTS[user?.user_metadata?.faction_id] || { name: 'EXP', text: 'text-zinc-500', border: 'border-zinc-800', bg: 'bg-zinc-900/30' };

  return (
    <>
      {/* 
        1. DESKTOP VIEW (NavMenu)
      */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 z-[1000] items-center justify-between px-8 select-none">
        
        <div className="flex items-center gap-4">
          <Link to="/" className="flex flex-col">
            <span className="text-sm font-black tracking-widest text-white uppercase font-sans">RunRajya</span>
            <span className="text-[8px] font-mono text-amber-500 uppercase tracking-widest">Nepal Sector</span>
          </Link>

          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-mono uppercase ${
            networkOnline ? 'border-emerald-900/40 text-emerald-500 bg-emerald-950/10' : 'border-red-900/40 text-red-500 bg-red-950/10'
          }`}>
            <span className={`w-1 h-1 rounded-full ${networkOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span>{networkOnline ? 'Sync Active' : 'Offline Mode'}</span>
          </div>
        </div>

        <div className="flex items-center gap-8 h-full">
          <Link 
            to="/" 
            className={`text-xs font-mono tracking-wider uppercase transition-colors relative flex items-center h-full ${
              isActive('/') ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Home
            {isActive('/') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
          </Link>
          <Link 
            to="/map" 
            className={`text-xs font-mono tracking-wider uppercase transition-colors relative flex items-center h-full ${
              isActive('/map') ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sector Grid
            {isActive('/map') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
          </Link>
          <Link 
            to="/profile" 
            className={`text-xs font-mono tracking-wider uppercase transition-colors relative flex items-center h-full ${
              isActive('/profile') ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Profile
            {isActive('/profile') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-500">{user.user_metadata?.full_name || 'Explorer'}</span>
              <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 border rounded ${currentFaction.text} ${currentFaction.bg} ${currentFaction.border}`}>
                {currentFaction.name}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAuthTrigger}
              className="py-1.5 px-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs font-mono uppercase tracking-wider transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* 
        2. MOBILE VIEW (Dynamic Island)
      */}
      <div className="md:hidden fixed top-3 left-1/2 -translate-x-1/2 z-[1001] flex flex-col items-center select-none">
        <div 
          onClick={() => setIsExpanded(prev => !prev)}
          className="flex items-center justify-between bg-zinc-950/90 backdrop-blur-lg border border-zinc-800 shadow-2xl transition-all duration-300 ease-out cursor-pointer rounded-full px-4 py-2.5 w-[140px]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${networkOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400 uppercase">
                {networkOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}