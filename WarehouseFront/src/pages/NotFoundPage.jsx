import { Link } from 'react-router-dom';
import { colors } from '../theme/colors';

export default function NotFoundPage() {
  return (
    <div style={{ padding: 64, textAlign: 'center' }}>
      <div style={{
        fontSize: 64, fontWeight: 600, color: colors.text,
        fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em',
      }}>404</div>
      <p style={{
        fontSize: 15, color: colors.textMuted, fontFamily: 'var(--font-sans)',
        marginTop: 8, marginBottom: 24,
      }}>Kjo faqe nuk u gjet.</p>
      <Link to="/" style={{
        color: colors.accent, fontSize: 14, fontFamily: 'var(--font-sans)',
        textDecoration: 'none', fontWeight: 500,
      }}>← Kthehu te Dashboard</Link>
    </div>
  );
}
