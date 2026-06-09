import { useEffect, useState } from "react";
import {
  Plus,
  MoreHorizontal,
  X,
  Search,
  ChevronRight,
  Package,
} from "lucide-react";
import { colors } from "../theme/colors";
import {
  packingListsApi,
  salesOrdersApi,
  palletsApi,
} from "../api";
import PageHeader from "../components/ui/PageHeader";
import Table from "../components/ui/Table";
import StatusBadge from "../components/ui/StatusBadge";
import { PrimaryButton } from "../components/ui/Button";
import { exportToCsv } from "../utils/exportCsv";
import { useLiveResource } from "../realtime/useLiveResource";
import { useAuth } from "../auth/AuthContext";

const emptyForm = { salesOrderId: "", notes: "" };

export default function PackingListsPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('PackingLists.Create');
  const canMarkReady = hasPermission('PackingLists.MarkReady');
  const canCancel = hasPermission('PackingLists.Cancel');
  const [packingLists, setPackingLists] = useState([]);
  const [salesOrderOptions, setSalesOrderOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalMode, setModalMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [rowMenu, setRowMenu] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [showFilter, setShowFilter] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Detail panel
  const [selected, setSelected] = useState(null);
  const [pallets, setPallets] = useState([]);
  const [palletsLoading, setPalletsLoading] = useState(false);

  const showFeedback = (msg, ok = true) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3000);
  };

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await packingListsApi.getAll();
      setPackingLists(data);
      setError(null);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useLiveResource("packinglists", () => load(true));

  useEffect(() => {
  let cancelled = false;
  const fetchData = async () => {
    setLoading(true);
    try {
      const [plData, soData, palletsData] = await Promise.all([
  packingListsApi.getAll(),
  salesOrdersApi.getAll().catch(() => []),
  palletsApi.getAll().catch(() => []),
]);

if (!cancelled) {
  setPackingLists(plData);

  // Orders që tashmë janë në packing list aktive
  const assignedOrderIds = new Set(
    plData
      .filter(pl => pl.status !== 'Cancelled')
      .map(pl => pl.salesOrderId)
  );

  // Orders që kanë paleta të krijuara
  const palletizedOrderIds = new Set(palletsData.map(p => p.salesOrderId));

  // Shfaq vetëm orders me paleta të krijuara dhe jo ende në packing list
  setSalesOrderOptions(soData.filter(so =>
    palletizedOrderIds.has(so.id) && !assignedOrderIds.has(so.id)
  ));

  setError(null);
}
    } catch (err) {
      if (!cancelled) setError(err.message);
    } finally {
      if (!cancelled) setLoading(false);
    }
  };
  fetchData();
  return () => { cancelled = true; };
}, []);

 

  // Kur zgjedhet packing list, merr paletat e asaj order
  const handleSelectRow = async (pl) => {
    if (selected?.id === pl.id) {
      setSelected(null);
      setPallets([]);
      return;
    }
    setSelected(pl);
    setPalletsLoading(true);
    try {
      const all = await palletsApi.getAll();
      setPallets(all.filter((p) => p.salesOrderId === pl.salesOrderId));
    } catch {
      setPallets([]);
    } finally {
      setPalletsLoading(false);
    }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setModalMode("create");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await packingListsApi.create({
        salesOrderId: Number(form.salesOrderId),
        notes: form.notes || null,
      });
      showFeedback("Packing list created successfully.");
      setModalMode(null);
      await load();
    } catch (err) {
      showFeedback(err.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReady = async (id) => {
    setRowMenu(null);
    try {
      await packingListsApi.markReady(id);
      showFeedback("Marked as Ready.");
      await load();
    } catch (err) {
      showFeedback(err.message, false);
    }
  };

  const handleCancel = async (id) => {
    setRowMenu(null);
    try {
      await packingListsApi.cancel(id);
      showFeedback("Packing list cancelled.");
      await load();
    } catch (err) {
      showFeedback(err.message, false);
    }
  };

  const toggleRowMenu = (e, r) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setRowMenu((prev) =>
      prev?.id === r.id
        ? null
        : { id: r.id, x: rect.right, y: rect.bottom, status: r.status },
    );
  };

  const toggleFilter = () => {
    setShowFilter((v) => {
      if (v) {
        setQuery("");
        setSortBy("");
        setFilterStatus("");
      }
      return !v;
    });
  };

  const q = query.trim().toLowerCase();
  const filtered = packingLists.filter((pl) => {
    const matchesQuery =
      !q ||
      (pl.packingListNumber || "").toLowerCase().includes(q) ||
      (pl.warehouseName || "").toLowerCase().includes(q);
    const matchesStatus = !filterStatus || pl.status === filterStatus;
    return matchesQuery && matchesStatus;
  });

  const sorted = [...filtered];
  const comparators = {
    "date-desc": (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    "date-asc": (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  };
  if (comparators[sortBy]) sorted.sort(comparators[sortBy]);

  return (
    <div className="page-content">
      <PageHeader
        title="Packing Lists"
        count={sorted.length}
        onFilter={toggleFilter}
        filterActive={showFilter}
        onExport={() => {
          const headers = [
            "Number",
            "Sales Order",
            "Warehouse",
            "Date",
            "Status",
          ];
          const rows = sorted.map((pl) => [
            pl.packingListNumber,
            `#${pl.salesOrderId}`,
            pl.warehouseName || "—",
            pl.createdAt ? new Date(pl.createdAt).toLocaleDateString() : "—",
            pl.status,
          ]);
          exportToCsv(headers, rows, "packing-lists");
        }}
        action={canCreate ? (
          <PrimaryButton icon={Plus} onClick={openCreate}>
            New Packing List
          </PrimaryButton>
        ) : undefined}
      />

      {showFilter && (
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: 1,
              minWidth: 220,
              maxWidth: 320,
            }}
          >
            <Search
              size={14}
              color={colors.textMuted}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by number or warehouse..."
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                color: colors.text,
                fontSize: 13,
                fontFamily: "var(--font-sans)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              color: colors.text,
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Ready">Ready</option>
            <option value="Closed">Closed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              color: colors.text,
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">Sort by: Default</option>
            <option value="date-desc">Date (newest first)</option>
            <option value="date-asc">Date (oldest first)</option>
          </select>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: selected ? "1fr 340px" : "1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Tabela */}
        <div>
          {loading ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: colors.textMuted,
                fontFamily: "var(--font-mono)",
                fontSize: 13,
              }}
            >
              Loading...
            </div>
          ) : error ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: colors.danger,
                fontFamily: "var(--font-mono)",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          ) : (
            <Table
              rows={sorted}
              onRowClick={handleSelectRow}
              columns={[
                {
                  key: "id",
                  label: "ID",
                  width: "60px",
                  render: (r) => (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: colors.textMuted,
                        fontSize: 12,
                      }}
                    >
                      #{r.id}
                    </span>
                  ),
                },
                {
                  key: "packingListNumber",
                  label: "Number",
                  width: "180px",
                  render: (r) => (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {selected?.id === r.id && (
                        <ChevronRight size={12} color={colors.accent} />
                      )}
                      {r.packingListNumber}
                    </span>
                  ),
                },
                {
                  key: "salesOrderId",
                  label: "Sales Order",
                  render: (r) => (
                    <span
                      style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
                    >
                      #{r.salesOrderId}
                    </span>
                  ),
                },
                {
                  key: "warehouseName",
                  label: "Warehouse",
                  render: (r) => <span>{r.warehouseName || "—"}</span>,
                },
                {
                  key: "createdAt",
                  label: "Date",
                  width: "120px",
                  render: (r) => (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: colors.textMuted,
                      }}
                    >
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString()
                        : "—"}
                    </span>
                  ),
                },
                {
                  key: "status",
                  label: "Status",
                  width: "140px",
                  render: (r) => <StatusBadge status={r.status} />,
                },
                {
                  key: "action",
                  label: "",
                  width: "48px",
                  render: (r) => (
                    <button
                      onClick={(e) => toggleRowMenu(e, r)}
                      style={{
                        all: "unset",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        cursor: "pointer",
                        color: colors.textMuted,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.bg;
                        e.currentTarget.style.color = colors.text;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = colors.textMuted;
                      }}
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  ),
                },
              ]}
            />
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 20,
              position: "sticky",
              top: 100,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: colors.textMuted,
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Packing List
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: colors.text,
                    fontFamily: "var(--font-mono)",
                    marginTop: 4,
                  }}
                >
                  {selected.packingListNumber}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelected(null);
                  setPallets([]);
                }}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 4,
                  color: colors.textMuted,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Info */}
            <div
              style={{
                padding: 12,
                background: colors.bg,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <DetailRow
                label="Sales Order"
                value={`#${selected.salesOrderId}`}
              />
              <DetailRow label="Client" value={selected.clientName || "—"} />
              <DetailRow
                label="Warehouse"
                value={selected.warehouseName || "—"}
              />
              <DetailRow label="Status" value={selected.status} />
              <DetailRow
                label="Created"
                value={
                  selected.createdAt
                    ? new Date(selected.createdAt).toLocaleDateString()
                    : "—"
                }
              />
              {selected.notes && (
                <DetailRow label="Notes" value={selected.notes} />
              )}
            </div>

            {/* Pallets */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Pallets ({pallets.length})
              </div>
              {pallets.length > 0 && (
                <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)" }}>
                  Total: {pallets.reduce((s, p) => s + (p.items?.reduce((si, i) => si + i.quantity, 0) ?? 0), 0)} pcs
                </div>
              )}
            </div>
            {palletsLoading ? (
              <div
                style={{
                  fontSize: 13,
                  color: colors.textMuted,
                  fontFamily: "var(--font-mono)",
                }}
              >
                Loading...
              </div>
            ) : pallets.length === 0 ? (
              <div
                style={{
                  fontSize: 13,
                  color: colors.textMuted,
                  fontFamily: "var(--font-sans)",
                  padding: "12px 0",
                }}
              >
                No pallets found for this order.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pallets.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      background: colors.bg,
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <Package size={14} color={colors.textMuted} />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          fontFamily: "var(--font-mono)",
                          color: colors.text,
                        }}
                      >
                        {p.palletCode}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: colors.textMuted,
                          fontFamily: "var(--font-sans)",
                          marginTop: 2,
                        }}
                      >
                        {p.packingType}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      color: colors.text,
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 6,
                      padding: "2px 8px",
                    }}>
                      {p.items?.reduce((s, i) => s + i.quantity, 0) ?? 0} pcs
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div
              style={{
                marginTop: 16,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {selected.status === "Draft" && canMarkReady && (
                <button
                  onClick={() => handleMarkReady(selected.id)}
                  style={{
                    padding: "9px 0",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    background: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "var(--font-sans)",
                    color: colors.text,
                  }}
                >
                  Mark as Ready →
                </button>
              )}
              {(selected.status === "Draft" || selected.status === "Ready") && canCancel && (
                <button
                  onClick={() => handleCancel(selected.id)}
                  style={{
                    padding: "9px 0",
                    border: "none",
                    borderRadius: 8,
                    background: colors.dangerSoft,
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "var(--font-sans)",
                    color: colors.danger,
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Row Menu */}
      {rowMenu && (
        <>
          <div
            onClick={() => setRowMenu(null)}
            style={{ position: "fixed", inset: 0, zIndex: 1000 }}
          />
          <div
            style={{
              position: "fixed",
              top: rowMenu.y + 4,
              left: rowMenu.x - 160,
              width: 160,
              zIndex: 1001,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: 6,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            {rowMenu.status === "Draft" && canMarkReady && (
              <MenuItem
                label="Mark as Ready"
                onClick={() => handleMarkReady(rowMenu.id)}
              />
            )}
            {(rowMenu.status === "Draft" || rowMenu.status === "Ready") && canCancel && (
              <MenuItem
                label="Cancel"
                danger
                onClick={() => handleCancel(rowMenu.id)}
              />
            )}
          </div>
        </>
      )}

      {/* Modal */}
      {modalMode && (
        <Modal title="New Packing List" onClose={() => setModalMode(null)}>
          <form onSubmit={handleSubmit}>
            <Field label="Sales Order">
              <select
                required
                style={inputStyle}
                value={form.salesOrderId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, salesOrderId: e.target.value }))
                }
              >
                <option value="" disabled>
                  Select sales order...
                </option>
                {salesOrderOptions.map((so) => (
  <option key={so.id} value={so.id}>
    #{so.id} — {so.clientName || so.status}
  </option>
))}
              </select>
            </Field>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: colors.textMuted, fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
              The packing list groups all of this order's pallets. The warehouse is
              determined automatically from where the pallets are stored.
            </p>
            <Field label="Notes (optional)">
              <input
                style={inputStyle}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Any notes..."
              />
            </Field>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  background: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  color: colors.text,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  border: "none",
                  borderRadius: 8,
                  background: colors.text,
                  color: colors.surface,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Saving..." : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1100,
            background: feedback.ok ? colors.text : colors.danger,
            color: colors.surface,
            padding: "12px 18px",
            borderRadius: 10,
            fontSize: 13,
            fontFamily: "var(--font-sans)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            maxWidth: 360,
          }}
        >
          {feedback.msg}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "4px 0",
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: colors.textMuted,
          fontFamily: "var(--font-mono)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          color: colors.text,
          fontFamily: "var(--font-sans)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function MenuItem({ label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        all: "unset",
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        boxSizing: "border-box",
        padding: "8px 10px",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 13,
        fontFamily: "var(--font-sans)",
        color: danger ? colors.danger : colors.text,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = danger
          ? colors.dangerSoft
          : colors.bg)
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {label}
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: colors.surface,
          borderRadius: 14,
          padding: 28,
          width: 460,
          maxWidth: "92vw",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: colors.text,
              fontFamily: "var(--font-sans)",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: colors.textMuted,
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          color: colors.textMuted,
          fontFamily: "var(--font-mono)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "var(--font-sans)",
  background: colors.bg,
  color: colors.text,
  outline: "none",
  boxSizing: "border-box",
};
