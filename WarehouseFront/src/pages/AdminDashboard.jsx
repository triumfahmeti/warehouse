import { useEffect, useState } from "react";
import { Users, UserCheck, UserX, ShoppingCart, Truck, Activity } from "lucide-react";
import { colors } from "../theme/colors";
import { adminDashboardApi } from "../api";
import KpiCard from "../components/ui/KpiCard";

function RelativeTime({ date }) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return <span>{diff}s ago</span>;
  if (diff < 3600) return <span>{Math.floor(diff / 60)}m ago</span>;
  if (diff < 86400) return <span>{Math.floor(diff / 3600)}h ago</span>;
  return <span>{Math.floor(diff / 86400)}d ago</span>;
}

function ActionBadge({ action }) {
  const lower = (action || "").toLowerCase();
  let bg = colors.infoSoft, fg = colors.info;
  if (lower.includes("delete") || lower.includes("remove")) { bg = colors.dangerSoft; fg = colors.danger; }
  else if (lower.includes("create") || lower.includes("add")) { bg = colors.successSoft; fg = colors.success; }
  else if (lower.includes("update") || lower.includes("edit") || lower.includes("change")) { bg = colors.warningSoft; fg = colors.warning; }
  return (
    <span style={{ background: bg, color: fg, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 500 }}>
      {action}
    </span>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminDashboardApi.getStats()
      .then(setStats)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: colors.textMuted, fontFamily: "var(--font-mono)" }}>
        Loading admin stats...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: colors.danger, fontFamily: "var(--font-mono)" }}>
        Failed to load: {error}
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Hero */}
      <div style={{
        padding: 24, marginBottom: 24, borderRadius: 14,
        background: colors.text, color: colors.surface,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: -60, top: -60, width: 240, height: 240,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.accent} 0%, transparent 70%)`,
          opacity: 0.35,
        }} />
        <div style={{
          position: "absolute", right: 20, bottom: 20, fontSize: 11,
          fontFamily: "var(--font-mono)", opacity: 0.35, letterSpacing: "0.1em",
        }}>
          ADMIN CONSOLE · SYSTEM HEALTH
        </div>
        <div style={{ position: "relative", maxWidth: 600 }}>
          <div style={{
            fontSize: 11, opacity: 0.6, fontFamily: "var(--font-mono)",
            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8,
          }}>
            Administration
          </div>
          <h1 className="hero-heading" style={{ fontFamily: "var(--font-sans)" }}>
            System Health{" "}
            <span style={{ color: colors.accent }}>Overview</span>
          </h1>
          <p style={{
            marginTop: 12, marginBottom: 0, fontSize: 14, opacity: 0.7,
            fontFamily: "var(--font-sans)", lineHeight: 1.5,
          }}>
            Monitor users, activity dhe gjendjen e përgjithshme të sistemit.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard label="Total Users" value={stats.totalUsers} accent
          icon={<Users size={16} />} />
        <KpiCard label="Active Users" value={stats.activeUsers}
          change={stats.totalUsers ? `${Math.round(stats.activeUsers / stats.totalUsers * 100)}%` : "0%"}
          trend="up" />
        <KpiCard label="Inactive Users" value={stats.inactiveUsers}
          change={stats.inactiveUsers > 0 ? `${stats.inactiveUsers} accounts` : "None"}
          trend={stats.inactiveUsers > 0 ? "down" : "up"} />
        <KpiCard label="Total Orders" value={stats.totalOrders} />
      </div>

      {/* Activity row */}
      <div className="admin-stat-grid">
        <StatTile icon={<Truck size={18} />} label="Total Shipments" value={stats.totalShipments} color={colors.accent} />
        <StatTile icon={<Activity size={18} />} label="Audit Log Entries" value={stats.totalAuditLogs} color={colors.info} />
        <StatTile icon={<UserCheck size={18} />} label="Active / Total" value={`${stats.activeUsers} / ${stats.totalUsers}`} color={colors.success} />
      </div>

      {/* Two columns */}
      <div className="bottom-grid">
        {/* Recent Logins */}
        <div style={{
          background: colors.surface, border: `1px solid ${colors.border}`,
          borderRadius: 12, padding: 20,
        }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: colors.text, fontFamily: "var(--font-sans)" }}>
            Recent Logins
          </h3>
          {stats.recentLogins.length === 0 ? (
            <p style={{ color: colors.textMuted, fontSize: 13, fontFamily: "var(--font-sans)" }}>No recent logins.</p>
          ) : (
            stats.recentLogins.map((login, i) => (
              <div key={`${login.userId}-${i}`} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: i < stats.recentLogins.length - 1 ? `1px solid ${colors.border}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: colors.accentSoft, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 600, color: colors.accent,
                    fontFamily: "var(--font-sans)", flexShrink: 0,
                  }}>
                    {(login.userName || login.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: colors.text, fontFamily: "var(--font-sans)" }}>
                      {login.userName || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)" }}>
                      {login.email}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)", textAlign: "right" }}>
                  <RelativeTime date={login.loginAt} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Activity */}
        <div style={{
          background: colors.surface, border: `1px solid ${colors.border}`,
          borderRadius: 12, padding: 20,
        }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: colors.text, fontFamily: "var(--font-sans)" }}>
            Recent Activity
          </h3>
          {stats.criticalActions.length === 0 ? (
            <p style={{ color: colors.textMuted, fontSize: 13, fontFamily: "var(--font-sans)" }}>No recent activity.</p>
          ) : (
            stats.criticalActions.map((act, i) => (
              <div key={act.id} style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                gap: 10, padding: "10px 0",
                borderBottom: i < stats.criticalActions.length - 1 ? `1px solid ${colors.border}` : "none",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <ActionBadge action={act.action} />
                    <span style={{ fontSize: 12, color: colors.textMuted, fontFamily: "var(--font-mono)" }}>
                      {act.entity}{act.entityId ? ` #${act.entityId}` : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: colors.text, fontFamily: "var(--font-sans)" }}>
                    {act.userName}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                  <RelativeTime date={act.createdAt} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, color }) {
  return (
    <div style={{
      background: colors.surface, border: `1px solid ${colors.border}`,
      borderRadius: 12, padding: "16px 20px",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: `${color}15`, color, display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, color: colors.text, fontFamily: "var(--font-sans)", letterSpacing: "-0.02em", marginTop: 2 }}>
          {value}
        </div>
      </div>
    </div>
  );
}
