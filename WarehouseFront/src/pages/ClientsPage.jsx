import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  X,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
} from "lucide-react";
import { colors } from "../theme/colors";
import { clientsApi } from "../api";
import PageHeader from "../components/ui/PageHeader";
import Table from "../components/ui/Table";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState(""); // '' | orders-desc | orders-asc | name-asc | name-desc

  // Lidhja me API-në: mapojmë fushat e DTO-së në formën që pret tabela.
  useEffect(() => {
    (async () => {
      try {
        const data = await clientsApi.getAll();
        setClients(data.map((c) => ({
          id: c.id,
          name: c.fullName,
          email: c.email,
          phone: c.phoneNumber,
          address: c.address,
          orders: c.ordersCount,
        })));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filtrim sipas emrit, email-it ose telefonit.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q),
    );
  }, [query, clients]);

  // Export i listës aktuale (të filtruar) si CSV.
  const exportCsv = () => {
    const headers = ["ID", "Name", "Email", "Phone", "Address", "Orders"];
    const rows = filtered.map((c) => [
      c.id,
      c.name,
      c.email,
      c.phone || "",
      c.address || "",
      c.orders,
    ]);
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows]
      .map((r) => r.map(escape).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleFilter = () => {
    setShowFilter((v) => {
      if (v) { setQuery(""); setSortBy(""); } // mbyllja pastron kërkimin + renditjen
      return !v;
    });
  };

  // Renditje sipas porosive ose emrit (kopje që të mos mutohet 'filtered').
  const sorted = [...filtered];
  const comparators = {
    "orders-desc": (a, b) => b.orders - a.orders,
    "orders-asc": (a, b) => a.orders - b.orders,
    "name-asc": (a, b) => (a.name || "").localeCompare(b.name || ""),
    "name-desc": (a, b) => (b.name || "").localeCompare(a.name || ""),
  };
  if (comparators[sortBy]) sorted.sort(comparators[sortBy]);

  return (
    <div className="page-content">
      <PageHeader
        title="Clients"
        count={sorted.length}
        onFilter={toggleFilter}
        onExport={exportCsv}
        filterActive={showFilter}
      />

      {/* Shiriti i filtrit: kërkim + renditje */}
      {showFilter && (
        <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 320 }}>
            <Search size={14} color={colors.textMuted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email or phone..."
              style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", cursor: "pointer" }}
          >
            <option value="">Sort by: Default</option>
            <option value="orders-desc">Orders (high → low)</option>
            <option value="orders-asc">Orders (low → high)</option>
            <option value="name-asc">Name (A → Z)</option>
            <option value="name-desc">Name (Z → A)</option>
          </select>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: colors.textMuted, fontFamily: "var(--font-mono)", fontSize: 13 }}>
          Loading...
        </div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: "center", color: colors.danger, fontFamily: "var(--font-mono)", fontSize: 13 }}>
          {error}
        </div>
      ) : (
        <>
      <Table
        rows={sorted}
        columns={[
          {
            key: "id",
            label: "ID",
            width: "56px",
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
            key: "name",
            label: "Name",
            render: (r) => (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: `linear-gradient(135deg, ${colors.text}, ${colors.accent})`,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {r.name.charAt(0)}
                </div>
                <span style={{ fontWeight: 500 }}>{r.name}</span>
              </div>
            ),
          },
          {
            key: "email",
            label: "Email",
            render: (r) => (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: colors.textMuted,
                }}
              >
                {r.email}
              </span>
            ),
          },
          {
            key: "phone",
            label: "Phone",
            render: (r) => (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: r.phone ? colors.text : colors.textDim,
                }}
              >
                {r.phone || "—"}
              </span>
            ),
          },
          {
            key: "address",
            label: "Address",
            render: (r) => (
              <span
                style={{
                  fontSize: 12,
                  color: r.address ? colors.textMuted : colors.textDim,
                }}
              >
                {r.address || "—"}
              </span>
            ),
          },
          {
            key: "orders",
            label: "Orders",
            width: "80px",
            render: (r) => (
              <span style={{ fontFamily: "var(--font-mono)" }}>{r.orders}</span>
            ),
          },
          {
            key: "action",
            label: "",
            width: "48px",
            render: (r) => (
              <button
                title="Shiko detajet"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetail(r);
                }}
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
                  border: `1px solid ${colors.border}`,
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
                <Eye size={14} />
              </button>
            ),
          },
        ]}
      />

      {sorted.length === 0 && (
        <div
          style={{
            padding: 32,
            textAlign: "center",
            color: colors.textMuted,
            fontFamily: "var(--font-sans)",
            fontSize: 13,
          }}
        >
          No clients found{query ? ` for "${query}"` : ""}.
        </div>
      )}
        </>
      )}

      {/* Detajet e klientit */}
      {detail && (
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
              width: 440,
              maxWidth: "92vw",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    background: `linear-gradient(135deg, ${colors.text}, ${colors.accent})`,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  {detail.name.charAt(0)}
                </div>
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 600,
                      color: colors.text,
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {detail.name}
                  </h2>
                  <span
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Client #{detail.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetail(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: colors.textMuted,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <DetailRow
              icon={<Mail size={15} />}
              label="Email"
              value={detail.email}
            />
            <DetailRow
              icon={<Phone size={15} />}
              label="Telefon"
              value={detail.phone || "—"}
            />
            <DetailRow
              icon={<MapPin size={15} />}
              label="Adresa"
              value={detail.address || "—"}
            />
            <DetailRow
              icon={<ShoppingCart size={15} />}
              label="Porosi gjithsej"
              value={detail.orders}
            />

            <button
              onClick={() => setDetail(null)}
              style={{
                width: "100%",
                marginTop: 20,
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
              Mbyll
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div style={{ color: colors.textMuted, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 10,
            color: colors.textMuted,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 14,
            color: colors.text,
            fontFamily: "var(--font-sans)",
            marginTop: 1,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
