import { Fragment } from "react";
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
import { mockData } from "../data/mockData";
import { useAuth } from "../auth/AuthContext";
import ClientDashboard from "./ClientDashboard";
import AdminDashboard from "./AdminDashboard";
import KpiCard from "../components/ui/KpiCard";
import StatusBadge from "../components/ui/StatusBadge";

// Hapat e flow-it të porosisë (përdoret te seksioni "Order Lifecycle").
const flowSteps = [
  { icon: FileText, label: "Sales Order", sub: "4 active", color: colors.info },
  { icon: Box, label: "Pallet", sub: "3 prepared", color: colors.warning },
  {
    icon: ClipboardList,
    label: "Packing List",
    sub: "3 ready",
    color: colors.warning,
  },
  {
    icon: Truck,
    label: "Shipment",
    sub: "4 total",
    color: colors.accent,
    highlight: true,
  },
  {
    icon: CheckCircle2,
    label: "Delivered",
    sub: "1 done",
    color: colors.success,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const isClient = user?.roles?.includes("Client");
  const isAdmin = user?.roles?.includes("Admin");

  if (isClient) return <ClientDashboard />;
  if (isAdmin) return <AdminDashboard />;
  const totalShipments = mockData.shipments.length;
  const delivered = mockData.shipments.filter(
    (s) => s.status === "Delivered",
  ).length;
  const inTransit = mockData.shipments.filter(
    (s) => s.status === "Shipped",
  ).length;
  const totalRevenue = mockData.salesOrders.reduce(
    (sum, o) => sum + o.total,
    0,
  );

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
        <div
          style={{
            position: "absolute",
            right: 20,
            bottom: 20,
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            opacity: 0.4,
            letterSpacing: "0.1em",
          }}
        >
          SHIPMENT MODULE · ERA
        </div>
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
            Lab 2 · Warehouse Management System
          </div>
          <h1
            className="hero-heading"
            style={{
              fontFamily: "var(--font-sans)",
            }}
          >
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
            Menaxho krejt flow-in nga porosia deri tek dorëzimi. Sistemi është i
            lidhur me API në localhost:7103.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KpiCard
          label="Total Shipments"
          value={totalShipments}
          change="+12.5%"
          trend="up"
          accent
        />
        <KpiCard
          label="Delivered"
          value={delivered}
          change="+8.2%"
          trend="up"
        />
        <KpiCard
          label="In Transit"
          value={inTransit}
          change="-2.1%"
          trend="down"
        />
        <KpiCard
          label="Revenue (KSO)"
          value={`€${(totalRevenue / 1000).toFixed(1)}k`}
          change="+18.4%"
          trend="up"
        />
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
                    boxShadow: step.highlight
                      ? `0 4px 14px ${step.color}40`
                      : "none",
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
              Recent Shipments
            </h3>
            <a
              style={{
                fontSize: 12,
                color: colors.accent,
                fontFamily: "var(--font-sans)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                cursor: "pointer",
              }}
            >
              View all <ArrowUpRight size={12} />
            </a>
          </div>
          {mockData.shipments.slice(0, 4).map((s, i) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: i < 3 ? `1px solid ${colors.border}` : "none",
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
                  {s.number}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: colors.textMuted,
                    fontFamily: "var(--font-sans)",
                    marginTop: 2,
                  }}
                >
                  {s.warehouseName}
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
          {mockData.warehouses.map((w) => (
            <div key={w.id} style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: colors.text,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {w.name}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: colors.textMuted,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {w.utilization}%
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  background: colors.bg,
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${w.utilization}%`,
                    height: "100%",
                    background:
                      w.utilization > 70 ? colors.accent : colors.text,
                    borderRadius: 999,
                    transition: "width 0.6s",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
