import { useEffect, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Box,
  ClipboardList,
  Truck,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { colors } from "../theme/colors";
import { useAuth } from "../auth/AuthContext";
import { shipmentsApi, warehousesApi, palletsApi, packingListsApi } from "../api";
import { useLiveResource } from "../realtime/useLiveResource";
import ClientDashboard from "./ClientDashboard";
import AdminDashboard from "./AdminDashboard";
import KpiCard from "../components/ui/KpiCard";
import StatusBadge from "../components/ui/StatusBadge";

export default function DashboardPage() {
  const { user } = useAuth();
  const roles = user?.roles || [];

  if (roles.includes("Client")) return <ClientDashboard />;
  if (roles.includes("Admin")) return <AdminDashboard />;
  return <StaffDashboard />;
}

// Dashboard për Worker/Manager — i ndërtuar nga të dhëna reale të rrjedhës së
// fulfillment-it (shipments, pallets, packing lists, warehouses). Nuk përdor sales
// orders sepse ai endpoint është vetëm Admin/Manager (Worker do merrte 403).
function StaffDashboard() {
  const [shipments, setShipments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [pallets, setPallets] = useState([]);
  const [packingLists, setPackingLists] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [sh, wh, pl, pk] = await Promise.all([
        shipmentsApi.getAll().catch(() => []),
        warehousesApi.getAll().catch(() => []),
        palletsApi.getAll().catch(() => []),
        packingListsApi.getAll().catch(() => []),
      ]);
      setShipments(sh);
      setWarehouses(wh);
      setPallets(pl);
      setPackingLists(pk);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rifreskim live kur ndryshojnë burimet përkatëse.
  useLiveResource(
    ["shipments", "pallets", "packinglists", "inventory", "warehouses"],
    () => load(true),
  );

  // ---- Metrika reale ----
  const totalShipments = shipments.length;
  const delivered = shipments.filter((s) => s.status === "Delivered").length;
  const inTransit = shipments.filter((s) => s.status === "Shipped").length;
  const readyToShip = packingLists.filter((pl) => pl.status === "Ready").length;
  const ordersInFulfillment = new Set(pallets.map((p) => p.salesOrderId)).size;

  const flowSteps = [
    { icon: FileText, label: "Sales Order", sub: `${ordersInFulfillment} in fulfillment`, color: colors.info },
    { icon: Box, label: "Pallet", sub: `${pallets.length} prepared`, color: colors.warning },
    { icon: ClipboardList, label: "Packing List", sub: `${readyToShip} ready`, color: colors.warning },
    { icon: Truck, label: "Shipment", sub: `${totalShipments} total`, color: colors.accent, highlight: true },
    { icon: CheckCircle2, label: "Delivered", sub: `${delivered} done`, color: colors.success },
  ];

  const recentShipments = [...shipments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: colors.textMuted, fontFamily: "var(--font-mono)", fontSize: 13 }}>
        Loading...
      </div>
    );
  }

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
            Warehouse Management System
          </div>
          <h1 className="hero-heading" style={{ fontFamily: "var(--font-sans)" }}>
            SalesOrder → Pallet → PackingList →{" "}
            <span style={{ color: colors.accent }}>Shipment</span>
          </h1>
          <p
            style={{
              marginTop: 12,
              marginBottom: 0,
              fontSize: 14,
              opacity: 0.7,
              fontFamily: "var(--font-sans)",
              lineHeight: 1.5,
            }}
          >
            Manage the entire flow from order to delivery.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KpiCard label="Total Shipments" value={totalShipments} accent />
        <KpiCard label="Delivered" value={delivered} />
        <KpiCard label="In Transit" value={inTransit} />
        <KpiCard label="Ready to Ship" value={readyToShip} />
      </div>

      {/* Flow visualization */}
      <div
        style={{
          padding: 24,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <div style={{ marginBottom: 20 }}>
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
            Process Flow
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
            Order Lifecycle
          </h3>
        </div>
        <div className="flow-row">
          {flowSteps.map((step, i, arr) => (
            <Fragment key={step.label}>
              <div style={{ flex: 1, minWidth: 72, textAlign: "center" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: step.highlight ? step.color : `${step.color}15`,
                    color: step.highlight ? "white" : step.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 10px",
                    boxShadow: step.highlight ? `0 4px 14px ${step.color}40` : "none",
                  }}
                >
                  <step.icon size={20} strokeWidth={2} />
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: colors.text,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {step.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: colors.textMuted,
                    fontFamily: "var(--font-mono)",
                    marginTop: 2,
                  }}
                >
                  {step.sub}
                </div>
              </div>
              {i < arr.length - 1 && (
                <ArrowRight
                  className="flow-arrow"
                  size={16}
                  color={colors.textDim}
                  style={{ flexShrink: 0 }}
                />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Two columns */}
      <div className="bottom-grid">
        {/* Recent shipments */}
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: colors.text,
                fontFamily: "var(--font-sans)",
              }}
            >
              Recent Shipments
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
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {recentShipments.length === 0 && (
            <div style={{ padding: "20px 0", textAlign: "center", color: colors.textMuted, fontSize: 13 }}>
              No shipments yet
            </div>
          )}
          {recentShipments.map((s, i) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: i < recentShipments.length - 1 ? `1px solid ${colors.border}` : "none",
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
                  {s.shipmentNumber}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: colors.textMuted,
                    fontFamily: "var(--font-sans)",
                    marginTop: 2,
                  }}
                >
                  {s.warehouseName || "—"}
                </div>
              </div>
              <StatusBadge status={s.status} />
            </div>
          ))}
        </div>

        {/* Warehouse utilization */}
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: 16,
              fontSize: 14,
              fontWeight: 600,
              color: colors.text,
              fontFamily: "var(--font-sans)",
            }}
          >
            Warehouse Utilization
          </h3>
          {warehouses.length === 0 && (
            <div style={{ padding: "20px 0", textAlign: "center", color: colors.textMuted, fontSize: 13 }}>
              No warehouses
            </div>
          )}
          {warehouses.map((w) => {
            const util = w.utilization ?? 0;
            return (
              <div key={w.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: colors.text, fontFamily: "var(--font-sans)" }}>
                    {w.name}
                  </span>
                  <span style={{ fontSize: 12, color: colors.textMuted, fontFamily: "var(--font-mono)" }}>
                    {util}%
                  </span>
                </div>
                <div style={{ height: 4, background: colors.bg, borderRadius: 999, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min(100, util)}%`,
                      height: "100%",
                      background: util > 70 ? colors.accent : colors.text,
                      borderRadius: 999,
                      transition: "width 0.6s",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
