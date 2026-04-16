// src/components/PasswordResetScreen.jsx
// Shown after sign-in when currentUser.must_reset_password === true.
// Requires user to set a real password before they can reach the app.

import { useState } from "react";
import FieldhorseLogo from "./FieldhorseLogo";
import { useAuth } from "../contexts/AuthContext";

const GOLD = "#C9963A";
const GOLD_DK = "#A07830";
const RED = "#C0392B";

export default function PasswordResetScreen() {
  const { currentUser, updatePassword, signOut } = useAuth();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setError("");
    if (pw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (pw !== pw2) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(pw);
      // AuthContext refreshes → must_reset_password=false → App routes out.
    } catch (err) {
      setError(err?.message || "Could not update password.");
    } finally {
      setLoading(false);
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
      }}
    >
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <FieldhorseLogo size={56} surface="dark" showSub={true} />
        </div>

        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 26,
            color: "#fff",
            textAlign: "center",
            letterSpacing: "0.1em",
            marginBottom: 10,
          }}
        >
          SET YOUR PASSWORD
        </div>
        <div style={{ color: "#888", fontSize: 13, textAlign: "center", marginBottom: 22, lineHeight: 1.5 }}>
          Welcome{currentUser?.name ? `, ${currentUser.name.split(" ")[0]}` : ""}. Choose a new password to secure your account.
        </div>

        <Field label="New password">
          <input
            type="password"
            autoComplete="new-password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(""); }}
            placeholder="At least 8 characters"
            style={inputStyle}
          />
        </Field>

        <Field label="Confirm password">
          <input
            type="password"
            autoComplete="new-password"
            value={pw2}
            onChange={(e) => { setPw2(e.target.value); setError(""); }}
            placeholder="Re-enter password"
            style={inputStyle}
          />
        </Field>

        {error && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 14px",
              background: `${RED}22`,
              border: `1px solid ${RED}55`,
              borderRadius: 10,
              color: RED,
              fontSize: 12,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

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
          {loading ? "SAVING…" : "SAVE & CONTINUE"}
        </button>

        <div style={{ textAlign: "center", marginTop: 22 }}>
          <button
            type="button"
            onClick={() => signOut()}
            style={{
              background: "none",
              border: "none",
              color: "#777",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Sign out
          </button>
        </div>
      </form>
    </div>
  );
}

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

const inputStyle = {
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
};
