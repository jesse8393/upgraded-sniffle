// src/components/LoginScreen.jsx
// Tile-based login — Jesse / Buddy / Guest. Tap a tile → PIN pad overlay.
//
// PIN validation (in order):
//   1. Try the Supabase `fh_users` table by exact name match.
//   2. If Supabase fails or returns no row, fall back to LOCAL_PINS.
//   3. Only reject with "Incorrect PIN" if BOTH paths reject.
//
// LOCAL_PINS is the source of truth for the demo accounts. The Supabase table
// is consulted first so production deployments can update PINs without a
// rebuild, but the local fallback guarantees login works even if Supabase is
// unreachable or unconfigured.

import { useState } from "react";
import { supabase } from "../lib/supabase";
import FieldhorseLogo from "./FieldhorseLogo";

const GOLD = "#C9963A";
const RED = "#C0392B";

// Tile name MUST match the `name` column in fh_users for the Supabase lookup
// to succeed. If you change a tile name here, update the seed data too.
const KNOWN_USERS = [
  { id: "jesse",   name: "Jesse",          company: "Parker Construction Co.",       role: "owner",   initials: "JP", roleLabel: "OWNER" },
  { id: "buddy",   name: "Buddy",          company: "Partner Co.",                   role: "partner", initials: "B",  roleLabel: "PARTNER" },
  { id: "matthew", name: "Matthew McNeal", company: "McNeal Roofing & Construction", role: "partner", initials: "MM", roleLabel: "PARTNER" },
];

// Local fallback PINs — hardcoded source of truth.
// Keys are the EXACT tile names from KNOWN_USERS.name.
const LOCAL_PINS = {
  "Jesse": "1234",
  "Buddy": "5678",
  "Matthew McNeal": "0000",
  "Peyton": "2222",
};

const log = (...args) => console.log("[fh-login]", ...args);
const warn = (...args) => console.warn("[fh-login]", ...args);
const errLog = (...args) => console.error("[fh-login]", ...args);

export default function LoginScreen({ onLogin }) {
  const [view, setView] = useState("tiles"); // 'tiles' | 'pin' | 'guest'
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState("");
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const tapTile = (user) => {
    setSelectedUser(user);
    setPin("");
    setError("");
    setView("pin");
  };

  const verifyPin = async (finalPin) => {
    const pinToCheck = finalPin || pin;
    if (!selectedUser) {
      warn("verifyPin called with no selected user");
      return;
    }
    if (pinToCheck.length !== 4) {
      warn("verifyPin called with incomplete PIN", { length: pinToCheck.length });
      return;
    }
    setLoading(true);
    setError("");
    log("attempting login", { name: selectedUser.name, pinLength: pinToCheck.length });

    // ─── Step 1: Try Supabase fh_users ────────────────────
    let dbHit = null;
    try {
      const { data, error: dbErr } = await supabase
        .from("fh_users")
        .select("id, name, company, role, pin")
        .eq("name", selectedUser.name)
        .eq("pin", pinToCheck)
        .maybeSingle();

      if (dbErr) {
        warn("supabase query error — falling back to local PINs", {
          message: dbErr.message,
          code: dbErr.code,
        });
      } else if (!data) {
        warn("supabase returned no row for", selectedUser.name, "— falling back to local PINs");
      } else {
        log("supabase hit", { id: data.id, name: data.name });
        dbHit = data;
      }
    } catch (e) {
      warn("supabase threw — falling back to local PINs", e?.message);
    }

    if (dbHit) {
      const user = {
        id: dbHit.id,
        name: dbHit.name,
        company: dbHit.company || selectedUser.company,
        role: dbHit.role || selectedUser.role,
      };
      log("login OK via supabase", user.name);
      onLogin(user);
      setLoading(false);
      return;
    }

    // ─── Step 2: Local fallback ───────────────────────────
    const expectedPin = LOCAL_PINS[selectedUser.name];
    if (!expectedPin) {
      errLog("no local PIN configured for tile", selectedUser.name, "— check LOCAL_PINS / KNOWN_USERS name match");
      setError("Account misconfigured");
      triggerShake();
      setPin("");
      setLoading(false);
      return;
    }

    if (pinToCheck === expectedPin) {
      const user = {
        id: selectedUser.id,
        name: selectedUser.name,
        company: selectedUser.company,
        role: selectedUser.role,
      };
      log("login OK via local fallback", user.name);
      onLogin(user);
      setLoading(false);
      return;
    }

    warn("PIN rejected (local)", { name: selectedUser.name, entered: pinToCheck });
    setError("Incorrect PIN");
    triggerShake();
    setPin("");
    setLoading(false);
  };

  const enterGuest = () => {
    if (!guestName.trim()) {
      setError("Enter a display name.");
      triggerShake();
      return;
    }
    onLogin({
      id: "guest-" + Date.now(),
      name: guestName.trim(),
      company: "",
      role: "guest",
    });
  };

  const pressDigit = (d) => {
    setError("");
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) setTimeout(() => verifyPin(next), 90);
  };

  const backspace = () => {
    setError("");
    setPin((p) => p.slice(0, -1));
  };

  const backToTiles = () => {
    setView("tiles");
    setSelectedUser(null);
    setPin("");
    setError("");
    setGuestName("");
  };

  // ─── MAIN RENDER ──────────────────────────────────
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

      <div style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
          <FieldhorseLogo size={56} surface="dark" showSub={true} />
        </div>

        {view === "tiles" && (
          <div style={{ animation: "fh-fade-in .3s ease-out" }}>
            <div style={{ fontSize: 11, color: "#666", textAlign: "center", letterSpacing: ".2em", textTransform: "uppercase", fontWeight: 700, marginBottom: 18 }}>
              Select Your Account
            </div>

            {/* User tiles */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
              {KNOWN_USERS.map((u) => (
                <UserTile key={u.id} user={u} onTap={() => tapTile(u)} />
              ))}
            </div>

            {/* Guest link */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => { setView("guest"); setError(""); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: "8px 16px",
                }}
              >
                Continue as <span style={{ color: GOLD, fontWeight: 700 }}>Guest</span>
              </button>
            </div>
          </div>
        )}

        {view === "pin" && selectedUser && (
          <div style={{ animation: "fh-fade-in .3s ease-out" }}>
            {/* Selected user header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center", marginBottom: 22 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #C9963A, #A07830)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#141414",
                  fontWeight: 800,
                  fontSize: 16,
                  boxShadow: "0 4px 16px rgba(201,150,58,0.4)",
                }}
              >
                {selectedUser.initials}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>{selectedUser.name}</div>
                <div style={{ color: "#888", fontSize: 11, marginTop: 2 }}>{selectedUser.company}</div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#666", textAlign: "center", letterSpacing: ".2em", textTransform: "uppercase", fontWeight: 700, marginBottom: 18 }}>
              Enter PIN
            </div>

            {/* Dots */}
            <div
              style={{
                display: "flex",
                gap: 18,
                justifyContent: "center",
                marginBottom: 28,
                animation: shake ? "fh-shake .45s" : "none",
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: pin.length > i ? GOLD : "transparent",
                    border: `2px solid ${pin.length > i ? GOLD : "#3a3a3a"}`,
                    transition: "background .15s, border-color .15s",
                    boxShadow: pin.length > i ? `0 0 12px ${GOLD}55` : "none",
                  }}
                />
              ))}
            </div>

            {/* Number grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <PinButton key={d} label={d} onClick={() => pressDigit(String(d))} />
              ))}
              <div />
              <PinButton label="0" onClick={() => pressDigit("0")} />
              <PinButton label="⌫" onClick={backspace} />
            </div>

            {error && (
              <div
                style={{
                  marginBottom: 14,
                  padding: "10px 14px",
                  background: "rgba(192,57,43,.12)",
                  border: "1px solid rgba(192,57,43,.3)",
                  borderRadius: 10,
                  color: RED,
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {loading ? "Verifying…" : error}
              </div>
            )}

            <div style={{ textAlign: "center" }}>
              <button
                onClick={backToTiles}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: "8px 16px",
                }}
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {view === "guest" && (
          <div style={{ animation: "fh-fade-in .3s ease-out" }}>
            <div style={{ fontSize: 13, color: "#888", textAlign: "center", marginBottom: 22, lineHeight: 1.5 }}>
              Guest access is limited.<br />
              Enter a display name to continue.
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, color: "#444", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
                Display Name
              </div>
              <input
                type="text"
                value={guestName}
                onChange={(e) => { setGuestName(e.target.value); setError(""); }}
                placeholder="Your name"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && enterGuest()}
                style={{
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
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(192,57,43,.12)",
                  border: "1px solid rgba(192,57,43,.3)",
                  borderRadius: 10,
                  color: RED,
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: "center",
                  marginBottom: 14,
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={enterGuest}
              disabled={!guestName.trim()}
              style={{
                width: "100%",
                padding: "16px 20px",
                borderRadius: 12,
                border: "none",
                background: `linear-gradient(135deg, ${GOLD}, #A07830)`,
                color: "#141414",
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 20,
                letterSpacing: "0.12em",
                cursor: guestName.trim() ? "pointer" : "not-allowed",
                opacity: guestName.trim() ? 1 : 0.5,
                boxShadow: "0 8px 24px rgba(201,150,58,0.3)",
              }}
            >
              CONTINUE
            </button>

            <div style={{ textAlign: "center", marginTop: 22 }}>
              <button
                onClick={backToTiles}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── User Tile ─────────────────────────────────────
function UserTile({ user, onTap }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onTap}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        width: "100%",
        padding: "20px 22px",
        borderRadius: 16,
        border: `1.5px solid ${pressed ? GOLD : "#222"}`,
        background: pressed ? "rgba(201,150,58,0.10)" : "#161616",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 16,
        transition: "all .15s",
        boxShadow: pressed ? "0 8px 24px rgba(201,150,58,0.2)" : "0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #C9963A, #A07830)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#141414",
          fontWeight: 800,
          fontSize: 18,
          flexShrink: 0,
          boxShadow: "0 4px 16px rgba(201,150,58,0.3)",
        }}
      >
        {user.initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>{user.name}</div>
        <div style={{ color: "#888", fontSize: 12, marginTop: 3 }}>{user.company}</div>
      </div>
      <div
        style={{
          background: "rgba(201,150,58,0.15)",
          color: GOLD,
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: ".1em",
          padding: "4px 10px",
          borderRadius: 12,
          border: "1px solid rgba(201,150,58,0.3)",
        }}
      >
        {user.roleLabel}
      </div>
    </button>
  );
}

// ─── PIN Button ────────────────────────────────────
function PinButton({ label, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        height: 64,
        borderRadius: 16,
        border: `1.5px solid ${pressed ? GOLD : "#222"}`,
        background: pressed ? "rgba(201,150,58,0.15)" : "#161616",
        color: pressed ? GOLD : "#fff",
        fontSize: 24,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        cursor: "pointer",
        transition: "all .1s",
        boxShadow: pressed ? "0 0 16px rgba(201,150,58,0.2)" : "none",
      }}
    >
      {label}
    </button>
  );
}
