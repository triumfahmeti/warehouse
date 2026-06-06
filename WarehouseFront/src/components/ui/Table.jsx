import { colors } from '../../theme/colors';
import { usePagination } from './usePagination';
import Pagination from './Pagination';

// Tabelë gjenerike e drejtuar nga konfigurimi, me pagination klient-anësor.
//
// columns: [{ key, label, width?, render? }]
//   - key: emri i fushës te objekti i rreshtit
//   - label: titulli i kolonës
//   - width: gjerësia CSS grid (p.sh. '60px', '1fr'). Default '1fr'.
//   - render: funksion opsional (row) => JSX për qeliza custom
// rows: array objektesh (tashmë të filtruara/renditura nga faqja)
// onRowClick: opsional, e bën rreshtin të klikueshëm
// paginate: default true. Kalo false për t'i shfaqur të gjitha rreshtat.
// pageSize: numri fillestar i rreshtave për faqe (default 10).
export default function Table({ columns, rows, onRowClick, paginate = true, pageSize = 10 }) {
  const gridTemplate = columns.map(c => c.width || '1fr').join(' ');

  // Hook-u thirret gjithmonë (rregull i hook-eve); kur paginate=false e injorojmë.
  const pg = usePagination(rows, pageSize);
  const visibleRows = paginate ? pg.pageItems : rows;

  return (
    <div className="table-scroll-wrapper" style={{ border: `1px solid ${colors.border}`, borderRadius: 12, background: colors.surface }}>
    <div style={{ overflow: 'hidden', borderRadius: 12 }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: gridTemplate,
        padding: '12px 20px', borderBottom: `1px solid ${colors.border}`,
        background: colors.bg,
      }}>
        {columns.map(col => (
          <div key={col.key} style={{
            fontSize: 11, color: colors.textMuted, fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500,
          }}>{col.label}</div>
        ))}
      </div>

      {/* Rows */}
      {visibleRows.map((row, i) => (
        <div
          key={row.id ?? i}
          onClick={() => onRowClick && onRowClick(row)}
          style={{
            display: 'grid', gridTemplateColumns: gridTemplate,
            padding: '14px 20px',
            borderBottom: i < visibleRows.length - 1 ? `1px solid ${colors.border}` : 'none',
            cursor: onRowClick ? 'pointer' : 'default',
            transition: 'background 0.1s',
            alignItems: 'center',
          }}
          onMouseEnter={e => onRowClick && (e.currentTarget.style.background = colors.bg)}
          onMouseLeave={e => onRowClick && (e.currentTarget.style.background = 'transparent')}
        >
          {columns.map(col => (
            <div key={col.key} style={{
              fontSize: 13, color: colors.text, fontFamily: 'var(--font-sans)',
              letterSpacing: '-0.01em',
            }}>
              {col.render ? col.render(row) : row[col.key]}
            </div>
          ))}
        </div>
      ))}

      {/* Pagination — vetë-fshihet kur ka vetëm një faqe. */}
      {paginate && <Pagination pagination={pg} />}
    </div>
    </div>
  );
}
