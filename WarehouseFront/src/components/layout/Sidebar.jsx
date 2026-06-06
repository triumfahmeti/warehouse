import { X } from "lucide-react";
import { colors } from "../../theme/colors";
import { getVisibleNavItems, getVisibleGroups } from "./navItems";
import NavLink from "./NavLink";
import { useAuth } from "../../auth/AuthContext";

export default function Sidebar({ isOpen = false, onClose, companyName = 'Warehouse OS' }) {  const { user } = useAuth();
  const userRoles = user?.roles || [];

  // Filtrim sipas roleve të user-it
  const visibleItems = getVisibleNavItems(userRoles);
  const visibleGroups = getVisibleGroups(visibleItems);

  return (
    <aside
      className={`sidebar-responsive${isOpen ? " open" : ""}`}
      style={{
        width: 240,
        height: "100vh",
        position: "sticky",
        top: 0,
        borderRight: `1px solid ${colors.border}`,
        background: colors.surface,
        display: "flex",
        flexDirection: "column",
        padding: "20px 0",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "4px 20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* Buton mbyllje — vetëm mobile */}
        <button
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close menu"
          style={{
            all: "unset",
            position: "absolute",
            top: 18,
            right: 16,
            cursor: "pointer",
            width: 30,
            height: 30,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            color: colors.text,
          }}
        >
          <X size={16} />
        </button>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: colors.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(135deg, ${colors.accent} 0%, transparent 60%)`,
            }}
          />
          <span
            style={{
              position: "relative",
              color: colors.surface,
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "var(--font-mono)",
            }}
          >
            W
          </span>
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: colors.text,
              fontFamily: "var(--font-sans)",
              letterSpacing: "-0.01em",
            }}
          >
            {companyName}
          </div>
          <div
            style={{
              fontSize: 10,
              color: colors.textMuted,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {userRoles[0] || "No role"}
          </div>
        </div>
      </div>

      {/* Navigimi i filtruar. Klikimi i një linku mbyll sidebar-in në mobile. */}
      <nav
        onClick={onClose}
        style={{
          flex: 1,
          padding: "0 12px",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          overflowY: "auto",
        }}
      >
        {visibleGroups.map((group, gi) => (
          <div key={group}>
            <div
              style={{
                fontSize: 10,
                color: colors.textDim,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: gi === 0 ? "12px 10px 6px" : "16px 10px 6px",
              }}
            >
              {group}
            </div>
            {visibleItems
              .filter((item) => item.group === group)
              .map((item) => (
                <NavLink key={item.id} item={item} />
              ))}
          </div>
        ))}
      </nav>

      {/* API status */}
      <div
        style={{
          margin: "0 12px",
          padding: 14,
          borderRadius: 10,
          background: colors.text,
          color: colors.surface,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -10,
            top: -10,
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${colors.accent} 0%, transparent 70%)`,
            opacity: 0.5,
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
            }}
          >
            API Status
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: "#3DD68C",
                boxShadow: "0 0 0 3px rgba(61,214,140,0.2)",
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Connected</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
