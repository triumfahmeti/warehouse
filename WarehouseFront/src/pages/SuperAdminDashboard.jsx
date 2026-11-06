import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building, LogIn, ArrowRight } from "lucide-react";
import { colors } from "../theme/colors";
import { useAuth } from "../auth/AuthContext";
import { tenantsApi } from "../api";
import { useLiveResource } from "../realtime/useLiveResource";
import KpiCard from "../components/ui/KpiCard";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// Dashboard-i i SuperAdmin-it kur nuk ka "hyrë" në asnjë tenant. Të dhënat vijnë
// nga /tenant/platform-stats, i vetmi endpoint që i anashkalon query filters.
export default function SuperAdminDashboard() {
  const { enterTenant } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setStats(await tenantsApi.platformStats());
      setError("");
    } catch (e) {
      setError(e?.message || "Could not load platform stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Pezullimi/aktivizimi i një tenanti nga TenantsPage e rifreskon vetë tabelën
  // këtu, pa refresh faqeje — backend-i transmeton "tenants" te grupi "platform".
  useLiveResource(["tenants"], load);

  if (loading) {
    return (
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
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 20,
          borderRadius: 10,
          background: colors.dangerSoft,
          border: `1px solid ${colors.danger}`,
          color: colors.danger,
          fontSize: 13,
          fontFamily: "var(--font-sans)",
        }}
      >
        {error}
      </div>
    );
  }

  const tenants = stats?.tenants || [];

  return (
    <div className="dashboard-page">
      {/* Hero */}
      <div
        style={{
          padding: 24,
          marginBottom: 24,
          borderRadius: 14,
          background: colors.text,
          color: colors.surface,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -60,
            top: -60,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${colors.accent} 0%, transparent 70%)`,
            opacity: 0.4,
          }}
        />
        <div style={{ position: "relative" }}>
          <div
            style={{
              fontSize: 11,
              opacity: 0.6,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}
          >
            Platform overview
          </div>
          <h2
            className="hero-heading"
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {stats.activeTenants} active{" "}
            {stats.activeTenants === 1 ? "tenant" : "tenants"}
            {stats.suspendedTenants > 0 &&
              `, ${stats.suspendedTenants} suspended`}
          </h2>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
            {stats.totalUsers} users across the platform · {stats.activeUsers}{" "}
            active
          </div>
        </div>
      </div>

      {/* KPI */}
      <div
        className="kpi-grid"
        style={{
          display: "grid",
          gap: 16,
          marginBottom: 24,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        <KpiCard label="Tenants" value={stats.totalTenants} accent />
        <KpiCard label="Users" value={stats.totalUsers} />
        <KpiCard label="Products" value={stats.totalProducts} />
        <KpiCard label="Sales orders" value={stats.totalSalesOrders} />
        <KpiCard label="Shipments" value={stats.totalShipments} />
      </div>

      {/* Tabela e tenantëve */}
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              color: colors.text,
              fontFamily: "var(--font-sans)",
            }}
          >
            <Building size={15} /> Tenant usage
          </div>
          <button
            onClick={() => navigate("/admin/tenants")}
            style={{
              all: "unset",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: colors.accent,
              fontFamily: "var(--font-mono)",
            }}
          >
            Manage <ArrowRight size={12} />
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              fontFamily: "var(--font-sans)",
            }}
          >
            <thead>
              <tr style={{ background: colors.bg }}>
                {[
                  "Tenant",
                  "Users",
                  "Products",
                  "Orders",
                  "Shipments",
                  "Last activity",
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      textAlign: i === 0 || i === 5 ? "left" : "right",
                      padding: "10px 18px",
                      fontSize: 11,
                      fontWeight: 500,
                      color: colors.textMuted,
                      fontFamily: "var(--font-mono)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: colors.textMuted,
                      fontSize: 13,
                    }}
                  >
                    No tenants yet.
                  </td>
                </tr>
              )}
              {tenants.map((t) => (
                <tr key={t.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <td style={{ padding: "12px 18px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ fontWeight: 500, color: colors.text }}>
                        {t.name}
                      </span>
                      {!t.isActive && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 7px",
                            borderRadius: 999,
                            background: colors.dangerSoft,
                            color: colors.danger,
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase",
                          }}
                        >
                          suspended
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: colors.textMuted,
                        fontFamily: "var(--font-mono)",
                        marginTop: 2,
                      }}
                    >
                      /{t.slug} · created {fmtDate(t.createdAt)}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      textAlign: "right",
                      fontFamily: "var(--font-mono)",
                      color: colors.text,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.users}
                    <span style={{ color: colors.textMuted }}>
                      {" "}
                      ({t.activeUsers} active)
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      textAlign: "right",
                      fontFamily: "var(--font-mono)",
                      color: colors.text,
                    }}
                  >
                    {t.products}
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      textAlign: "right",
                      fontFamily: "var(--font-mono)",
                      color: colors.text,
                    }}
                  >
                    {t.salesOrders}
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      textAlign: "right",
                      fontFamily: "var(--font-mono)",
                      color: colors.text,
                    }}
                  >
                    {t.shipments}
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: colors.textMuted,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmtDate(t.lastActivityAt)}
                  </td>
                  <td style={{ padding: "12px 18px", textAlign: "right" }}>
                    <button
                      disabled={!t.isActive}
                      onClick={() => enterTenant(t.id, t.name)}
                      title={
                        t.isActive
                          ? `Enter ${t.name}`
                          : "Tenant is suspended — reactivate it first"
                      }
                      style={{
                        all: "unset",
                        cursor: t.isActive ? "pointer" : "not-allowed",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 10px",
                        borderRadius: 7,
                        border: `1px solid ${colors.border}`,
                        fontSize: 12,
                        fontFamily: "var(--font-mono)",
                        color: t.isActive ? colors.text : colors.textMuted,
                        opacity: t.isActive ? 1 : 0.5,
                      }}
                    >
                      <LogIn size={12} /> Enter
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
