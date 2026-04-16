// src/lib/auth.js
// Thin wrappers around supabase.auth so components don't import the SDK directly.
// All auth-related DB reads (fh_users + fh_organizations hydration) also live here.

import { supabase } from './supabase';

// ─── SESSION ──────────────────────────────────────────────────────────
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

export function onAuthStateChange(cb) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

// ─── SIGN IN / OUT ────────────────────────────────────────────────────
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ─── SIGN UP ──────────────────────────────────────────────────────────
// Creates an auth user only. The caller is responsible for inserting
// the fh_organizations row + the fh_users row.
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data;
}

// ─── PASSWORD ─────────────────────────────────────────────────────────
export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

// ─── APP-SIDE PROFILE HYDRATION ───────────────────────────────────────
// Given a supabase auth user id, loads the matching fh_users row and
// its fh_organizations row. Returns null if either lookup fails.
export async function loadProfile(authUserId) {
  if (!authUserId) return null;

  const { data: userRow, error: userErr } = await supabase
    .from('fh_users')
    .select('id, auth_user_id, org_id, name, email, company, role, must_reset_password')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  if (userErr) {
    console.error('[auth] loadProfile: fh_users lookup failed', userErr);
    return null;
  }
  if (!userRow) return null;

  let org = null;
  if (userRow.org_id) {
    const { data: orgRow, error: orgErr } = await supabase
      .from('fh_organizations')
      .select('id, name, services, subscription_tier')
      .eq('id', userRow.org_id)
      .maybeSingle();
    if (orgErr) {
      console.error('[auth] loadProfile: fh_organizations lookup failed', orgErr);
    } else {
      org = orgRow;
    }
  }

  return {
    id: userRow.id,
    auth_user_id: userRow.auth_user_id,
    name: userRow.name,
    email: userRow.email,
    company: userRow.company || org?.name || '',
    role: userRow.role || 'owner',
    must_reset_password: !!userRow.must_reset_password,
    org_id: userRow.org_id,
    org_name: org?.name || userRow.company || '',
    services: org?.services || [],
    subscription_tier: org?.subscription_tier || 'solo',
  };
}

// ─── ONBOARDING ───────────────────────────────────────────────────────
// Called from OnboardingFlow after signUp. Creates the org, then the
// fh_users row linking the fresh auth user to that org.
export async function provisionNewAccount({ authUserId, name, email, orgName, services }) {
  const { data: org, error: orgErr } = await supabase
    .from('fh_organizations')
    .insert({
      name: orgName,
      services: services || [],
      subscription_tier: 'solo',
    })
    .select('id, name, services')
    .single();
  if (orgErr) throw orgErr;

  const { data: user, error: userErr } = await supabase
    .from('fh_users')
    .insert({
      auth_user_id: authUserId,
      org_id: org.id,
      name,
      email: email.trim().toLowerCase(),
      company: orgName,
      role: 'owner',
      must_reset_password: false,
    })
    .select('id, name, email, role, org_id, must_reset_password')
    .single();
  if (userErr) throw userErr;

  return { org, user };
}

// ─── PASSWORD RESET FLAG ──────────────────────────────────────────────
export async function clearMustResetPassword(fhUserId) {
  const { error } = await supabase
    .from('fh_users')
    .update({ must_reset_password: false })
    .eq('id', fhUserId);
  if (error) throw error;
}
