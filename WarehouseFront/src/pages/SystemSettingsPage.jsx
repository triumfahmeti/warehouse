import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { colors } from "../theme/colors";
import { settingsApi } from "../api";

const inputStyle = {
  padding: "7px 10px", border: `1px solid ${colors.border}`,
  borderRadius: 8, fontSize: 13, fontFamily: "var(--font-sans)",
  background: colors.bg, color: colors.text, outline: "none", width: "100%", boxSizing: "border-box",
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ key: "", value: "", description: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ key: "", value: "", description: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    settingsApi.getAll()
      .then(setSettings)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const showFeedback = (msg, ok = true) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCreate = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.create(createForm);
      setShowCreate(false);
      setCreateForm({ key: "", value: "", description: "" });
      load();
      showFeedback("Setting created.");
    } catch (err) {
      showFeedback(err.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (id) => {
    setSaving(true);
    try {
      await settingsApi.update(id, editForm);
      setEditing(null);
      load();
      showFeedback("Setting updated.");
    } catch (err) {
      showFeedback(err.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, key) => {
    if (!confirm(`Delete setting "${key}"?`)) return;
    try {
      await settingsApi.remove(id);
      load();
      showFeedback("Setting deleted.");
    } catch (err) {
      showFeedback(err.message, false);
    }
  };

  const fmt = d => d ? new Date(d).toLocaleString("sq-AL", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* Feedback toast */}
      {feedback && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 2000,
          background: feedback.ok ? colors.success : colors.danger,
          color: "#fff", padding: "10px 18px", borderRadius: 8,
          fontSize: 13, fontFamily: "var(--font-sans)", boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}>
          {feedback.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Administration
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: colors.text, fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" }}>
            System Settings
          </h1>
        </div>
        <button onClick={() => setShowCreate(v => !v)} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: showCreate ? colors.border : colors.text, color: showCreate ? colors.text : colors.surface,
          border: "none", borderRadius: 8, padding: "9px 16px",
          fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)",
        }}>
          {showCreate ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Setting</>}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: colors.text, fontFamily: "var(--font-sans)" }}>New Setting</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Key">
                <input required style={inputStyle} value={createForm.key} onChange={e => setCreateForm(f => ({ ...f, key: e.target.value }))} placeholder="setting.key" />
              </Field>
              <Field label="Value">
                <input required style={inputStyle} value={createForm.value} onChange={e => setCreateForm(f => ({ ...f, value: e.target.value }))} placeholder="value" />
              </Field>
            </div>
            <Field label="Description">
              <input style={inputStyle} value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this setting control?" />
            </Field>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "8px 16px", border: `1px solid ${colors.border}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-sans)", color: colors.text }}>
                Cancel
              </button>
              <button type="submit" disabled={saving} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: colors.text, color: colors.surface, cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "var(--font-sans)", fontWeight: 500, opacity: saving ? 0.6 : 1 }}>
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: colors.textMuted, fontFamily: "var(--font-mono)" }}>Loading...</div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: "center", color: colors.danger, fontFamily: "var(--font-mono)" }}>{error}</div>
      ) : (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: colors.bg }}>
                {["Key", "Value", "Description", "Updated At", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500, borderBottom: `1px solid ${colors.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settings.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: i < settings.length - 1 ? `1px solid ${colors.border}` : "none" }}>
                  {editing === s.id ? (
                    <>
                      <td style={{ padding: "10px 14px" }}>
                        <input style={{ ...inputStyle, width: "auto" }} value={editForm.key} onChange={e => setEditForm(f => ({ ...f, key: e.target.value }))} />
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <input style={{ ...inputStyle, width: "auto" }} value={editForm.value} onChange={e => setEditForm(f => ({ ...f, value: e.target.value }))} />
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <input style={{ ...inputStyle, width: "auto" }} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)" }}>—</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => handleSaveEdit(s.id)} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", border: "none", borderRadius: 6, background: colors.success, color: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-sans)" }}>
                            <Check size={12} /> Save
                          </button>
                          <button onClick={() => setEditing(null)} style={{ display: "flex", alignItems: "center", padding: "5px 8px", border: `1px solid ${colors.border}`, borderRadius: 6, background: "none", cursor: "pointer", color: colors.text }}>
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: colors.text, fontFamily: "var(--font-mono)" }}>{s.key}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <code style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 5, padding: "2px 7px", fontSize: 12, fontFamily: "var(--font-mono)", color: colors.accent }}>
                          {s.value}
                        </code>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: colors.textMuted, fontFamily: "var(--font-sans)" }}>{s.description || "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{fmt(s.updatedAt)}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { setEditing(s.id); setEditForm({ key: s.key, value: s.value, description: s.description || "" }); }} style={{ background: "none", border: `1px solid ${colors.border}`, borderRadius: 6, padding: "5px 7px", cursor: "pointer", color: colors.text, display: "flex", alignItems: "center" }}>
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(s.id, s.key)} style={{ background: "none", border: `1px solid ${colors.border}`, borderRadius: 6, padding: "5px 7px", cursor: "pointer", color: colors.danger, display: "flex", alignItems: "center" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {settings.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: colors.textMuted, fontFamily: "var(--font-sans)", fontSize: 13 }}>
              No settings configured. Add the first one above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
