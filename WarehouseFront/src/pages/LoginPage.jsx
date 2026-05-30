import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Truck, AlertCircle } from 'lucide-react';
import { colors } from '../theme/colors';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Ku donte të shkonte para se ta ridrejtonim te login (default '/').
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message || 'Login dështoi. Provo përsëri.');
    }
  };

  const onKeyDown = e => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={{
      '--font-sans': "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
      '--font-mono': "'JetBrains Mono', 'SF Mono', Menlo, monospace",
      minHeight: '100vh', background: colors.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)', padding: 20,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}</style>

      <div style={{
        width: '100%', maxWidth: 380,
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: 14, padding: 32,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: colors.text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(135deg, ${colors.accent} 0%, transparent 60%)`,
            }} />
            <Truck size={18} color="white" style={{ position: 'relative' }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, letterSpacing: '-0.01em' }}>
              Warehouse OS
            </div>
            <div style={{
              fontSize: 10, color: colors.textMuted, fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>Sign in to continue</div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px', borderRadius: 8, marginBottom: 16,
            background: colors.dangerSoft, color: colors.danger,
            fontSize: 13,
          }}>
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Email */}
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="admin@warehouse.com"
          style={inputStyle}
        />

        {/* Password */}
        <label style={{ ...labelStyle, marginTop: 14 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="••••••••"
          style={inputStyle}
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          style={{
            all: 'unset',
            width: '100%', boxSizing: 'border-box',
            marginTop: 22, padding: '11px 0', borderRadius: 8,
            background: loading || !email || !password ? colors.borderStrong : colors.text,
            color: colors.surface, textAlign: 'center',
            fontSize: 14, fontWeight: 500, cursor: loading ? 'wait' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 12, color: colors.textMuted,
  fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: 6,
};

const inputStyle = {
  all: 'unset', boxSizing: 'border-box',
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: `1px solid ${colors.border}`, background: colors.bg,
  fontSize: 14, color: colors.text, fontFamily: 'var(--font-sans)',
};
