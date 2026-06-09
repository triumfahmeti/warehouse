import { X } from "lucide-react";
import { colors } from "../../theme/colors";
import { getVisibleNavItems, getVisibleGroups } from "./navItems";
import NavLink from "./NavLink";
import { useAuth } from "../../auth/AuthContext";

export default function Sidebar({ isOpen = false, onClose, companyName = 'Warehouse OS' }) {  const { user, hasAnyPermission } = useAuth();

  // Filtrim sipas lejeve të user-it
  const visibleItems = getVisibleNavItems(hasAnyPermission);
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
            {user?.roles?.[0] || "No role"}
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

      
    </aside>
  );
}
