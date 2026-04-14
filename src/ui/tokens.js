// src/ui/tokens.js
// Single source of truth for the Fieldhorse design system.
// Imported by App.jsx, primitives.jsx, and the screen files in src/screens/.
// Pure data — no React, no DOM, no side effects.

// ─── SPACING ──────────────────────────────────────────────
// 4px base unit. Use these everywhere — no off-scale values.
export const SP = { 0:0, 1:4, 2:8, 3:12, 4:16, 5:20, 6:24, 8:32, 10:40, 12:48, 16:64, 20:80 };

// ─── RADIUS ───────────────────────────────────────────────
export const R = { sm:6, md:10, lg:14, xl:20, full:9999 };

// ─── TYPE SCALE ───────────────────────────────────────────
// meta=11, ui=12, body=13, lead=14, h4=16, h3=18, h2=22, h1=28, hero=36
export const FS = { meta:11, ui:12, body:13, lead:14, h4:16, h3:18, h2:22, h1:28, hero:36 };

// ─── LETTER SPACING ───────────────────────────────────────
export const LS = { tight:"-0.01em", normal:"0", label:"0.06em", uppercase:"0.12em" };

// ─── MOTION ───────────────────────────────────────────────
export const MO = { fast:"120ms ease", base:"180ms ease", slow:"280ms ease" };

// ─── FONT FAMILIES ────────────────────────────────────────
export const FF = {
  sans: "'DM Sans', system-ui, sans-serif",
  display: "'Bebas Neue', sans-serif",
  mono: "ui-monospace, 'SF Mono', Menlo, monospace",
};

// ─── COLOR TOKENS ─────────────────────────────────────────
// Brand colors — hardcoded, never themed.
// Surface tokens — CSS variables defined in index.css that flip with theme.
export const T = {
  // Brand
  gold: "#C9963A", goldLt: "#E8B865", goldDk: "#A07830",
  goldBg: "rgba(201,150,58,.10)", goldBorder: "rgba(201,150,58,.35)",
  green: "#2D7A4F", greenLt: "rgba(45,122,79,.13)", greenBorder: "rgba(45,122,79,.45)",
  red: "#C0392B", redLt: "rgba(192,57,43,.13)", redBorder: "rgba(192,57,43,.45)",
  amber: "#C97A20", amberLt: "rgba(201,122,32,.13)", amberBorder: "rgba(201,122,32,.45)",
  purple: "#7C3AED", purpleLt: "rgba(124,58,237,.13)",
  blue: "#2563EB", blueLt: "rgba(37,99,235,.13)",
  teal: "#20A09A", tealLt: "rgba(32,160,154,.13)",

  // Themed surfaces (defined in index.css under [data-theme="dark"|"light"])
  bg: "var(--bg-base)", bgCard: "var(--bg-card)", bgSection: "var(--bg-input)", bgHeader: "var(--bg-header)",
  border: "var(--border)", borderSubtle: "var(--border-subtle)",
  text: "var(--text-primary)", textSecondary: "var(--text-secondary)", textMuted: "var(--text-muted)",

  // Always-dark brand surface (for hero / login / command-panel zones)
  brand: "#1C1C1E",

  // Legacy aliases — DO NOT USE in new code, retained for back-compat with screens not yet refactored.
  cream: "var(--text-primary)", creamDk: "var(--border)", creamMid: "var(--border)",
  charcoal: "var(--text-primary)", charcoalLt: "var(--text-primary)", charcoalMid: "var(--text-primary)",
  stone: "var(--text-secondary)", stoneLt: "var(--text-secondary)", stoneXlt: "var(--text-muted)",
  r8: R.sm, r12: R.md, r16: R.lg, r20: R.xl, r24: 24,
};

// ─── ELEVATION ────────────────────────────────────────────
// We deliberately use very few shadows. Surfaces differentiate via 1px borders.
export const ELEV = {
  none: "none",
  modal: "0 24px 48px rgba(0,0,0,.5)",
};
