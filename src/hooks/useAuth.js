// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    try {
      if (window.PublicKeyCredential) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometricAvailable(available);
      }
    } catch {
      setBiometricAvailable(false);
    }
  };

  // Save credentials to localStorage (email only — never store password)
  const saveRemembered = (email) => {
    localStorage.setItem('fh_remembered_email', email);
    localStorage.setItem('fh_remember', 'true');
  };

  const getRemembered = () => ({
    email: localStorage.getItem('fh_remembered_email') || '',
    remember: localStorage.getItem('fh_remember') === 'true',
  });

  const clearRemembered = () => {
    localStorage.removeItem('fh_remembered_email');
    localStorage.removeItem('fh_remember');
  };

  // Store biometric credential ID after first successful WebAuthn register
  const saveBiometricCredential = (credentialId) => {
    localStorage.setItem('fh_biometric_id', credentialId);
  };

  const getBiometricCredential = () => localStorage.getItem('fh_biometric_id');

  // Register Face ID / Touch ID for this device
  const registerBiometric = async (email) => {
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'Fieldhorse', id: window.location.hostname },
          user: {
            id: new TextEncoder().encode(email),
            name: email,
            displayName: 'Fieldhorse User',
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      });

      if (credential) {
        saveBiometricCredential(credential.id);
        return true;
      }
    } catch (err) {
      console.log('Biometric register failed:', err);
    }
    return false;
  };

  // Trigger Face ID / Touch ID verification then sign in
  const signInWithBiometric = async (email, password) => {
    try {
      const credentialId = getBiometricCredential();
      if (!credentialId) return false;

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          userVerification: 'required',
          allowCredentials: [{
            id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
            type: 'public-key',
          }],
          timeout: 60000,
        },
      });

      if (assertion) {
        // Biometric passed — sign in with stored credentials
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return !error;
      }
    } catch (err) {
      console.log('Biometric sign in failed:', err);
    }
    return false;
  };

  return {
    loading, setLoading,
    biometricAvailable,
    saveRemembered, getRemembered, clearRemembered,
    registerBiometric, signInWithBiometric, getBiometricCredential,
  };
};
