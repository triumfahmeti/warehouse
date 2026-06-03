import { Filter, Download } from 'lucide-react';
import { colors } from '../../theme/colors';

const outlineBtn = {
  all: 'unset', display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 12px', borderRadius: 8,
  background: colors.surface, border: `1px solid ${colors.border}`,
  color: colors.text, fontSize: 13, fontWeight: 500, cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

// Header i faqes: titull + numërues + butona Filter/Export + action opsional.
// onFilter/onExport jane opsionale; nese nuk kalohen, butonat mbeten inerte (si me pare).
export default function PageHeader({ title, count, action, onFilter, onExport, filterActive }) {
  return (
    <div className="page-header">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <h2 style={{
          margin: 0, fontSize: 18, fontWeight: 600, color: colors.text,
          fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em',
        }}>{title}</h2>
        <span style={{
          fontSize: 12, color: colors.textMuted, fontFamily: 'var(--font-mono)',
        }}>{count} total</span>
      </div>
      <div className="page-header-actions">
        <button
          onClick={onFilter}
          style={{ ...outlineBtn, ...(filterActive ? { background: colors.text, color: colors.surface, borderColor: colors.text } : {}) }}
        >
          <Filter size={13} /> Filter
        </button>
        <button style={outlineBtn} onClick={onExport}><Download size={13} /> Export</button>
        {action}
      </div>
    </div>
  );
}
