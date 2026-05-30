import { colors } from '../../theme/colors';

// Stat i vogël i rreshtuar djathtas (përdoret te hero i Shipments).
export function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{
        fontSize: 10, color: colors.textMuted, fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>{label}</div>
      <div style={{
        fontSize: 22, fontWeight: 600, color: colors.text,
        fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', marginTop: 2,
      }}>{value}</div>
    </div>
  );
}

// Rresht label↔value (përdoret te detail panel i Shipment).
export function DetailRow({ label, value, mono }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '6px 0',
    }}>
      <span style={{
        fontSize: 12, color: colors.textMuted, fontFamily: 'var(--font-sans)',
      }}>{label}</span>
      <span style={{
        fontSize: 13, color: colors.text, fontWeight: 500,
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
      }}>{value}</span>
    </div>
  );
}
