import { useEffect, useState } from "react";
import { Plus, Edit2, UserCheck, UserX, Shield, X, Check, Filter, Search, Download } from "lucide-react";
import { exportToCsv } from '../utils/exportCsv';
import { colors } from "../theme/colors";
import { usersApi } from "../api";
import { useAuth } from "../auth/AuthContext";
import { usePagination } from "../components/ui/usePagination";
import Pagination from "../components/ui/Pagination";

const ALL_ROLES = ["Admin", "Manager", "Worker", "Client"];

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: colors.surface, borderRadius: 14, padding: 28,
        width: 460, maxWidth: "92vw", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: colors.text, fontFamily: "var(--font-sans)" }}>
            {title}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", border: `1px solid ${colors.border}`,
  borderRadius: 8, fontSize: 13, fontFamily: "var(--font-sans)",
  background: colors.bg, color: colors.text, outline: "none", boxSizing: "border-box",
};

const selectStyle = {
  padding: "8px 12px", borderRadius: 8, border: `1px solid ${colors.border}`,
  background: colors.surface, color: colors.text, fontSize: 13,
  fontFamily: "var(--font-sans)", outline: "none", cursor: "pointer",
};

function RoleBadge({ role }) {
  const map = {
    Admin: { bg: colors.dangerSoft, fg: colors.danger },
    Manager: { bg: colors.infoSoft, fg: colors.info },
    Worker: { bg: colors.warningSoft, fg: colors.warning },
    Client: { bg: colors.successSoft, fg: colors.success },
  };
  const c = map[role] || { bg: "#F0EFEA", fg: colors.textMuted };
  return (
    <span style={{ background: c.bg, color: c.fg, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 500, marginRight: 4 }}>
      {role}
    </span>
  );
}

export default function UserManagementPage() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [rolesModal, setRolesModal] = useState(null);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Worker", phoneNumber: "", address: "" });
  const [editForm, setEditForm] = useState({ name: "", email: "", phoneNumber: "", address: "" });
  const [saving, setSaving] = useState(false);

  const [showFilter, setShowFilter] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // '' | active | inactive
  const [sortBy, setSortBy] = useState(""); // '' | name-asc | name-desc | created-desc | created-asc

  const load = () => {
    setLoading(true);
    usersApi.getAll()
      .then(setUsers)
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
      // Telefoni dhe adresa i perkasin vetem Client-it; per rolet e tjera nuk i dergojme fare.
      const payload = { name: form.name, email: form.email, password: form.password, role: form.role };
      if (form.role === "Client") {
        if (form.phoneNumber) payload.phoneNumber = form.phoneNumber;
        if (form.address) payload.address = form.address;
      }
      await usersApi.create(payload);
      setCreateModal(false);
      setForm({ name: "", email: "", password: "", role: "Worker", phoneNumber: "", address: "" });
      load();
      showFeedback("User created successfully.");
    } catch (err) {
      showFeedback(err.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersApi.update(editModal.id, editForm);
      setEditModal(null);
      load();
      showFeedback("User updated.");
    } catch (err) {
      showFeedback(err.message, false);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async user => {
    try {
      if (user.isActive) await usersApi.deactivate(user.id);
      else await usersApi.activate(user.id);
      load();
      showFeedback(user.isActive ? "User deactivated." : "User activated.");
    } catch (err) {
      showFeedback(err.message, false);
    }
  };

  const assignRole = async (userId, role) => {
    try {
      await usersApi.assignRole(userId, role);
      load();
      const updated = users.map(u => u.id === userId ? { ...u, roles: [...u.roles, role] } : u);
      setUsers(updated);
      if (rolesModal?.id === userId) setRolesModal(prev => ({ ...prev, roles: [...(prev.roles || []), role] }));
      showFeedback(`Role ${role} assigned.`);
    } catch (err) {
      showFeedback(err.message, false);
    }
  };

  const removeRole = async (userId, role) => {
    try {
      await usersApi.removeRole(userId, role);
      load();
      if (rolesModal?.id === userId) setRolesModal(prev => ({ ...prev, roles: (prev.roles || []).filter(r => r !== role) }));
      showFeedback(`Role ${role} removed.`);
    } catch (err) {
      showFeedback(err.message, false);
    }
  };

  const fmt = d => d ? new Date(d).toLocaleDateString("sq-AL", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const toggleFilter = () => {
    setShowFilter(v => {
      if (v) { setQuery(""); setRoleFilter(""); setStatusFilter(""); setSortBy(""); }
      return !v;
    });
  };

  // Filtrim sipas kërkimit/rolit/statusit + renditje.
  const displayed = (() => {
    const q = query.trim().toLowerCase();
    let list = users.filter(u => {
      if (q && !(u.name || "").toLowerCase().includes(q) && !(u.email || "").toLowerCase().includes(q)) return false;
      if (roleFilter && !(u.roles || []).includes(roleFilter)) return false;
      if (statusFilter === "active" && !u.isActive) return false;
      if (statusFilter === "inactive" && u.isActive) return false;
      return true;
    });
    const comparators = {
      "name-asc": (a, b) => (a.name || "").localeCompare(b.name || ""),
      "name-desc": (a, b) => (b.name || "").localeCompare(a.name || ""),
      "created-desc": (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      "created-asc": (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    };
    if (comparators[sortBy]) list = [...list].sort(comparators[sortBy]);
    return list;
  })();

  const pg = usePagination(displayed, 10);

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
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Administration
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: colors.text, fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" }}>
            User Management
          </h1>
        </div>
        <div className="page-header-actions">
          <button onClick={toggleFilter} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: showFilter ? colors.text : colors.surface,
            color: showFilter ? colors.surface : colors.text,
            border: `1px solid ${showFilter ? colors.text : colors.border}`, borderRadius: 8, padding: "9px 14px",
            fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)",
          }}>
            <Filter size={14} /> Filter
          </button>
          <button onClick={() => {
            const headers = ['ID', 'Name', 'Email', 'Roles', 'Phone', 'Status', 'Created At'];
            const rows = displayed.map(u => [
              u.id, u.name, u.email,
              (u.roles || []).join(', '),
              u.phoneNumber || '',
              u.isActive ? 'Active' : 'Inactive',
              fmt(u.createdAt),
            ]);
            exportToCsv(headers, rows, 'users');
          }} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: colors.surface, color: colors.text,
            border: `1px solid ${colors.border}`, borderRadius: 8, padding: "9px 14px",
            fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)",
          }}>
            <Download size={14} /> Export
          </button>
          {hasPermission('Users.Create') && (
            <button onClick={() => setCreateModal(true)} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: colors.text, color: colors.surface,
              border: "none", borderRadius: 8, padding: "9px 16px",
              fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)",
            }}>
              <Plus size={15} /> Create User
            </button>
          )}
        </div>
      </div>

      {/* Shiriti i filtrit */}
      {showFilter && (
        <div style={{ marginBottom: 20, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 320 }}>
            <Search size={14} color={colors.textMuted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={selectStyle}>
            <option value="">All roles</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
            <option value="">Sort by: Default</option>
            <option value="name-asc">Name (A → Z)</option>
            <option value="name-desc">Name (Z → A)</option>
            <option value="created-desc">Created (newest)</option>
            <option value="created-asc">Created (oldest)</option>
          </select>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: colors.textMuted, fontFamily: "var(--font-mono)" }}>Loading...</div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: "center", color: colors.danger, fontFamily: "var(--font-mono)" }}>{error}</div>
      ) : (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: colors.bg }}>
                {["Name", "Email", "Roles", "Status", "Created", "Last Login", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: colors.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500, borderBottom: `1px solid ${colors.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: "center", color: colors.textMuted, fontFamily: "var(--font-sans)", fontSize: 13 }}>
                    No users found.
                  </td>
                </tr>
              )}
              {pg.pageItems.map((user, i) => (
                <tr key={user.id} style={{ borderBottom: i < pg.pageItems.length - 1 ? `1px solid ${colors.border}` : "none" }}>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: colors.text, fontFamily: "var(--font-sans)" }}>
                    {user.name}
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: colors.textMuted, fontFamily: "var(--font-mono)" }}>
                    {user.email}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    {user.roles.map(r => <RoleBadge key={r} role={r} />)}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      background: user.isActive ? colors.successSoft : colors.dangerSoft,
                      color: user.isActive ? colors.success : colors.danger,
                      padding: "2px 8px", borderRadius: 6, fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 500,
                    }}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: colors.textMuted, fontFamily: "var(--font-mono)" }}>
                    {fmt(user.createdAt)}
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: colors.textMuted, fontFamily: "var(--font-mono)" }}>
                    {fmt(user.lastLoginAt)}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {hasPermission('Users.Edit') && (
                        <IconBtn title="Edit" onClick={() => { setEditModal(user); setEditForm({ name: user.name, email: user.email, phoneNumber: user.phoneNumber || "", address: user.address || "" }); }}>
                          <Edit2 size={13} />
                        </IconBtn>
                      )}
                      {hasPermission('Users.ManageRoles') && (
                        <IconBtn title="Manage Roles" onClick={() => setRolesModal(user)} color={colors.info}>
                          <Shield size={13} />
                        </IconBtn>
                      )}
                      {(user.isActive ? hasPermission('Users.Deactivate') : hasPermission('Users.Activate')) && (
                        <IconBtn title={user.isActive ? "Deactivate" : "Activate"} onClick={() => toggleActive(user)} color={user.isActive ? colors.danger : colors.success}>
                          {user.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                        </IconBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: colors.textMuted, fontFamily: "var(--font-sans)", fontSize: 13 }}>
              No users found.
            </div>
          )}
          <Pagination pagination={pg} />
        </div>
      )}

      {/* Create Modal */}
      {createModal && (
        <Modal title="Create User" onClose={() => setCreateModal(false)}>
          <form onSubmit={handleCreate}>
            <Field label="Full Name">
              <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
            </Field>
            <Field label="Email">
              <input required type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" />
            </Field>
            <Field label="Password">
              <input required type="password" style={inputStyle} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
            </Field>
            <Field label="Role">
              <select required style={inputStyle} value={form.role} onChange={e => {
                const role = e.target.value;
                // Telefoni dhe adresa vlejne vetem per Client; i pastrojme per rolet e tjera.
                setForm(f => ({ ...f, role, ...(role === "Client" ? {} : { phoneNumber: "", address: "" }) }));
              }}>
                {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            {form.role === "Client" && (
              <>
                <Field label="Phone (optional)">
                  <input style={inputStyle} value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} placeholder="+383..." />
                </Field>
                <Field label="Address (optional)">
                  <input style={inputStyle} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Rruga..." />
                </Field>
              </>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button type="button" onClick={() => setCreateModal(false)} style={{ flex: 1, padding: "9px 0", border: `1px solid ${colors.border}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-sans)", color: colors.text }}>
                Cancel
              </button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 8, background: colors.text, color: colors.surface, cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "var(--font-sans)", fontWeight: 500, opacity: saving ? 0.6 : 1 }}>
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editModal && (
        <Modal title="Edit User" onClose={() => setEditModal(null)}>
          <form onSubmit={handleEdit}>
            <Field label="Full Name">
              <input required style={inputStyle} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Email">
              <input required type="email" style={inputStyle} value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </Field>
            {/* Telefoni dhe adresa vlejnë vetëm për user-at me rol Client. */}
            {editModal.roles?.includes("Client") && (
              <>
                <Field label="Phone (optional)">
                  <input style={inputStyle} value={editForm.phoneNumber} onChange={e => setEditForm(f => ({ ...f, phoneNumber: e.target.value }))} placeholder="+383..." />
                </Field>
                <Field label="Address (optional)">
                  <input style={inputStyle} value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} placeholder="Rruga..." />
                </Field>
              </>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button type="button" onClick={() => setEditModal(null)} style={{ flex: 1, padding: "9px 0", border: `1px solid ${colors.border}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-sans)", color: colors.text }}>
                Cancel
              </button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 8, background: colors.text, color: colors.surface, cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "var(--font-sans)", fontWeight: 500, opacity: saving ? 0.6 : 1 }}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Roles Modal */}
      {rolesModal && (
        <Modal title={`Roles — ${rolesModal.name}`} onClose={() => setRolesModal(null)}>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: colors.textMuted, fontFamily: "var(--font-sans)" }}>
            Menaxho rolet e këtij user-i.
          </p>
          {ALL_ROLES.map(role => {
            const hasRole = rolesModal.roles?.includes(role);
            return (
              <div key={role} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", marginBottom: 8,
                background: hasRole ? colors.successSoft : colors.bg,
                border: `1px solid ${hasRole ? colors.success + "40" : colors.border}`,
                borderRadius: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <RoleBadge role={role} />
                </div>
                <button onClick={() => hasRole ? removeRole(rolesModal.id, role) : assignRole(rolesModal.id, role)} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "5px 12px", border: "none", borderRadius: 6,
                  background: hasRole ? colors.dangerSoft : colors.successSoft,
                  color: hasRole ? colors.danger : colors.success,
                  cursor: "pointer", fontSize: 12, fontFamily: "var(--font-sans)", fontWeight: 500,
                }}>
                  {hasRole ? <><X size={12} /> Remove</> : <><Check size={12} /> Assign</>}
                </button>
              </div>
            );
          })}
          <button onClick={() => setRolesModal(null)} style={{ width: "100%", marginTop: 16, padding: "9px 0", border: `1px solid ${colors.border}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-sans)", color: colors.text }}>
            Close
          </button>
        </Modal>
      )}
    </div>
  );
}

function IconBtn({ children, onClick, title, color = colors.text }) {
  return (
    <button title={title} onClick={onClick} style={{
      background: "none", border: `1px solid ${colors.border}`, borderRadius: 6,
      padding: "5px 7px", cursor: "pointer", color,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {children}
    </button>
  );
}
