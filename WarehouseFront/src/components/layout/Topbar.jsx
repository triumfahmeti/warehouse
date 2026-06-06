import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Menu } from 'lucide-react';
import { colors } from '../../theme/colors';
import { IconButton } from '../ui/Button';
import { useAuth } from '../../auth/AuthContext';
import NotificationBell from './NotificationBell';

export default function Topbar({ title, subtitle, action, onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const initial = (user?.email?.[0] || 'U').toUpperCase();

  useEffect(() => {
    const onClick = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px', borderBottom: `1px solid ${colors.border}`,
      background: colors.surface,
      position: 'sticky', top: 0, zIndex: 10,
      gap: 12,
    }}>
      <button className="menu-toggle" onClick={onMenuToggle} style={{
        all: 'unset', cursor: 'pointer', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 34, height: 34, borderRadius: 8,
        border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text,
      }}>
        <Menu size={16} />
      </button>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 11, color: colors.textMuted, fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
        }}>{subtitle}</div>
        <h1 style={{
          margin: 0, fontSize: 22, fontWeight: 600, color: colors.text,
          fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em',
        }}>{title}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <NotificationBell />

        <IconButton><Settings size={15} /></IconButton>

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button onClick={() => setOpen(o => !o)} style={{
            all: 'unset', cursor: 'pointer',
            width: 30, height: 30, borderRadius: 999,
            background: `linear-gradient(135deg, ${colors.accent}, #FFB388)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-sans)',
          }}>{initial}</button>

          {open && (
            <div style={{
              position: 'absolute', right: 0, top: 38, width: 220,
              background: colors.surface, border: `1px solid ${colors.border}`,
              borderRadius: 10, padding: 8, zIndex: 20,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            }}>
              <div style={{ padding: '8px 10px', borderBottom: `1px solid ${colors.border}`, marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>
                  {user?.email || 'Unknown user'}
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {user?.roles?.length ? user.roles.join(', ') : 'No role'}
                </div>
              </div>
              <button onClick={handleLogout} style={{
                all: 'unset', display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                borderRadius: 6, cursor: 'pointer',
                fontSize: 13, color: colors.danger, fontFamily: 'var(--font-sans)',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = colors.dangerSoft)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}