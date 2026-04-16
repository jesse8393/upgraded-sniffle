// src/components/LoginScreen.jsx
// Email/password login — Supabase Auth only. PIN login removed 2026-04-16.
//
// Flow:
//   1. User enters email + password → supabase.auth.signInWithPassword
//   2. AuthContext re-hydrates the profile, must_reset_password is read.
//   3. If must_reset_password is true, <App /> routes to PasswordResetScreen.
//   4. "Forgot password?" → sends Supabase reset email.
//   5. "Create account" → routes to OnboardingFlow.

import { useState } from "react";
import FieldhorseLogo from "./FieldhorseLogo";
import { useAuth } from "../contexts/AuthContext";

const GOLD = "#C9963A";
const GOLD_DK = "#A07830";
const RED = "#C0392B";

export default function LoginScreen({ onRequestSignup }) {
  const { signIn, sendPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const submit = async (e) => {
    e?.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      triggerShake();
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      // AuthContext takes over from here.
    } catch (err) {
      console.warn("[fh-login] signIn failed", err?.message);
      setError(err?.message?.includes("Invalid") ? "Incorrect email or password." : (err?.message || "Sign in failed."));
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const forgot = async () => {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Enter your email first, then tap Forgot password.");
      triggerShake();
      return;
    }
    try {
      await sendPasswordReset(email);
      setInfo("Reset email sent. Check your inbox.");
    } catch (err) {
      setError(err?.message || "Could not send reset email.");
      triggerShake();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes fh-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes fh-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Radial gold glow */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(201,150,58,0.12) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: 380,
          position: "relative",
          zIndex: 1,
          animation: "fh-fade-in .3s ease-out",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <FieldhorseLogo size={56} surface="dark" showSub={true} />
        </div>

        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 28,
            color: "#fff",
            textAlign: "center",
            letterSpacing: "0.12em",
            marginBottom: 24,
          }}
        >
          SIGN IN
        </div>

        {/* Email */}
        <Field label="Email">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="you@company.com"
            style={inputStyle(shake)}
          />
        </Field>

        {/* Password */}
        <Field label="Password">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="••••••••"
            style={inputStyle(shake)}
          />
        </Field>

        {/* Forgot */}
        <div style={{ textAlign: "right", marginTop: -4, marginBottom: 14 }}>
          <button
            type="button"
            onClick={forgot}
            style={linkBtn}
          >
            Forgot password?
          </button>
        </div>

        {/* Messages */}
        {error && <Banner color={RED}>{error}</Banner>}
        {info && <Banner color={GOLD}>{info}</Banner>}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px 20px",
            marginTop: 4,
            borderRadius: 12,
            border: "none",
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DK})`,
            color: "#141414",
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 20,
            letterSpacing: "0.12em",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.6 : 1,
            boxShadow: "0 8px 24px rgba(201,150,58,0.3)",
          }}
        >
          {loading ? "SIGNING IN…" : "SIGN IN"}
        </button>

        {/* Create account */}
        <div style={{ textAlign: "center", marginTop: 22 }}>
          <span style={{ color: "#888", fontSize: 13 }}>New to Fieldhorse? </span>
          <button
            type="button"
            onClick={onRequestSignup}
            style={{ ...linkBtn, color: GOLD, fontWeight: 700 }}
          >
            Create account
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Small primitives (local to this file) ───────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 9,
          color: "#555",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Banner({ children, color }) {
  return (
    <div
      style={{
        marginBottom: 12,
        padding: "10px 14px",
        background: `${color}22`,
        border: `1px solid ${color}55`,
        borderRadius: 10,
        color,
        fontSize: 12,
        fontWeight: 600,
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

const inputStyle = (shake) => ({
  width: "100%",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid #222",
  background: "#161616",
  color: "#fff",
  fontSize: 14,
  fontFamily: "inherit",
  boxSizing: "border-box",
  outline: "none",
  animation: shake ? "fh-shake .45s" : "none",
});

const linkBtn = {
  background: "none",
  border: "none",
  color: "#888",
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
  padding: "4px 8px",
};
