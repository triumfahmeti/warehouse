import { Link, useLocation } from 'react-router-dom';
import { colors } from '../../theme/colors';

// Një lidhje navigimi. Tani përdor react-router:
//   - Link për navigim (ndryshon URL)
//   - useLocation për të ditur nëse është aktive (në bazë të path-it)
export default function NavLink({ item }) {
  const { pathname } = useLocation();
  const Icon = item.icon;
  // Dashboard ('/') duhet match ekzakt; të tjerat match me prefiks.
  const isActive = item.path === '/'
    ? pathname === '/'
    : pathname.startsWith(item.path);

  return (
    <Link
      to={item.path}
      style={{
        all: 'unset',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
        background: isActive ? colors.bg : 'transparent',
        color: isActive ? colors.text : colors.textMuted,
        fontSize: 13, fontWeight: isActive ? 500 : 400,
        fontFamily: 'var(--font-sans)',
        position: 'relative',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = colors.text; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = colors.textMuted; }}
    >
      <Icon size={15} strokeWidth={isActive ? 2 : 1.6} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.highlight && (
        <span style={{
          fontSize: 9, padding: '2px 5px', borderRadius: 4,
          background: colors.accent, color: 'white',
          fontFamily: 'var(--font-mono)', fontWeight: 600,
          letterSpacing: '0.05em',
        }}>MINE</span>
      )}
      {isActive && (
        <span style={{
          position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)',
          width: 2, height: 16, background: colors.accent, borderRadius: 999,
        }} />
      )}
    </Link>
  );
}
