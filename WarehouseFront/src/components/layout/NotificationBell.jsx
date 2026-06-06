import { useRef, useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { colors } from '../../theme/colors';
import { useRealtime } from '../../realtime/RealtimeContext';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { notifications, unreadCount, markAsRead } = useRealtime();

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (n) => {
    if (!n.isRead) markAsRead(n.id);
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('sq-AL', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          all: 'unset', width: 32, height: 32, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: colors.textMuted, cursor: 'pointer', position: 'relative',
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = colors.bg; e.currentTarget.style.color = colors.text; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.textMuted; }}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 3, right: 3,
            width: 16, height: 16, borderRadius: 999,
            background: colors.accent, color: 'white',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            border: `2px solid ${colors.surface}`,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 40, width: 320,
          background: colors.surface, border: `1px solid ${colors.border}`,
          borderRadius: 12, zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span style={{ fontSize: 11, color: colors.accent, fontFamily: 'var(--font-mono)' }}>
                {unreadCount} unread
              </span>
            )}
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '32px 16px', textAlign: 'center',
                color: colors.textDim, fontSize: 13,
              }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${colors.border}`,
                    background: n.isRead ? 'transparent' : colors.accentSoft,
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => {
                    if (n.isRead) e.currentTarget.style.background = colors.bg;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = n.isRead ? 'transparent' : colors.accentSoft;
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{
                      fontSize: 13, fontWeight: n.isRead ? 500 : 700,
                      color: colors.text,
                    }}>
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <span style={{
                        width: 7, height: 7, borderRadius: 999,
                        background: colors.accent, flexShrink: 0, marginTop: 4,
                      }} />
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 6, lineHeight: 1.4 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: 11, color: colors.textDim, fontFamily: 'var(--font-mono)' }}>
                    {formatTime(n.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}