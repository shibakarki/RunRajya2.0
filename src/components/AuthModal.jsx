import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { supabase } from '../lib/supabase'; 

const FACTIONS = [
  { id: 'lumbini_guardians', name: 'Lumbini Guardians', color: '#EAB308', desc: 'Saffron/Gold - Guardians of the sacred birthplace' },
  { id: 'devdaha_dynasty', name: 'Devdaha Dynasty', color: '#3B82F6', desc: 'Blue - Representatives of ancient maternal heritage' },
  { id: 'tilaurakot_sentinels', name: 'Tilaurakot Sentinels', color: '#10B981', desc: 'Green - Protectors of historic ancient ruins' },
  { id: 'siddharth_force', name: 'Siddharth Force', color: '#EF4444', desc: 'Red - Force of progress, focus, and energy' },
  { id: 'manimukunda_warriors', name: 'Manimukunda Warriors', color: '#A855F7', desc: 'Purple - Based out of the historic hill-forest fort' }
];

export default function AuthModal() {
  const { modalOpen, closeModal, onAuthSuccess } = useAuth();
  const [activeTab, setActiveTab] = useState('signin'); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedFaction, setSelectedFaction] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    if (modalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, closeModal]);

  if (!modalOpen) return null;

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      closeModal();
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        if (!fullName.trim()) throw new Error('Full Name is required.');
        if (!selectedFaction) throw new Error('Please select a Faction.');

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, faction_id: selectedFaction }
          }
        });
        if (signUpError) throw signUpError;
      }

      if (onAuthSuccess) onAuthSuccess();
      closeModal();
    } catch (err) {
      setError(err.message || 'An authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl text-zinc-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex border-b border-zinc-800 bg-zinc-950/50">
          <button
            type="button"
            className={`flex-1 py-4 text-center font-bold text-xs tracking-wider uppercase transition-colors ${
              activeTab === 'signin' 
                ? 'border-b-2 border-amber-500 text-amber-500 bg-zinc-900/40' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            onClick={() => handleTabChange('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-4 text-center font-bold text-xs tracking-wider uppercase transition-colors ${
              activeTab === 'signup' 
                ? 'border-b-2 border-amber-500 text-amber-500 bg-zinc-900/40' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            onClick={() => handleTabChange('signup')}
          >
            Create Account
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <div className="text-center mb-1">
              <h2 className="text-base font-bold text-white">
                {activeTab === 'signin' ? 'Welcome Back, Explorer' : 'Join RunRajya'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {activeTab === 'signin' 
                  ? 'Access the live sector map to record claims.' 
                  : 'Establish your explorer profile to capture territory.'}
              </p>
            </div>

            {error && (
              <div className="p-3 text-xs bg-red-950/60 border border-red-800/40 text-red-200 rounded-lg whitespace-pre-wrap">
                {error}
              </div>
            )}

            {activeTab === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Faction Alignment</label>
                  <select
                    required
                    value={selectedFaction}
                    onChange={(e) => setSelectedFaction(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none"
                  >
                    <option value="" disabled>-- Select a competitive faction --</option>
                    {FACTIONS.map((faction) => (
                      <option key={faction.id} value={faction.id}>{faction.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold rounded-lg text-xs tracking-wider uppercase transition-colors"
              >
                {loading ? 'Processing...' : activeTab === 'signin' ? 'Sign In & Resume' : 'Register Profile'}
              </button>

              <button
                type="button"
                onClick={closeModal}
                className="w-full py-2 text-zinc-400 hover:text-zinc-200 rounded-lg text-xs transition-colors font-semibold"
              >
                Cancel and return
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}