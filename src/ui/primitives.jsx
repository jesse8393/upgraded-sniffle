// src/ui/primitives.jsx
// Every shared UI primitive. Used by App.jsx and the screen files in src/screens/.
// No screen should hand-roll a Card, Button, Pill, Stat, or Field anywhere.

import Icon from "../components/Icon";
import { T, SP, R, FS, LS, MO, FF, ELEV } from "./tokens";
import { STATUS_CFG, TYPE_CFG } from "../lib/domain";

// Re-export tokens so screens can do `import { T, SP, ..., Card, Btn } from "../ui"`.
export { T, SP, R, FS, LS, MO, FF, ELEV };

// ─── BADGE ────────────────────────────────────────────────
// Status chip. Uses STATUS_CFG so colors stay aligned with the rest of the app.
export const Badge = ({ s, children }) => {
  const c = STATUS_CFG[s] || STATUS_CFG.new;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center",
      background:c.bg, color:c.color, border:`1px solid ${c.border}`,
      padding:"3px 9px", borderRadius:R.full,
      fontSize:FS.meta-1, fontWeight:700, letterSpacing:LS.label,
      whiteSpace:"nowrap", textTransform:"uppercase",
    }}>{children || c.label}</span>
  );
};

// ─── TYPE BADGE ───────────────────────────────────────────
// Project type tag. Text only, no emoji.
export const TypeBadge = ({ t }) => {
  const c = TYPE_CFG[t] || TYPE_CFG["renovation"];
  return (
    <span style={{
      display:"inline-flex", alignItems:"center",
      background:c.color+"1a", color:c.color, border:`1px solid ${c.color}33`,
      padding:"3px 9px", borderRadius:R.full,
      fontSize:FS.meta-1, fontWeight:600, letterSpacing:LS.label,
      whiteSpace:"nowrap", textTransform:"uppercase",
    }}>{c.label}</span>
  );
};

// ─── AVATAR ───────────────────────────────────────────────
// Initials in a square card. Color-coded by project type if provided.
export const Avatar = ({ name, size=40, type }) => {
  const init = (name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  const tc = TYPE_CFG[type];
  const bg = tc ? tc.color+"1a" : T.goldBg;
  const color = tc ? tc.color : T.gold;
  const border = tc ? tc.color+"55" : T.goldBorder;
  return (
    <div style={{
      width:size, height:size,
      borderRadius:R.md,
      background:bg, color, border:`1px solid ${border}`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:700, fontSize:Math.round(size*.32),
      flexShrink:0, fontFamily:FF.sans,
      letterSpacing:LS.tight,
    }}>{init}</div>
  );
};

// ─── CARD ─────────────────────────────────────────────────
// Flat surface, single border, optional left accent. No shadow.
// Pass `padded` for default padding; otherwise screens supply their own.
// Pass `interactive` for hover lift and gold border.
export const Card = ({ children, style, accent, onClick, padded=false, interactive }) => {
  const liftable = interactive || !!onClick;
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        background: T.bgCard,
        borderRadius: R.lg,
        border: `1px solid ${T.border}`,
        borderLeft: accent ? `2px solid ${accent}` : `1px solid ${T.border}`,
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: `border-color ${MO.fast}, transform ${MO.fast}, background ${MO.fast}`,
        ...(padded && { padding: SP[4] }),
        ...style,
      }}
      onMouseEnter={liftable ? (e)=>{
        e.currentTarget.style.borderColor = "rgba(201,150,58,.35)";
        e.currentTarget.style.transform = "translateY(-1px)";
      } : undefined}
      onMouseLeave={liftable ? (e)=>{
        e.currentTarget.style.borderColor = T.border;
        e.currentTarget.style.transform = "translateY(0)";
      } : undefined}
      onFocus={onClick ? (e)=>{
        e.currentTarget.style.outline = `2px solid ${T.gold}`;
        e.currentTarget.style.outlineOffset = "2px";
      } : undefined}
      onBlur={onClick ? (e)=>{
        e.currentTarget.style.outline = "none";
      } : undefined}
    >{children}</div>
  );
};

// ─── FIELD ────────────────────────────────────────────────
// Labeled control wrapper. Single source for label/hint/error styling.
export const Field = ({ label, hint, error, children }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:SP[2] }}>
    {label && (
      <label style={{
        fontSize:FS.meta-1, fontWeight:700, color:T.textSecondary,
        textTransform:"uppercase", letterSpacing:LS.uppercase,
        lineHeight:1,
      }}>{label}</label>
    )}
    {children}
    {hint && !error && <span style={{ fontSize:FS.meta, color:T.textMuted }}>{hint}</span>}
    {error && <span style={{ fontSize:FS.meta, color:T.red, fontWeight:600 }}>{error}</span>}
  </div>
);

// ─── INPUT / TEXTAREA / SELECT ────────────────────────────
const baseControlStyle = {
  width:"100%",
  padding:`${SP[3]}px ${SP[4]-2}px`,
  borderRadius:R.md,
  border:`1px solid ${T.border}`,
  background:T.bgSection,
  color:T.text,
  fontSize:FS.body,
  fontFamily:FF.sans,
  boxSizing:"border-box",
  outline:"none",
  transition:`border-color ${MO.fast}, box-shadow ${MO.fast}`,
};
const focusOn = (e) => {
  e.target.style.borderColor = T.gold;
  e.target.style.boxShadow = `0 0 0 3px rgba(201,150,58,.15)`;
};
const focusOff = (e) => {
  e.target.style.borderColor = T.border;
  e.target.style.boxShadow = "none";
};

export const Input = ({ ...p }) => (
  <input
    {...p}
    onFocus={(e)=>{ focusOn(e); p.onFocus?.(e); }}
    onBlur={(e)=>{ focusOff(e); p.onBlur?.(e); }}
    style={{ ...baseControlStyle, ...p.style }}
  />
);

export const TextArea = ({ ...p }) => (
  <textarea
    {...p}
    onFocus={(e)=>{ focusOn(e); p.onFocus?.(e); }}
    onBlur={(e)=>{ focusOff(e); p.onBlur?.(e); }}
    style={{ ...baseControlStyle, resize:"vertical", lineHeight:1.6, ...p.style }}
  />
);

export const Select = ({ children, ...p }) => (
  <select
    {...p}
    onFocus={(e)=>{ focusOn(e); p.onFocus?.(e); }}
    onBlur={(e)=>{ focusOff(e); p.onBlur?.(e); }}
    style={{
      ...baseControlStyle,
      appearance:"none",
      backgroundImage:`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")`,
      backgroundRepeat:"no-repeat",
      backgroundPosition:`right ${SP[3]}px center`,
      paddingRight:SP[8],
      cursor:"pointer",
      ...p.style,
    }}
  >{children}</select>
);

// ─── BUTTON ───────────────────────────────────────────────
// Three variants × two sizes. Back-compat with legacy `gold/ghost/sm` props.
//   variant: 'primary' (gold) | 'secondary' (filled dark) | 'ghost' (outline)
//   size:    'md' (default) | 'sm'
export const Btn = ({ children, variant, size, full, sm, gold, ghost, leftIcon, rightIcon, style, ...p }) => {
  if (!variant) variant = gold ? "primary" : ghost ? "ghost" : "secondary";
  if (!size) size = sm ? "sm" : "md";
  const isPrimary = variant === "primary";
  const isGhost = variant === "ghost";
  const isSecondary = variant === "secondary";
  const padY = size === "sm" ? SP[2]+1 : SP[3];
  const padX = size === "sm" ? SP[4] : SP[5];
  const fontSize = size === "sm" ? FS.meta : FS.body;
  return (
    <button
      {...p}
      style={{
        display: full ? "flex" : "inline-flex", alignItems:"center", justifyContent:"center", gap:SP[2],
        padding:`${padY}px ${padX}px`,
        borderRadius:R.md,
        border: isGhost ? `1px solid ${T.border}` : "none",
        background: isPrimary ? T.gold : isSecondary ? T.bgSection : "transparent",
        color: isPrimary ? "#141414" : T.text,
        fontWeight: isPrimary ? 700 : 600,
        fontSize, lineHeight:1,
        fontFamily:FF.sans,
        cursor: p.disabled ? "not-allowed" : "pointer",
        width: full ? "100%" : "auto",
        opacity: p.disabled ? 0.5 : 1,
        letterSpacing: LS.normal,
        boxShadow: "none",
        transition: `transform ${MO.fast}, background ${MO.fast}, border-color ${MO.fast}, box-shadow ${MO.fast}, outline ${MO.fast}`,
        whiteSpace:"nowrap",
        outline: "none",
        ...style,
      }}
      onMouseEnter={(e)=>{
        if (p.disabled) return;
        if (isPrimary) e.currentTarget.style.boxShadow = "0 6px 20px rgba(201,150,58,.4)";
        if (isGhost)   e.currentTarget.style.borderColor = "rgba(201,150,58,.4)";
        if (isSecondary) e.currentTarget.style.background = "rgba(255,255,255,.05)";
      }}
      onMouseLeave={(e)=>{
        e.currentTarget.style.transform = "scale(1)";
        if (isPrimary) e.currentTarget.style.boxShadow = "none";
        if (isGhost)   e.currentTarget.style.borderColor = T.border;
        if (isSecondary) e.currentTarget.style.background = T.bgSection;
      }}
      onMouseDown={(e)=>{ if(!p.disabled) e.currentTarget.style.transform="scale(.97)"; }}
      onMouseUp={(e)=>{ e.currentTarget.style.transform="scale(1)"; }}
      onFocus={(e)=>{
        e.currentTarget.style.outline = `2px solid ${T.gold}`;
        e.currentTarget.style.outlineOffset = "2px";
      }}
      onBlur={(e)=>{
        e.currentTarget.style.outline = "none";
      }}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
};

// ─── ICON BUTTON ──────────────────────────────────────────
// Square 36×36 used in app chrome (top bar, modals).
export const IconButton = ({ icon, active, onClick, label, size=36, style, ...p }) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={label}
    {...p}
    style={{
      width:size, height:size,
      borderRadius:R.md,
      border:`1px solid ${active ? T.gold : T.border}`,
      background: active ? T.goldBg : T.bgCard,
      color: active ? T.gold : T.textSecondary,
      cursor:"pointer",
      display:"flex", alignItems:"center", justifyContent:"center",
      transition:`all ${MO.fast}`,
      outline:"none",
      ...style,
    }}
    onMouseEnter={(e)=>{
      if (active) return;
      e.currentTarget.style.borderColor = "rgba(201,150,58,.35)";
      e.currentTarget.style.color = T.text;
    }}
    onMouseLeave={(e)=>{
      if (active) return;
      e.currentTarget.style.borderColor = T.border;
      e.currentTarget.style.color = T.textSecondary;
    }}
    onFocus={(e)=>{
      e.currentTarget.style.outline = `2px solid ${T.gold}`;
      e.currentTarget.style.outlineOffset = "2px";
    }}
    onBlur={(e)=>{ e.currentTarget.style.outline = "none"; }}
  >{icon}</button>
);

// ─── PILL ─────────────────────────────────────────────────
// Filter / segmented control / tab. Optional count badge on the right.
export const Pill = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    style={{
      display:"inline-flex", alignItems:"center", gap:SP[1]+2,
      padding:`${SP[1]+2}px ${SP[3]}px`,
      borderRadius:R.full,
      border:`1px solid ${active ? T.gold : T.border}`,
      background: active ? T.goldBg : "transparent",
      color: active ? T.gold : T.textSecondary,
      fontFamily:FF.sans,
      fontSize:FS.meta,
      fontWeight:600,
      letterSpacing:LS.label,
      textTransform:"uppercase",
      cursor:"pointer",
      whiteSpace:"nowrap",
      transition:`all ${MO.fast}`,
      outline:"none",
    }}
    onMouseEnter={(e)=>{
      if (active) return;
      e.currentTarget.style.borderColor = "rgba(201,150,58,.35)";
      e.currentTarget.style.color = T.text;
    }}
    onMouseLeave={(e)=>{
      if (active) return;
      e.currentTarget.style.borderColor = T.border;
      e.currentTarget.style.color = T.textSecondary;
    }}
    onFocus={(e)=>{
      e.currentTarget.style.outline = `2px solid ${T.gold}`;
      e.currentTarget.style.outlineOffset = "2px";
    }}
    onBlur={(e)=>{ e.currentTarget.style.outline = "none"; }}
  >
    {children}
    {count != null && (
      <span style={{
        fontSize:FS.meta-2, fontWeight:700,
        color: active ? T.gold : T.textMuted,
        background: active ? "rgba(201,150,58,.18)" : T.borderSubtle,
        padding:"1px 6px", borderRadius:R.full, lineHeight:1.4,
        fontVariantNumeric:"tabular-nums",
      }}>{count}</span>
    )}
  </button>
);

// ─── STAT ─────────────────────────────────────────────────
// Canonical stat tile. Used in pipeline strips, analytics dashboards.
export const Stat = ({ label, value, sub, accent, align="left" }) => (
  <div style={{ textAlign:align, padding:`${SP[3]+1}px ${SP[3]+1}px`, minWidth:0 }}>
    <div style={{
      fontSize:FS.h2,
      fontWeight:700,
      fontFamily:FF.sans,
      color: accent || T.text,
      letterSpacing:LS.tight,
      lineHeight:1,
      fontVariantNumeric:"tabular-nums",
      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
    }}>{value}</div>
    <div style={{
      fontSize:FS.meta-2, fontWeight:700, color:T.textMuted,
      textTransform:"uppercase", letterSpacing:LS.uppercase,
      marginTop:SP[2],
      lineHeight:1,
    }}>{label}</div>
    {sub && (
      <div style={{ fontSize:FS.meta, color:T.textMuted, marginTop:SP[1]+1 }}>{sub}</div>
    )}
  </div>
);

// ─── SECTION HEADER ───────────────────────────────────────
// Every screen section starts with this. Optional right action slot.
// Signature element: gold tick + hairline rule extending right anchors
// every section visually. This is the recurring brand mark across all screens.
export const SectionHeader = ({ children, action }) => (
  <div style={{
    display:"flex", justifyContent:"space-between", alignItems:"center",
    marginBottom:SP[2]+2,
    minHeight:18,
    gap:SP[3],
  }}>
    <div style={{
      display:"flex", alignItems:"center", gap:SP[2]+2,
      flex:1, minWidth:0,
    }}>
      {/* Gold signature tick */}
      <div style={{
        width:2, height:11,
        background:T.gold,
        borderRadius:R.full,
        flexShrink:0,
      }} />
      <div style={{
        fontSize:FS.meta, fontWeight:700, color:T.textSecondary,
        textTransform:"uppercase", letterSpacing:LS.uppercase,
        lineHeight:1,
        whiteSpace:"nowrap",
      }}>{children}</div>
      {/* Hairline rule extending to the right */}
      <div style={{
        flex:1,
        height:1,
        background:`linear-gradient(90deg, ${T.border} 0%, transparent 100%)`,
        marginLeft:SP[1],
      }} />
    </div>
    {action}
  </div>
);
// Legacy alias.
export const SectionLabel = SectionHeader;

// ─── DIVIDER ──────────────────────────────────────────────
export const Divider = ({ space=SP[4] }) => (
  <div style={{ height:1, background:T.border, margin:`${space}px 0` }} />
);

// ─── EMPTY STATE ──────────────────────────────────────────
export const EmptyState = ({ icon, title, body }) => (
  <div style={{ padding:`${SP[12]}px ${SP[5]}px`, textAlign:"center" }}>
    {icon && (
      <div style={{ display:"flex", justifyContent:"center", marginBottom:SP[4], color:T.textMuted }}>
        {icon}
      </div>
    )}
    {title && <div style={{ fontSize:FS.h4, fontWeight:700, color:T.text, marginBottom:SP[2] }}>{title}</div>}
    {body && <div style={{ fontSize:FS.body, color:T.textSecondary, lineHeight:1.6, maxWidth:280, margin:"0 auto" }}>{body}</div>}
  </div>
);

// ─── NO ACCESS ────────────────────────────────────────────
export const NoAccess = ({ label }) => (
  <EmptyState
    icon={<Icon name="lock" size={36} />}
    title={label}
    body="Guest accounts don't have access to this area. Sign in with a full account to continue."
  />
);

// ─── PAGE ─────────────────────────────────────────────────
// Standard screen wrapper. Use this on every screen for consistent gutter.
export const Page = ({ children, style }) => (
  <div style={{
    padding:`${SP[5]}px ${SP[5]}px ${SP[5]}px`,
    ...style,
  }}>{children}</div>
);

// ─── ROW ──────────────────────────────────────────────────
// Settings-style row: title + optional description + control.
export const Row = ({ title, description, control }) => (
  <div style={{
    display:"flex", justifyContent:"space-between", alignItems:"center",
    gap:SP[4], padding:`${SP[2]+1}px 0`,
  }}>
    <div style={{ minWidth:0, flex:1 }}>
      <div style={{ fontSize:FS.lead, fontWeight:600, color:T.text, letterSpacing:LS.tight, lineHeight:1.3 }}>{title}</div>
      {description && (
        <div style={{ fontSize:FS.meta, color:T.textMuted, marginTop:SP[1], lineHeight:1.4 }}>{description}</div>
      )}
    </div>
    {control && <div style={{ flexShrink:0 }}>{control}</div>}
  </div>
);

// ─── TOGGLE ───────────────────────────────────────────────
// Standard switch component. Used in settings.
export const Toggle = ({ on, onClick, label }) => (
  <button
    onClick={onClick}
    role="switch"
    aria-checked={on}
    aria-label={label}
    style={{
      width:46, height:26, borderRadius:R.full,
      background: on ? T.gold : T.bgSection,
      border: `1px solid ${on ? T.gold : T.border}`,
      position:"relative", cursor:"pointer",
      transition:`background ${MO.base}, border-color ${MO.base}`,
      padding:0, flexShrink:0,
    }}
  >
    <div style={{
      position:"absolute", top:2,
      left: on ? 22 : 2,
      width:20, height:20, borderRadius:R.full,
      background: on ? "#141414" : T.text,
      transition:`left ${MO.base}`,
    }} />
  </button>
);
