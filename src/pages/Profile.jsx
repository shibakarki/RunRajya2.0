import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfileStats } from '../hooks/useProfileStats';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useEditProfile } from '../hooks/useEditProfile';
import AuthModal from '../components/AuthModal';

const FACTIONS = {
  1: { name: 'Lumbini Guardians', color: '#EAB308', text: 'text-yellow-500', bg: 'bg-yellow-950/20', border: 'border-yellow-900/40' },
  2: { name: 'Devdaha Dynasty', color: '#3B82F6', text: 'text-blue-500', bg: 'bg-blue-950/20', border: 'border-blue-900/40' },
  3: { name: 'Tilaurakot Sentinels', color: '#10B981', text: 'text-emerald-500', bg: 'bg-emerald-950/20', border: 'border-emerald-900/40' },
  4: { name: 'Siddharth Force', color: '#EF4444', text: 'text-red-500', bg: 'bg-red-950/20', border: 'border-red-900/40' },
  5: { name: 'Manimukunda Warriors', color: '#A855F7', text: 'text-purple-500', bg: 'bg-purple-950/20', border: 'border-purple-900/40' }
};

export default function Profile() {
  const auth = useAuth();
  const user = auth.session?.user;
  
  // Profile Stats Hook
  const { stats, loading: statsLoading, error: statsErr } = useProfileStats(user?.id);
  
  // Leaderboards Hooks (Local and Global)
  const [activeTab, setActiveTab] = useState('local'); 
  const { rankings: localRankings, loading: localLoading, error: localErr } = useLeaderboard('rupandehi');
  const { isGlobalComingSoon } = useLeaderboard('global');

  // Edit Profile Mutation Hook
  const { updateProfile, loading: mutationLoading, error: mutationErr } = useEditProfile();

  // Local editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editFaction, setEditFaction] = useState(1);
  const [editTargetKm, setEditTargetKm] = useState(5.0); // Track customizable target km
  const [factionAlertConfirmed, setFactionAlertConfirmed] = useState(false);

  // Dynamic fallback: use user session metadata name if database record is empty
  const profileName = stats?.username === 'Explorer' && user?.user_metadata?.full_name
    ? user.user_metadata.full_name
    : stats?.username || 'Explorer';

  // Sync editing fields with database profiles values when editing initiates
  useEffect(() => {
    if (stats) {
      const defaultName = stats.username === 'Explorer' && user?.user_metadata?.full_name
        ? user.user_metadata.full_name
        : stats.username;
      setEditName(defaultName);
      setEditFaction(stats.factionId);
      setEditTargetKm(Number((stats.dailyTargetM / 1000).toFixed(1))); // Set baseline target
    }
  }, [stats, isEditing, user]);

  const handleAuthTrigger = () => {
    const openFn = auth.openModal || auth.setModalOpen || auth.toggleModal || auth.requireAuth;
    if (typeof openFn === 'function') {
      openFn(() => {
        window.location.reload();
      });
    }
  };

  // Gate check: user must be authenticated to view their profile statistics
  if (!user) {
    return (
      <div className="w-full h-full min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 select-none relative">
        <div className="max-w-md w-full text-center border border-zinc-900 bg-zinc-900/20 p-8 rounded-2xl flex flex-col items-center gap-4">
          <div className="p-3 bg-amber-950/30 border border-amber-900/50 text-amber-500 rounded-full animate-pulse">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold tracking-tight">Profile Access Restricted</h2>
          <p className="text-xs text-zinc-400">
            You must authenticate your explorer account to secure zone counts, view your rankings, or switch factions.
          </p>
          <button
            type="button"
            onClick={handleAuthTrigger}
            className="w-full mt-2 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
          >
            Authenticate Profile
          </button>
        </div>

        <AuthModal />
      </div>
    );
  }

  // Loading Skeleton State
  if (statsLoading) {
    return (
      <div className="w-full min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center">
        <div className="animate-pulse flex flex-col gap-4 w-full max-w-2xl">
          <div className="h-24 bg-zinc-900 rounded-2xl w-full" />
          <div className="grid grid-cols-4 gap-2 h-16 bg-zinc-900 rounded-2xl w-full" />
          <div className="h-64 bg-zinc-900 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  const userFaction = FACTIONS[stats.factionId] || { name: 'Unaligned', color: '#71717a', text: 'text-zinc-500', bg: 'bg-zinc-900/30', border: 'border-zinc-800' };
  const factionChanged = Number(editFaction) !== Number(stats.factionId);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (factionChanged && !factionAlertConfirmed) return;

    const response = await updateProfile(user.id, {
      name: editName,
      newFactionId: factionChanged ? parseInt(editFaction, 10) : undefined,
      dailyTargetM: Math.round(editTargetKm * 1000) // Convert km to meters
    });

    if (response.success) {
      setIsEditing(false);
      setFactionAlertConfirmed(false);
      window.location.reload();
    }
  };

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white p-4 md:p-8 lg:p-12 flex justify-center relative overflow-y-auto md:pt-20">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        
        {/* Profile Card Header */}
        <div className="border border-zinc-900 bg-zinc-900/20 rounded-2xl p-6 relative">
          {statsErr && (
            <div className="mb-4 p-3 text-xs bg-red-950/40 border border-red-800/40 text-red-200 rounded-lg">
              {statsErr}
            </div>
          )}

          {!isEditing ? (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl font-bold font-mono text-zinc-400 select-none">
                  {profileName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight">{profileName}</h1>
                  <span className={`inline-block text-[10px] font-mono uppercase font-semibold tracking-wider px-2 py-0.5 mt-1 border rounded-md ${userFaction.text} ${userFaction.bg} ${userFaction.border}`}>
                    {userFaction.name}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="py-2 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl text-xs font-mono tracking-wide transition-all"
              >
                EDIT PROFILE
              </button>
            </div>
          ) : (
            /* Editing Mutation Form layout */
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Configure Account Details</h2>
                <span className="text-[10px] font-mono text-amber-500 uppercase">Saving requires sync</span>
              </div>

              {mutationErr && (
                <div className="p-3 text-xs bg-red-950/40 border border-red-800/40 text-red-200 rounded-lg">
                  {mutationErr}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Explorer Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Daily Target (km)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="50"
                    step="0.5"
                    value={editTargetKm}
                    onChange={(e) => setEditTargetKm(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Change Competitive Faction</label>
                  <select
                    value={editFaction}
                    onChange={(e) => {
                      setEditFaction(parseInt(e.target.value, 10)); // Parse to integer
                      setFactionAlertConfirmed(false); 
                    }}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none"
                  >
                    {Object.entries(FACTIONS).map(([id, data]) => (
                      <option key={id} value={id}>{data.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Secure warnings display on Faction changes */}
              {factionChanged && (
                <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-xl flex flex-col gap-3">
                  <div className="flex gap-2 text-red-400">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-xs">
                      <span className="font-bold block uppercase tracking-wider">Warning: Faction Forfeit Cost</span>
                      <span className="block mt-1 leading-relaxed text-red-300">
                        Switching your competitive faction will immediately forfeit **all currently-owned zones** you have captured inside the Rupandehi district. This process is atomic and irreversible.
                      </span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      required
                      checked={factionAlertConfirmed}
                      onChange={(e) => setFactionAlertConfirmed(e.target.checked)}
                      className="rounded border-zinc-800 text-red-500 focus:ring-0 focus:ring-offset-0 bg-zinc-950 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-[11px] font-mono text-red-400 uppercase font-semibold">
                      I understand and agree to release my owned zones.
                    </span>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFactionAlertConfirmed(false);
                  }}
                  className="py-2 px-4 bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-mono rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutationLoading || (factionChanged && !factionAlertConfirmed)}
                  className="py-2 px-5 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold text-xs font-mono rounded-xl tracking-wider uppercase transition-all"
                >
                  {mutationLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Responsive Performance Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 select-none">
          <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl p-4 text-center">
            <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Active Target</span>
            <span className="block text-2xl font-black font-mono mt-1 text-amber-500">{(stats.dailyTargetM / 1000).toFixed(1)} km</span>
          </div>
          <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl p-4 text-center">
            <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Captured Zones</span>
            <span className="block text-2xl font-black font-mono mt-1 text-zinc-100">{stats.zonesOwnedCount}</span>
          </div>
          <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl p-4 text-center">
            <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Total Distance</span>
            <span className="block text-2xl font-black font-mono mt-1 text-zinc-100">{(stats.totalDistanceM / 1000).toFixed(2)} km</span>
          </div>
          <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl p-4 text-center">
            <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Energy Burned</span>
            <span className="block text-2xl font-black font-mono mt-1 text-zinc-100">{Math.round(stats.totalCaloriesKcal)} kcal</span>
          </div>
          <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl p-4 text-center col-span-2 md:col-span-1">
            <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Runs Logged</span>
            <span className="block text-2xl font-black font-mono mt-1 text-zinc-100">{stats.runsCompletedCount}</span>
          </div>
        </div>

        {/* Leaderboard Rankings Layout Panel */}
        <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl flex flex-col overflow-hidden">
          
          <div className="flex border-b border-zinc-900 bg-zinc-950/20">
            <button
              type="button"
              className={`flex-1 py-4 text-center font-bold text-xs tracking-wider uppercase transition-colors ${
                activeTab === 'local' 
                  ? 'text-amber-500 border-b-2 border-amber-500 bg-zinc-900/20' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              onClick={() => setActiveTab('local')}
            >
              Rupandehi Sector
            </button>
            <button
              type="button"
              className={`flex-1 py-4 text-center font-bold text-xs tracking-wider uppercase transition-colors ${
                activeTab === 'global' 
                  ? 'text-amber-500 border-b-2 border-amber-500 bg-zinc-900/20' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              onClick={() => setActiveTab('global')}
            >
              Global Grid
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'local' ? (
              localLoading ? (
                <div className="flex justify-center p-8 text-xs font-mono text-zinc-500">Loading rankings...</div>
              ) : localErr ? (
                <div className="p-3 text-xs bg-red-950/40 border border-red-800/40 text-red-200 rounded-lg">{localErr}</div>
              ) : localRankings.length === 0 ? (
                <div className="text-center p-8 text-xs font-mono text-zinc-500">No active tracking records logged in this sector.</div>
              ) : (
                <div className="overflow-x-auto select-none">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-500">
                        <th className="py-2 px-3 uppercase tracking-wider font-semibold">Rank</th>
                        <th className="py-2 px-3 uppercase tracking-wider font-semibold">Explorer</th>
                        <th className="py-2 px-3 uppercase tracking-wider font-semibold">Faction</th>
                        <th className="py-2 px-3 uppercase tracking-wider font-semibold text-right">Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localRankings.map((rank, index) => {
                        const rankFaction = FACTIONS[rank.factionId] || { name: 'Unaligned', text: 'text-zinc-500' };
                        const isSelf = rank.userId === user.id;

                        return (
                          <tr 
                            key={rank.userId} 
                            className={`border-b border-zinc-900/50 transition-colors ${
                              isSelf ? 'bg-amber-500/5 font-semibold text-amber-500' : 'hover:bg-zinc-900/20'
                            }`}
                          >
                            <td className="py-3 px-3">#{index + 1}</td>
                            <td className="py-3 px-3">{rank.username} {isSelf && '(You)'}</td>
                            <td className={`py-3 px-3 ${rankFaction.text}`}>{rankFaction.name}</td>
                            <td className="py-3 px-3 text-right">{rank.distanceKm.toFixed(2)} km</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-950/50 rounded-xl border border-zinc-900 select-none">
                <div className="inline-flex p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-full mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Global Grid Unlocked Soon</h3>
                <p className="text-xs text-zinc-500 mt-2 max-w-sm leading-relaxed">
                  Global cross-district syncing and regional representative structures are locked for development in v2.0. Focus on dominating your local Rupandehi sector!
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      <AuthModal />
    </div>
  );
}