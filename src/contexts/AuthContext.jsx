// src/contexts/AuthContext.jsx
// Single source of truth for the signed-in user + their org.
// Wraps the whole app — components call useAuth() to get currentUser,
// signIn / signOut / signUp / updatePassword, and a refresh() hook.

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getSession,
  onAuthStateChange,
  loadProfile,
  signIn as apiSignIn,
  signOut as apiSignOut,
  signUp as apiSignUp,
  updatePassword as apiUpdatePassword,
  sendPasswordReset as apiSendPasswordReset,
  provisionNewAccount as apiProvisionNewAccount,
  clearMustResetPassword as apiClearMustResetPassword,
} from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // session        = supabase auth session object (or null)
  // currentUser    = hydrated profile: {id, auth_user_id, name, email, org_id, org_name, services, role, must_reset_password}
  // status         = 'loading' | 'authenticated' | 'anonymous'
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [status, setStatus] = useState('loading');

  // Hydrate profile whenever session changes
  const hydrate = useCallback(async (sess) => {
    if (!sess?.user?.id) {
      setCurrentUser(null);
      setStatus('anonymous');
      return;
    }
    const profile = await loadProfile(sess.user.id);
    if (profile) {
      setCurrentUser(profile);
      setStatus('authenticated');
    } else {
      // Auth session exists but no fh_users row — treat as anonymous
      // (onboarding flow will create the row, then call refresh()).
      setCurrentUser({
        id: null,
        auth_user_id: sess.user.id,
        email: sess.user.email,
        name: '',
        org_id: null,
        org_name: '',
        services: [],
        role: null,
        must_reset_password: false,
        needs_provisioning: true,
      });
      setStatus('authenticated');
    }
  }, []);

  useEffect(() => {
    let unsub = null;
    (async () => {
      const s = await getSession();
      setSession(s);
      await hydrate(s);
    })();
    unsub = onAuthStateChange(async (s) => {
      setSession(s);
      await hydrate(s);
    });
    return () => { if (unsub) unsub(); };
  }, [hydrate]);

  const refresh = useCallback(async () => {
    const s = await getSession();
    setSession(s);
    await hydrate(s);
  }, [hydrate]);

  // ─── Public API ──────────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    const data = await apiSignIn(email, password);
    // onAuthStateChange will fire and hydrate
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await apiSignOut();
    setCurrentUser(null);
    setSession(null);
    setStatus('anonymous');
  }, []);

  const signUp = useCallback(async (email, password) => {
    return apiSignUp(email, password);
  }, []);

  const updatePassword = useCallback(async (newPw) => {
    await apiUpdatePassword(newPw);
    if (currentUser?.id) {
      await apiClearMustResetPassword(currentUser.id);
    }
    await refresh();
  }, [currentUser?.id, refresh]);

  const sendPasswordReset = useCallback(async (email) => {
    return apiSendPasswordReset(email);
  }, []);

  const provisionNewAccount = useCallback(async (args) => {
    const result = await apiProvisionNewAccount(args);
    await refresh();
    return result;
  }, [refresh]);

  const value = {
    session,
    currentUser,
    status,
    isAuthenticated: status === 'authenticated' && !!currentUser && !currentUser.needs_provisioning,
    needsProvisioning: !!currentUser?.needs_provisioning,
    signIn,
    signOut,
    signUp,
    updatePassword,
    sendPasswordReset,
    provisionNewAccount,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider>');
  return ctx;
}
