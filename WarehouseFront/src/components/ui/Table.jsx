import { useEffect, useRef } from "react";
import { colors } from "../../theme/colors";
import { usePagination } from "./usePagination";
import Pagination from "./Pagination";

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
export default function Table({
  columns,
  rows,
  onRowClick,
  paginate = true,
  pageSize = 10,
}) {
  const tableScrollRef = useRef(null);
  const gridTemplate = columns
    .map((c) => c.width || "minmax(140px, 1fr)")
    .join(" ");

  // Hook-u thirret gjithmonë (rregull i hook-eve); kur paginate=false e injorojmë.
  const pg = usePagination(rows, pageSize);
  const visibleRows = paginate ? pg.pageItems : rows;

  useEffect(() => {
    tableScrollRef.current?.scrollTo({ left: 0 });
  }, []);

  return (
    <div
      className="table-scroll-wrapper"
      ref={tableScrollRef}
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        background: colors.surface,
        direction: "ltr",
      }}
    >
      <div className="table-grid-content" style={{ borderRadius: 12 }}>
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: gridTemplate,
            width: "max-content",
            minWidth: "100%",
            padding: "12px 20px",
            borderBottom: `1px solid ${colors.border}`,
            background: "var(--color-bg)",
          }}
        >
          {columns.map((col) => (
            <div
              key={col.key}
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 500,
                minWidth: 0,
                overflowWrap: "anywhere",
              }}
            >
              {col.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        {visibleRows.map((row, i) => (
          <div
            key={row.id ?? i}
            onClick={() => onRowClick && onRowClick(row)}
            style={{
              display: "grid",
              gridTemplateColumns: gridTemplate,
              width: "max-content",
              minWidth: "100%",
              padding: "14px 20px",
              borderBottom:
                i < visibleRows.length - 1
                  ? "1px solid var(--color-border)"
                  : "none",
              cursor: onRowClick ? "pointer" : "default",
              background: "var(--color-surface)",
              transition: "background 0.1s",
              alignItems: "center",
            }}
            className={onRowClick ? "table-data-row" : undefined}
            onMouseEnter={(e) =>
              onRowClick && (e.currentTarget.style.background = colors.bg)
            }
            onMouseLeave={(e) =>
              onRowClick && (e.currentTarget.style.background = colors.surface)
            }
          >
            {columns.map((col) => (
              <div
                key={col.key}
                style={{
                  fontSize: 13,
                  color: "var(--color-text)",
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "-0.01em",
                  minWidth: 0,
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
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
