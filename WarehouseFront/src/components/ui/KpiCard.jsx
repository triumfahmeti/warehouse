import { TrendingUp, TrendingDown } from 'lucide-react';
import { colors } from '../../theme/colors';

// Kartë statistike me label, vlerë të madhe dhe trend opsional (up/down).
// 'accent' shton një vijë portokalli në krye.
export default function KpiCard({ label, value, change, trend, accent }) {
  return (
    <div style={{
      padding: 20, background: colors.surface, border: `1px solid ${colors.border}`,
      borderRadius: 12, position: 'relative', overflow: 'hidden',
    }}>
      {accent && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: 2,
          background: colors.accent,
        }} />
      )}
      <div style={{
        fontSize: 11, color: colors.textMuted, fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>{label}</div>
      <div style={{
        fontSize: 30, fontWeight: 600, color: colors.text,
        fontFamily: 'var(--font-sans)', letterSpacing: '-0.03em',
        marginTop: 6, marginBottom: 6,
      }}>{value}</div>
      {change && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, color: trend === 'up' ? colors.success : colors.danger,
          fontFamily: 'var(--font-mono)',
        }}>
          {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change}
        </div>
      )}
    </div>
  );
}
