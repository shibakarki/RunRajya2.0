import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

// AuthContext owns: current session, auth-modal visibility, and the
// "pending action" to resume once sign-in succeeds (e.g. if a user
// tapped "Start session" while signed out, that action should fire
// automatically after the modal closes, not require a second tap).
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Call this from any page/component to gate a protected action.
  // If signed in, runs the action immediately. If not, opens the
  // modal and remembers the action to run once auth succeeds.
  const requireAuth = useCallback((action) => {
    if (session) {
      action?.();
      return;
    }
    setPendingAction(() => action);
    setModalOpen(true);
  }, [session]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setPendingAction(null);
  }, []);

  const onAuthSuccess = useCallback(() => {
    setModalOpen(false);
    pendingAction?.();
    setPendingAction(null);
  }, [pendingAction]);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return (
    <AuthContext.Provider
      value={{ session, loading, modalOpen, requireAuth, closeModal, onAuthSuccess, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
