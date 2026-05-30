import { colors } from '../../theme/colors';

// Buton i rrumbullakët vetëm me ikonë (bell, settings, etj.)
export function IconButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset', width: 32, height: 32, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: colors.textMuted, cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = colors.bg; e.currentTarget.style.color = colors.text; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.textMuted; }}
    >
      {children}
    </button>
  );
}

// Buton kryesor i errët me ikonë opsionale (New Warehouse, New Order, etj.)
export function PrimaryButton({ children, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset', display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 8,
        background: colors.text, color: colors.surface,
        fontSize: 13, fontWeight: 500, cursor: 'pointer',
        fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em',
        transition: 'transform 0.1s, background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#2A2A26')}
      onMouseLeave={e => (e.currentTarget.style.background = colors.text)}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}
