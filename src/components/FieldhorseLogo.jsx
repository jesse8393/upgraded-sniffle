// src/components/FieldhorseLogo.jsx
// Fieldhorse Option B Logo — FIELD (gold) + HORSE (theme-adaptive) wordmark

const FieldhorseLogo = ({
  size = 28,          // font-size in px for the wordmark
  surface,            // 'dark' | 'light' (optional — overrides theme)
  showSub = true,    // show "Field Operations Platform" subtitle
  style = {}
}) => {
  const GOLD = '#C9963A';
  const ONYX = '#141414';
  const WHITE = '#FFFFFF';

  // If `surface` is specified, use legacy fixed colors. Otherwise adapt to CSS theme vars.
  const horseColor = surface === 'dark' ? WHITE : surface === 'light' ? ONYX : 'var(--text-primary)';
  const subColor   = surface === 'dark' ? '#888888' : surface === 'light' ? '#555555' : 'var(--text-secondary)';
  const lineEnd    = surface === 'dark' ? 'rgba(201,150,58,0.3)' : surface === 'light' ? 'rgba(20,20,20,0.2)' : 'rgba(201,150,58,0.3)';
  const lineStart  = surface === 'dark' ? GOLD : surface === 'light' ? ONYX : GOLD;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', ...style }}>
      {/* Wordmark */}
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '0.08em',
      }}>
        <span style={{ color: GOLD }}>FIELD</span>
        <span style={{ color: horseColor }}>HORSE</span>
      </div>

      {/* Gold gradient underline */}
      <div style={{
        width: '100%',
        height: Math.max(1.5, size * 0.06),
        background: `linear-gradient(90deg, ${lineStart}, ${lineEnd})`,
        borderRadius: 2,
        marginTop: size * 0.06,
      }} />

      {/* Subtitle */}
      {showSub && (
        <div style={{
          fontSize: Math.max(7, size * 0.28),
          fontWeight: 600,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: subColor,
          fontFamily: "'DM Sans', sans-serif",
          marginTop: size * 0.18,
        }}>
          Field Operations Platform
        </div>
      )}
    </div>
  );
};

export default FieldhorseLogo;
