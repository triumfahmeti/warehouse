import { useEffect, useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { colors } from "../theme/colors";
import { auditLogsApi, usersApi } from "../api";

function ActionBadge({ action }) {
  const lower = (action || "").toLowerCase();
  let bg = colors.infoSoft, fg = colors.info;
  if (lower.includes("delete") || lower.includes("remove")) { bg = colors.dangerSoft; fg = colors.danger; }
  else if (lower.includes("create") || lower.includes("add")) { bg = colors.successSoft; fg = colors.success; }
  else if (lower.includes("update") || lower.includes("edit") || lower.includes("change")) { bg = colors.warningSoft; fg = colors.warning; }
  return (
    <span style={{ background: bg, color: fg, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 500 }}>
      {action || "—"}
    </span>
  );
}

const inputStyle = {
  padding: "7px 10px", border: `1px solid ${colors.border}`,
  borderRadius: 8, fontSize: 12, fontFamily: "var(--font-sans)",
  background: colors.surface, color: colors.text, outline: "none",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);

  const [filters, setFilters] = useState({ userId: "", fromDate: "", toDate: "", action: "", entity: "" });
  const [active, setActive] = useState({});

  useEffect(() => {
    usersApi.getAll().then(setUsers).catch(() => {});
    fetchLogs({});
  }, []);

  const fetchLogs = (f) => {
    setLoading(true);
    auditLogsApi.getFiltered(f)
      .then(setLogs)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const applyFilters = () => {
    setActive(filters);
    fetchLogs(filters);
  };

  const clearFilters = () => {
    const empty = { userId: "", fromDate: "", toDate: "", action: "", entity: "" };
    setFilters(empty);
    setActive({});
    fetchLogs(empty);
  };

  const hasFilters = Object.values(filters).some(v => v);

  const fmt = d => d ? new Date(d).toLocaleString("sq-AL", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
          Administration
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: colors.text, fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" }}>
          Audit Logs
        </h1>
      </div>

      {/* Filters */}
      <div style={{
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: 12, padding: 16, marginBottom: 20,
        display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end",
      }}>
        <div>
          <div style={{ fontSize: 10, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>User</div>
          <select style={inputStyle} value={filters.userId} onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))}>
            <option value="">All users</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>From</div>
          <input type="date" style={inputStyle} value={filters.fromDate} onChange={e => setFilters(f => ({ ...f, fromDate: e.target.value }))} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>To</div>
          <input type="date" style={inputStyle} value={filters.toDate} onChange={e => setFilters(f => ({ ...f, toDate: e.target.value }))} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Action</div>
          <input style={inputStyle} value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))} placeholder="e.g. Delete" />
        </div>
        <div>
          <div style={{ fontSize: 10, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Entity</div>
          <input style={inputStyle} value={filters.entity} onChange={e => setFilters(f => ({ ...f, entity: e.target.value }))} placeholder="e.g. Product" />
        </div>
        <div style={{ display: "flex", gap: 8, alignSelf: "flex-end" }}>
          <button onClick={applyFilters} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", border: "none", borderRadius: 8,
            background: colors.text, color: colors.surface,
            cursor: "pointer", fontSize: 12, fontFamily: "var(--font-sans)", fontWeight: 500,
          }}>
            <Search size={13} /> Apply
          </button>
          {hasFilters && (
            <button onClick={clearFilters} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", border: `1px solid ${colors.border}`, borderRadius: 8,
              background: "none", color: colors.text,
              cursor: "pointer", fontSize: 12, fontFamily: "var(--font-sans)",
            }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <div style={{ marginBottom: 12, fontSize: 12, color: colors.textMuted, fontFamily: "var(--font-mono)" }}>
          {logs.length} entries{Object.values(active).some(v => v) ? " (filtered)" : ""}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: colors.textMuted, fontFamily: "var(--font-mono)" }}>Loading...</div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: "center", color: colors.danger, fontFamily: "var(--font-mono)" }}>{error}</div>
      ) : (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 820, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: colors.bg }}>
                {["#", "User", "Action", "Entity", "Entity ID", "IP Address", "Date", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500, borderBottom: `1px solid ${colors.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? `1px solid ${colors.border}` : "none" }}>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: colors.textMuted, fontFamily: "var(--font-mono)" }}>{log.id}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: colors.text, fontFamily: "var(--font-sans)" }}>{log.userName || "—"}</td>
                  <td style={{ padding: "11px 14px" }}><ActionBadge action={log.action} /></td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: colors.text, fontFamily: "var(--font-mono)" }}>{log.entity || "—"}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: colors.textMuted, fontFamily: "var(--font-mono)" }}>{log.entityId ?? "—"}</td>
                  <td style={{ padding: "11px 14px", fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)" }}>{log.ipAddress || "—"}</td>
                  <td style={{ padding: "11px 14px", fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{fmt(log.createdAt)}</td>
                  <td style={{ padding: "11px 14px" }}>
                    {(log.oldValue || log.newValue) && (
                      <button onClick={() => setDetail(log)} style={{
                        background: "none", border: `1px solid ${colors.border}`, borderRadius: 6,
                        padding: "4px 8px", cursor: "pointer", color: colors.textMuted,
                        display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: "var(--font-mono)",
                      }}>
                        <ChevronDown size={11} /> Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: colors.textMuted, fontFamily: "var(--font-sans)", fontSize: 13 }}>
              No audit log entries found.
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: colors.surface, borderRadius: 14, padding: 28, width: 560, maxWidth: "92vw", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: colors.text, fontFamily: "var(--font-sans)" }}>
                Log #{detail.id} — {detail.action} {detail.entity}
              </h2>
              <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Old Value</div>
              <PrettyValue value={detail.oldValue} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>New Value</div>
              <PrettyValue value={detail.newValue} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Shfaq OldValue/NewValue në mënyrë të lexueshme: parsoj JSON-in dhe e tregoj key → value.
function PrettyValue({ value }) {
  if (!value) return <div style={emptyBox}>(empty)</div>;

  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    return <pre style={rawBox}>{value}</pre>;
  }

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const keys = Object.keys(parsed);
    if (keys.length === 0) return <div style={emptyBox}>(no fields)</div>;
    return (
      <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: "hidden" }}>
        {keys.map((k, i) => (
          <div key={k} style={{ display: "flex", gap: 12, padding: "8px 12px", background: colors.bg, borderBottom: i < keys.length - 1 ? `1px solid ${colors.border}` : "none" }}>
            <span style={{ width: 150, flexShrink: 0, fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)" }}>{k}</span>
            <span style={{ flex: 1, fontSize: 13, color: colors.text, fontFamily: "var(--font-sans)", wordBreak: "break-word" }}>{fmtVal(parsed[k])}</span>
          </div>
        ))}
      </div>
    );
  }

  return <pre style={rawBox}>{String(value)}</pre>;
}

function fmtVal(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

const rawBox = { background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 12, margin: 0, fontSize: 12, fontFamily: "var(--font-mono)", overflow: "auto", color: colors.text, whiteSpace: "pre-wrap", wordBreak: "break-all" };
const emptyBox = { fontSize: 13, color: colors.textDim, fontFamily: "var(--font-sans)", padding: "4px 0" };
