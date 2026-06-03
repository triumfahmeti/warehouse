import { useState, useEffect, Fragment } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowRight,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";
import { colors, statusConfig } from "../theme/colors";
import { mockData } from "../data/mockData";
import { useAuth } from "../auth/AuthContext";
import { clientsApi } from "../api";
import KpiCard from "../components/ui/KpiCard";
import StatusBadge from "../components/ui/StatusBadge";
import { PrimaryButton } from "../components/ui/Button";

// Statuset e SalesOrder vijnë si numra nga MyOrderDto (enum) — i kthejmë në emër.
const SO_STATUS = ["New", "Confirmed", "Processing", "Completed", "Cancelled"];
const statusName = (s) => (typeof s === "number" ? (SO_STATUS[s] ?? String(s)) : s);

// Dashboard i dedikuar për rolin Client.
// - KPIs nga backend (me fallback nga mock nëse endpoint nuk ekziston)
// - Lista (Recent Orders, Active Shipments) nga mock data për fillim
// - Status chart i thjeshtë me distribuim sipas statusit
export default function ClientDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Marrim KPIs nga API. Nëse dështon, kalkulojmë nga mock data si fallback.
  useEffect(() => {
    // Promise.all i bën të dy thirrjet paralel - më shpejt se në varg.
    Promise.all([clientsApi.getMyStats(), clientsApi.getMyOrders()])
      .then(([statsData, ordersData]) => {
        setStats(statsData);
        setOrders(ordersData);
      })
      .catch((e) => setStatsError(e.message))
      .finally(() => setStatsLoading(false));
  }, []);

  // Fallback: kalkulim lokal nëse API dështoi
  const fallbackStats = computeFallbackStats(mockData);
  const data = stats || fallbackStats;

  // Mock data filtruar për "klientin aktual" - për momentin marrim porositë e parit.
  // Kur lidhemi me API real, kjo do vijë e filtruar nga backend automatikisht.
  const myOrders = orders.slice(0, 4);
  const myShipments = mockData.shipments
    .filter((s) => ["Ready", "Shipped", "Delivered"].includes(s.status))
    .slice(0, 4);

  return (
    <div style={{ padding: 32 }}>
      {/* Hero formal */}
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
        <div style={{ position: "relative", maxWidth: 600 }}>
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
            Client Portal
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.2,
            }}
          >
            {user?.email || "Client"}
          </h1>
          <p
            style={{
              marginTop: 10,
              marginBottom: 16,
              fontSize: 14,
              opacity: 0.7,
              fontFamily: "var(--font-sans)",
              lineHeight: 1.5,
            }}
          >
            Përmbledhje e porosive dhe dërgesave tuaja.
          </p>
          <Link
            to="/sales-orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              background: colors.accent,
              color: "white",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              fontFamily: "var(--font-sans)",
            }}
          >
            <ShoppingCart size={14} /> Place New Order
          </Link>
        </div>
      </div>

      {/* Status banner nëse API dështoi */}
      {statsError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            marginBottom: 16,
            borderRadius: 8,
            background: colors.warningSoft,
            color: colors.warning,
            fontSize: 12,
          }}
        >
          <AlertCircle size={14} />
          Statistikat live të ndërpritura — duke shfaqur të dhëna lokale.
        </div>
      )}

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <KpiCard
          label="Total Orders"
          value={statsLoading ? "—" : data.totalOrders}
          accent
        />
        <KpiCard
          label="Active Orders"
          value={statsLoading ? "—" : data.activeOrders}
        />
        <KpiCard
          label="In Transit"
          value={statsLoading ? "—" : data.inTransit}
        />
        <KpiCard
          label="Total Spent"
          value={
            statsLoading ? "—" : `€${(data.totalSpent / 1000).toFixed(1)}k`
          }
        />
      </div>

      {/* Status chart */}
      <div
        style={{
          padding: 24,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              color: colors.textMuted,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 4,
            }}
          >
            Order Status Distribution
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: colors.text,
              fontFamily: "var(--font-sans)",
              letterSpacing: "-0.02em",
            }}
          >
            Where your orders stand
          </h3>
        </div>
        <StatusChart distribution={data.statusDistribution} />
      </div>

      {/* Two columns: Recent Orders + Active Shipments */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Recent Orders */}
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: colors.text,
                fontFamily: "var(--font-sans)",
              }}
            >
              Recent Orders
            </h3>
            <Link
              to="/sales-orders"
              style={{
                fontSize: 12,
                color: colors.accent,
                fontFamily: "var(--font-sans)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {myOrders.map((o, i) => (
            <div
              key={o.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom:
                  i < myOrders.length - 1
                    ? `1px solid ${colors.border}`
                    : "none",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: colors.text,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {o.number}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: colors.textMuted,
                    marginTop: 2,
                  }}
                >
                  €{(o.totalAmount ?? 0).toFixed(2)} ·{" "}
                  {o.orderDate ? new Date(o.orderDate).toLocaleDateString("sq-AL") : ""}
                </div>
              </div>
              <StatusBadge status={statusName(o.status)} />
            </div>
          ))}
        </div>

        {/* Active Shipments */}
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: colors.text,
                fontFamily: "var(--font-sans)",
              }}
            >
              Active Shipments
            </h3>
            <Link
              to="/shipments"
              style={{
                fontSize: 12,
                color: colors.accent,
                fontFamily: "var(--font-sans)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              Track all <ArrowUpRight size={12} />
            </Link>
          </div>
          {myShipments.length === 0 && (
            <div
              style={{
                fontSize: 13,
                color: colors.textMuted,
                padding: "20px 0",
                textAlign: "center",
              }}
            >
              Asnjë dërgesë aktive
            </div>
          )}
          {myShipments.map((s, i) => {
            const icon =
              s.status === "Delivered"
                ? CheckCircle2
                : s.status === "Shipped"
                  ? Truck
                  : Package;
            const Icon = icon;
            const iconColor =
              s.status === "Delivered"
                ? colors.success
                : s.status === "Shipped"
                  ? colors.accent
                  : colors.warning;
            return (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom:
                    i < myShipments.length - 1
                      ? `1px solid ${colors.border}`
                      : "none",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${iconColor}15`,
                    color: iconColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={15} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: colors.text,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {s.number}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {s.date}
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Komponent i brendshëm për chart-in e statusit.
// Bars horizontale me ngjyrë sipas statusit.
function StatusChart({ distribution }) {
  const entries = Object.entries(distribution || {});
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) {
    return (
      <div
        style={{
          fontSize: 13,
          color: colors.textMuted,
          padding: "20px 0",
          textAlign: "center",
        }}
      >
        Asnjë porosi për të treguar
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {entries.map(([status, count]) => {
        const cfg = statusConfig[status] || statusConfig.Draft;
        const percent = total > 0 ? (count / total) * 100 : 0;
        return (
          <div
            key={status}
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <div
              style={{
                width: 100,
                fontSize: 12,
                color: colors.text,
                fontFamily: "var(--font-sans)",
              }}
            >
              {status}
            </div>
            <div
              style={{
                flex: 1,
                height: 8,
                background: colors.bg,
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  height: "100%",
                  background: cfg.dot,
                  borderRadius: 999,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
            <div
              style={{
                width: 40,
                fontSize: 12,
                color: colors.textMuted,
                fontFamily: "var(--font-mono)",
                textAlign: "right",
              }}
            >
              {count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Fallback - kalkulim lokal nga mock data nëse API nuk përgjigjet.
// Backend-i kur ta implementojë, duhet të kthejë të njëjtën strukturë.
function computeFallbackStats(data) {
  const orders = data.salesOrders;
  const shipments = data.shipments;

  // Status distribution nga porositë
  const statusDistribution = {};
  orders.forEach((o) => {
    statusDistribution[o.status] = (statusDistribution[o.status] || 0) + 1;
  });

  return {
    totalOrders: orders.length,
    activeOrders: orders.filter((o) =>
      ["New", "Confirmed", "Processing"].includes(o.status),
    ).length,
    inTransit: shipments.filter((s) => s.status === "Shipped").length,
    totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
    statusDistribution,
  };
}
