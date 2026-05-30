import { useEffect, useState } from "react";
import { Save, Check } from "lucide-react";
import { colors } from "../theme/colors";
import { rolesApi } from "../api";

function RoleBadge({ name }) {
  const map = {
    Admin: { bg: colors.dangerSoft, fg: colors.danger },
    Manager: { bg: colors.infoSoft, fg: colors.info },
    Worker: { bg: colors.warningSoft, fg: colors.warning },
    Client: { bg: colors.successSoft, fg: colors.success },
  };
  const c = map[name] || { bg: "#F0EFEA", fg: colors.textMuted };
  return (
    <span style={{ background: c.bg, color: c.fg, padding: "3px 10px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 600 }}>
      {name}
    </span>
  );
}

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(null);
  const [localPerms, setLocalPerms] = useState({});

  useEffect(() => {
    rolesApi.getAll()
      .then(data => {
        setRoles(data);
        const init = {};
        data.forEach(r => { init[r.id] = new Set(r.permissions); });
        setLocalPerms(init);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (roleId, perm) => {
    setLocalPerms(prev => {
      const s = new Set(prev[roleId] || []);
      if (s.has(perm)) s.delete(perm);
      else s.add(perm);
      return { ...prev, [roleId]: s };
    });
  };

  const save = async (roleId) => {
    setSaving(roleId);
    try {
      const savedPerms = [...(localPerms[roleId] || [])];
      await rolesApi.updatePermissions(roleId, savedPerms);
      // Sinkronizo gjendjen origjinale me ate qe sapo u ruajt, qe llogaritja
      // 'isDirty' te jete e sakte ne ndryshimet pasuese (p.sh. heqja e te njejtit permission).
      setRoles((prev) => prev.map((r) =>
        r.id === roleId ? { ...r, permissions: savedPerms } : r
      ));
      setSaved(roleId);
      setTimeout(() => setSaved(null), 2000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: colors.textMuted, fontFamily: "var(--font-mono)" }}>Loading...</div>;
  if (error) return <div style={{ padding: 40, textAlign: "center", color: colors.danger, fontFamily: "var(--font-mono)" }}>{error}</div>;

  return (
    <div style={{ padding: "0 0 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
          Administration
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: colors.text, fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" }}>
          Roles &amp; Permissions
        </h1>
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        {roles.map(role => {
          const currentPerms = localPerms[role.id] || new Set();
          const isDirty = JSON.stringify([...currentPerms].sort()) !== JSON.stringify([...role.permissions].sort());
          const isSaving = saving === role.id;
          const isSaved = saved === role.id;

          return (
            <div key={role.id} style={{
              background: colors.surface, border: `1px solid ${colors.border}`,
              borderRadius: 12, padding: 24,
            }}>
              {/* Role header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <RoleBadge name={role.name} />
                    <span style={{ fontSize: 13, color: colors.textMuted, fontFamily: "var(--font-sans)" }}>
                      {currentPerms.size} / {role.allPermissions.length} permissions
                    </span>
                  </div>
                  {role.description && (
                    <div style={{ fontSize: 12, color: colors.textMuted, fontFamily: "var(--font-sans)" }}>
                      {role.description}
                    </div>
                  )}
                </div>
                <button
                  disabled={!isDirty || isSaving}
                  onClick={() => save(role.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 14px", border: "none", borderRadius: 8,
                    background: isSaved ? colors.success : isDirty ? colors.text : colors.border,
                    color: isSaved || isDirty ? colors.surface : colors.textMuted,
                    cursor: isDirty && !isSaving ? "pointer" : "not-allowed",
                    fontSize: 12, fontFamily: "var(--font-sans)", fontWeight: 500,
                    transition: "background 0.2s",
                  }}
                >
                  {isSaved ? <><Check size={13} /> Saved</> : <><Save size={13} /> {isSaving ? "Saving..." : "Save"}</>}
                </button>
              </div>

              {/* Permissions grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                {role.allPermissions.map(perm => {
                  const active = currentPerms.has(perm);
                  const groupColor = permGroupColor(perm);
                  return (
                    <label key={perm} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                      background: active ? `${groupColor}12` : colors.bg,
                      border: `1px solid ${active ? groupColor + "40" : colors.border}`,
                      transition: "all 0.15s",
                    }}>
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggle(role.id, perm)}
                        style={{ accentColor: groupColor, width: 14, height: 14, flexShrink: 0, cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 12, color: active ? colors.text : colors.textMuted, fontFamily: "var(--font-mono)", lineHeight: 1.3 }}>
                        {perm}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function permGroupColor(perm) {
  const lower = perm.toLowerCase();
  if (lower.includes("delete") || lower.includes("remove")) return colors.danger;
  if (lower.includes("create") || lower.includes("add")) return colors.success;
  if (lower.includes("update") || lower.includes("edit") || lower.includes("manage")) return colors.warning;
  if (lower.includes("view") || lower.includes("read")) return colors.info;
  if (lower.includes("report")) return "#7C3AED";
  return colors.accent;
}
