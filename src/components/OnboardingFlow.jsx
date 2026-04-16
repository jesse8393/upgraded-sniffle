// src/components/OnboardingFlow.jsx
// 3-step signup → account creation → empty workspace.
//
// Step 1: Company name + full name + email + password
// Step 2: Multi-select service grid (15 tiles)
// Step 3: Welcome → creates auth user + org + fh_users row, signs in,
//         lands on empty Home.

import { useState } from "react";
import FieldhorseLogo from "./FieldhorseLogo";
import { useAuth } from "../contexts/AuthContext";
import { signIn as apiSignIn } from "../lib/auth";

const GOLD = "#C9963A";
const GOLD_DK = "#A07830";
const RED = "#C0392B";

// 15 service tiles — tile id is stored in fh_organizations.services[]
const SERVICES = [
  { id: "full_gc",                label: "Full General Contracting" },
  { id: "new_construction",       label: "New Construction" },
  { id: "renovation",             label: "Renovation / Remodeling" },
  { id: "concrete",               label: "Concrete" },
  { id: "framing",                label: "Framing" },
  { id: "roofing",                label: "Roofing" },
  { id: "electrical",             label: "Electrical" },
  { id: "plumbing",               label: "Plumbing" },
  { id: "hvac",                   label: "HVAC" },
  { id: "insulation",             label: "Insulation" },
  { id: "drywall",                label: "Drywall" },
  { id: "paint",                  label: "Paint" },
  { id: "outdoor_living",         label: "Outdoor Living / Hardscape" },
  { id: "insurance_restoration",  label: "Insurance Restoration" },
  { id: "demolition",             label: "Demolition" },
];

export default function OnboardingFlow({ onCancel }) {
  const { signUp, provisionNewAccount, refresh } = useAuth();

  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateStep1 = () => {
    if (!orgName.trim()) return "Company name is required.";
    if (!fullName.trim()) return "Your name is required.";
    if (!email.trim()) return "Email is required.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "That email doesn't look right.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    return null;
  };

  const nextFrom1 = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  };

  const toggleService = (id) => {
    setServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const nextFrom2 = () => {
    if (services.length < 1) { setError("Pick at least one service."); return; }
    setError("");
    setStep(3);
  };

  const finish = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Create Supabase auth user
      const { user, session } = await signUp(email, password);
      const authUserId = user?.id || session?.user?.id;
      if (!authUserId) {
        throw new Error("Signup did not return a user id.");
      }

      // If Supabase Auth is configured with email confirmations turned OFF,
      // session will exist immediately. If it's ON, we need to sign in to
      // obtain an authenticated JWT so the RLS policies let us insert the
      // org + fh_users row.
      if (!session) {
        try { await apiSignIn(email, password); } catch (_) { /* ignore; some projects require confirm */ }
      }

      // 2. Create fh_organizations + fh_users
      await provisionNewAccount({
        authUserId,
        name: fullName.trim(),
        email: email.trim(),
        orgName: orgName.trim(),
        services,
      });

      // 3. refresh() inside provisionNewAccount re-hydrates the context;
      //    <App /> will route into the authenticated view automatically.
      await refresh();
    } catch (err) {
      console.error("[onboarding] finish failed", err);
      setError(err?.message || "Could not create your account.");
      setStep(1);
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
      <div style={{ width: "100%", maxWidth: step === 2 ? 520 : 380 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <FieldhorseLogo size={48} surface="dark" showSub={false} />
        </div>

        <StepDots current={step} />

        {step === 1 && (
          <Step1
            orgName={orgName} setOrgName={setOrgName}
            fullName={fullName} setFullName={setFullName}
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            error={error}
            onNext={nextFrom1}
            onBack={onCancel}
          />
        )}

        {step === 2 && (
          <Step2
            services={services}
            toggle={toggleService}
            error={error}
            onBack={() => setStep(1)}
            onNext={nextFrom2}
          />
        )}

        {step === 3 && (
          <Step3
            fullName={fullName}
            orgName={orgName}
            error={error}
            loading={loading}
            onBack={() => setStep(2)}
            onFinish={finish}
          />
        )}
      </div>
    </div>
  );
}

// ─── Steps ───────────────────────────────────────────────────────────

function Step1({ orgName, setOrgName, fullName, setFullName, email, setEmail, password, setPassword, error, onNext, onBack }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onNext(); }}>
      <Header title="TELL US ABOUT YOU" sub="We'll set up a workspace for your business." />
      <Field label="Company name">
        <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Parker Construction Co." style={inputStyle} autoFocus />
      </Field>
      <Field label="Your full name">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jesse Parker" style={inputStyle} />
      </Field>
      <Field label="Email">
        <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} />
      </Field>
      <Field label="Password">
        <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" style={inputStyle} />
      </Field>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <Buttons
        primary={<PrimaryBtn type="submit">CONTINUE</PrimaryBtn>}
        secondary={<LinkBtn onClick={onBack}>← Back to sign in</LinkBtn>}
      />
    </form>
  );
}

function Step2({ services, toggle, error, onBack, onNext }) {
  return (
    <div>
      <Header title="WHAT DO YOU DO?" sub="Tap every service you offer. You can change these later." />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginBottom: 18,
        }}
      >
        {SERVICES.map((s) => (
          <ServiceTile
            key={s.id}
            label={s.label}
            selected={services.includes(s.id)}
            onTap={() => toggle(s.id)}
          />
        ))}
      </div>

      <div style={{ color: "#666", fontSize: 11, textAlign: "center", marginBottom: 12 }}>
        {services.length === 0 ? "Nothing selected yet" : `${services.length} selected`}
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <Buttons
        primary={<PrimaryBtn onClick={onNext} disabled={services.length === 0}>CONTINUE</PrimaryBtn>}
        secondary={<LinkBtn onClick={onBack}>← Back</LinkBtn>}
      />
    </div>
  );
}

function Step3({ fullName, orgName, error, loading, onBack, onFinish }) {
  const firstName = (fullName || "").split(" ")[0] || "there";
  return (
    <div>
      <div style={{ textAlign: "center", padding: "20px 0 28px" }}>
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 34,
            color: "#fff",
            letterSpacing: "0.08em",
            lineHeight: 1.1,
            marginBottom: 10,
          }}
        >
          WELCOME TO FIELDHORSE,<br />
          <span style={{ color: GOLD }}>{firstName.toUpperCase()}.</span>
        </div>
        <div style={{ color: "#999", fontSize: 14, lineHeight: 1.6, marginTop: 16 }}>
          Your workspace for <span style={{ color: "#fff", fontWeight: 700 }}>{orgName}</span> is ready.
          <br />Clean slate — no sample data, just you and your work.
        </div>
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <Buttons
        primary={<PrimaryBtn onClick={onFinish} disabled={loading}>{loading ? "CREATING…" : "LET'S GO"}</PrimaryBtn>}
        secondary={<LinkBtn onClick={onBack} disabled={loading}>← Back</LinkBtn>}
      />
    </div>
  );
}

// ─── Small primitives ────────────────────────────────────────────────

function Header({ title, sub }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 22 }}>
      <div
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 22,
          color: "#fff",
          letterSpacing: "0.12em",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div style={{ color: "#888", fontSize: 13 }}>{sub}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
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

function Buttons({ primary, secondary }) {
  return (
    <>
      {primary}
      <div style={{ textAlign: "center", marginTop: 16 }}>{secondary}</div>
    </>
  );
}

function PrimaryBtn({ children, disabled, onClick, type }) {
  return (
    <button
      type={type || "button"}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "16px 20px",
        borderRadius: 12,
        border: "none",
        background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DK})`,
        color: "#141414",
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 20,
        letterSpacing: "0.12em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        boxShadow: "0 8px 24px rgba(201,150,58,0.3)",
      }}
    >
      {children}
    </button>
  );
}

function LinkBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "none",
        border: "none",
        color: "#888",
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        padding: "4px 8px",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

function ErrorBanner({ children }) {
  return (
    <div
      style={{
        marginBottom: 14,
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
      {children}
    </div>
  );
}

function StepDots({ current }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: i === current ? 22 : 8,
            height: 6,
            borderRadius: 3,
            background: i <= current ? GOLD : "#333",
            transition: "all .2s",
          }}
        />
      ))}
    </div>
  );
}

function ServiceTile({ label, selected, onTap }) {
  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        position: "relative",
        padding: "14px 10px",
        minHeight: 68,
        borderRadius: 12,
        border: `1.5px solid ${selected ? GOLD : "#222"}`,
        background: selected ? "rgba(201,150,58,0.10)" : "#161616",
        color: selected ? "#fff" : "#ccc",
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.25,
        fontFamily: "inherit",
        cursor: "pointer",
        textAlign: "center",
        transition: "all .12s",
        boxShadow: selected ? "0 4px 16px rgba(201,150,58,0.25)" : "none",
      }}
    >
      {label}
      {selected && (
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: GOLD,
            color: "#141414",
            fontSize: 11,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(201,150,58,0.5)",
          }}
        >
          ✓
        </span>
      )}
    </button>
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
