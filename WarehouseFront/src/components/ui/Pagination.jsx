import { ChevronLeft, ChevronRight } from 'lucide-react';
import { colors } from '../../theme/colors';

// Shirit i paginimit i ripërdorshëm. Pret objektin që kthen usePagination.
// Vetë-fshihet kur ka vetëm një faqe. Stilet janë projektuar të rrinë në fund
// të një kontejneri me border (tabela e përbashkët ose tabela custom).
const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function Pagination({ pagination, style }) {
  const { page, pageSize, total, totalPages, start, end, setPage, setPageSize } = pagination;
  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 10,
      padding: '10px 20px', borderTop: `1px solid ${colors.border}`, background: colors.bg,
      ...style,
    }}>
      {/* Majtas: "X–Y of Z" + zgjedhës i madhësisë së faqes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: colors.textMuted, fontFamily: 'var(--font-mono)' }}>
          {start}–{end} of {total}
        </span>
        <select
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value))}
          style={{
            fontSize: 12, fontFamily: 'var(--font-mono)', color: colors.text,
            background: colors.surface, border: `1px solid ${colors.border}`,
            borderRadius: 7, padding: '4px 8px', cursor: 'pointer', outline: 'none',
          }}
        >
          {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>

      {/* Djathtas: Prev — numra faqesh — Next */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <PageButton disabled={page <= 1} onClick={() => setPage(Math.max(1, page - 1))} aria-label="Previous page">
          <ChevronLeft size={15} />
        </PageButton>
        {pageWindow(page, totalPages).map((p, idx) =>
          p === '...'
            ? <span key={`gap-${idx}`} style={{ padding: '0 4px', color: colors.textDim, fontSize: 12, fontFamily: 'var(--font-mono)' }}>…</span>
            : <PageButton key={p} active={p === page} onClick={() => setPage(p)}>{p}</PageButton>
        )}
        <PageButton disabled={page >= totalPages} onClick={() => setPage(Math.min(totalPages, page + 1))} aria-label="Next page">
          <ChevronRight size={15} />
        </PageButton>
      </div>
    </div>
  );
}

// Buton i vetëm i paginimit (numër ose shigjetë).
function PageButton({ children, onClick, disabled, active, ...rest }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      {...rest}
      style={{
        all: 'unset',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 28, height: 28, padding: '0 6px', borderRadius: 7,
        fontSize: 12, fontFamily: 'var(--font-mono)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        background: active ? colors.text : 'transparent',
        color: active ? colors.surface : colors.textMuted,
        border: active ? `1px solid ${colors.text}` : '1px solid transparent',
      }}
      onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.background = colors.surface; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

// Gjeneron numrat e faqeve me '...' kur janë shumë (maks ~7 elemente të dukshëm).
function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [1];
  if (current > 4) pages.push('...');

  const startVal = Math.max(2, current - 1);
  const endVal = Math.min(total - 1, current + 1);
  for (let i = startVal; i <= endVal; i++) pages.push(i);

  if (current < total - 3) pages.push('...');
  pages.push(total);
  return pages;
}
