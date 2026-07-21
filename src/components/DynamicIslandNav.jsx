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
  const signOut = auth?.signOut;
  
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

  const getInitials = (name) => {
    if (!name) return 'EX';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const initials = getInitials(user?.user_metadata?.full_name);
  const currentFaction = FACTION_ACCENTS[user?.user_metadata?.faction_id] || { name: 'EXP', text: 'text-zinc-500', border: 'border-zinc-800', bg: 'bg-zinc-900/30' };

  return (
    <>
      {/* 1. DESKTOP VIEW (NavMenu) */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 h-20 bg-transparent z-[1000] items-center justify-between px-8 select-none">
        
        {/* Left Section: Single floating block */}
        <div className="flex items-center">
          <div className="flex flex-col items-start gap-1.5 p-3 bg-zinc-950/90 border border-zinc-900 rounded-2xl shadow-xl">
            <Link to="/" className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center font-black text-zinc-950 font-mono text-sm shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              RR
            </Link>
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] font-mono uppercase tracking-wider ${
              networkOnline ? 'border-emerald-900/40 text-emerald-500 bg-emerald-950/10' : 'border-red-900/40 text-red-500 bg-red-950/10'
            }`}>
              <span className={`w-1 h-1 rounded-full ${networkOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span>{networkOnline ? 'Sync Active' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Middle Section: Floating Dynamic Island */}
        <div className="flex items-center justify-center">
          <div className="h-10 bg-zinc-950 border border-zinc-800/80 rounded-full px-6 flex items-center gap-6 shadow-[0_0_15px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all hover:border-zinc-700">
            <Link 
              to="/" 
              className={`text-xs font-mono tracking-wider uppercase transition-colors ${
                isActive('/') ? 'text-amber-500 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Home
            </Link>
            <span className="w-1 h-1 rounded-full bg-zinc-800" />
            <Link 
              to="/map" 
              className={`text-xs font-mono tracking-wider uppercase transition-colors ${
                isActive('/map') ? 'text-amber-500 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sector Grid
            </Link>
          </div>
        </div>

        {/* Right Section: Split profile initials block + logout block */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              <Link 
                to="/profile" 
                className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center font-bold font-mono text-zinc-100 hover:text-amber-500 hover:bg-zinc-850/80 transition-all shadow-md"
                title="Profile Dashboard"
              >
                {initials}
              </Link>

              <button
                type="button"
                onClick={() => signOut?.()}
                className="h-10 px-4 rounded-xl bg-red-950/25 border border-red-900/30 hover:border-red-500/50 hover:bg-red-950/40 text-red-500 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                title="Logout Session"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold font-mono text-zinc-500 select-none shadow-md">
                GST
              </div>

              <button
                type="button"
                onClick={handleAuthTrigger}
                className="h-10 px-5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black font-mono text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </nav>

      {/* 
        2. MOBILE VIEW (Preserved Dynamic Island)
        Repositioned top-center with absolute safety triggers.
      */}
      <div className="md:hidden fixed top-3 left-1/2 -translate-x-1/2 z-[1001] flex flex-col items-center select-none">
        <div 
          onClick={() => {
            if (!isExpanded) setIsExpanded(true);
          }}
          className={`flex items-center justify-between bg-zinc-950/90 backdrop-blur-lg border border-zinc-800 shadow-2xl transition-all duration-300 ease-out cursor-pointer ${
            isExpanded 
              ? 'rounded-2xl px-6 py-4 w-[280px]' 
              : 'rounded-full px-4 py-2.5 w-[140px]'
          }`}
        >
          {!isExpanded ? (
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
          ) : (
            <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-4 w-full cursor-default">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest font-black">RunRajya Grid</span>
                <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 border rounded ${currentFaction.text} ${currentFaction.bg} ${currentFaction.border}`}>
                  {currentFaction.name}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                <Link 
                  to="/" 
                  onClick={() => setIsExpanded(false)}
                  className={`text-xs font-mono tracking-wider uppercase transition-colors py-1 flex items-center justify-between ${
                    isActive('/') ? 'text-amber-500 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>Home</span>
                  {isActive('/') && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                </Link>
                <Link 
                  to="/map" 
                  onClick={() => setIsExpanded(false)}
                  className={`text-xs font-mono tracking-wider uppercase transition-colors py-1 flex items-center justify-between ${
                    isActive('/map') ? 'text-amber-500 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>Sector Map</span>
                  {isActive('/map') && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                </Link>
                <Link 
                  to="/profile" 
                  onClick={() => setIsExpanded(false)}
                  className={`text-xs font-mono tracking-wider uppercase transition-colors py-1 flex items-center justify-between ${
                    isActive('/profile') ? 'text-amber-500 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>Profile Dashboard</span>
                  {isActive('/profile') && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                </Link>

                {/* 
                  Mobile Logout Trigger:
                  Renders as a red-accented navigation item at the bottom of the list when logged in [10].
                */}
                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      signOut?.();
                      setIsExpanded(false);
                    }}
                    className="text-xs font-mono tracking-wider uppercase text-red-500 hover:text-red-400 py-1 flex items-center justify-between w-full text-left transition-colors border-t border-zinc-900/60 pt-2.5 mt-1"
                  >
                    <span>Logout Session</span>
                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Collapse Trigger */}
              <div 
                onClick={() => setIsExpanded(false)}
                className="flex justify-center pt-2 border-t border-zinc-900 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-zinc-600 hover:text-zinc-400 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}