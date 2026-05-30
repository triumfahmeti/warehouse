import { statusConfig } from '../../theme/colors';

// Pill i vogël që tregon statusin me ngjyrë + pikë.
// Përdoret te tabelat, detail panels, dashboard.
export default function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.Draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      background: cfg.bg, color: cfg.fg,
      fontSize: 12, fontWeight: 500, letterSpacing: '-0.01em',
      fontFamily: 'var(--font-sans)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: cfg.dot }} />
      {status}
    </span>
  );
}
