import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  LogIn,
  Power,
  PowerOff,
  X,
  AlertTriangle,
} from "lucide-react";
import { colors } from "../theme/colors";
import { tenantsApi } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useLiveResource } from "../realtime/useLiveResource";

function Modal({ title, onClose, children }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: colors.surface,
          borderRadius: 14,
          padding: 28,
          width: 460,
          maxWidth: "92vw",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: colors.text,
              fontFamily: "var(--font-sans)",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: colors.textMuted,
              padding: 4,
            }}
          >
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
      <label
        style={{
          display: "block",
          fontSize: 12,
          color: colors.textMuted,
          fontFamily: "var(--font-mono)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function IconBtn({ children, onClick, title, color = colors.text, disabled }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "none",
        border: `1px solid ${colors.border}`,
        borderRadius: 6,
        padding: "5px 7px",
        cursor: disabled ? "not-allowed" : "pointer",
        color,
        opacity: disabled ? 0.4 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "var(--font-sans)",
  background: colors.bg,
  color: colors.text,
  outline: "none",
  boxSizing: "border-box",
};

// "Kompania ABC" → "kompania-abc". Backend-i e kërkon unik globalisht.
const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[ëç]/g, (c) => (c === "ë" ? "e" : "c"))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const EMPTY_FORM = {
  name: "",
  slug: "",
  contactEmail: "",
  contactPhone: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

export default function TenantsPage() {
  const { hasPermission, enterTenant, activeTenantId } = useAuth();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
  });
  // Slug-un e gjenerojmë nga emri derisa user-i ta prekë vetë fushën.
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const [suspendModal, setSuspendModal] = useState(null);
  const [suspending, setSuspending] = useState(false);

  // silent = rifreskim pa e kthyer tabelën në gjendje "Loading...", që eventet
  // live të mos bëjnë tabelën të pulsojë.
  const refresh = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    return tenantsApi
      .getAll()
      .then(setTenants)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const load = () => refresh();

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Ndryshimet e bëra nga një SuperAdmin tjetër (ose nga dritare tjetër) hyjnë vetë.
  const liveReload = useCallback(() => refresh(true), [refresh]);
  useLiveResource(["tenants"], liveReload);

  const showFeedback = (msg, ok = true) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await tenantsApi.create({
        name: form.name,
        slug: form.slug,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
      });
      setCreateModal(false);
      setForm(EMPTY_FORM);
      setSlugTouched(false);
      load();
      showFeedback("Tenant created together with its first admin.");
    } catch (err) {
      showFeedback(err.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await tenantsApi.update(editModal.id, editForm);
      setEditModal(null);
      load();
      showFeedback("Tenant updated.");
    } catch (err) {
      showFeedback(err.message, false);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (t) => {
    if (t.isActive) {
      setSuspendModal(t);
      return;
    }
    try {
      await tenantsApi.activate(t.id);
      load();
      showFeedback("Tenant activated.");
    } catch (err) {
      showFeedback(err.message, false);
    }
  };

  const confirmSuspend = async () => {
    setSuspending(true);
    try {
      await tenantsApi.deactivate(suspendModal.id);
      setSuspendModal(null);
      load();
      showFeedback("Tenant suspended.");
    } catch (err) {
      showFeedback(err.message, false);
    } finally {
      setSuspending(false);
    }
  };

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <div style={{ padding: "0 0 40px" }}>
      {feedback && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 2000,
            background: feedback.ok ? colors.success : colors.danger,
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 8,
            fontSize: 13,
            fontFamily: "var(--font-sans)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          {feedback.msg}
        </div>
      )}

      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
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
            Administration
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 600,
              color: colors.text,
              fontFamily: "var(--font-sans)",
              letterSpacing: "-0.02em",
            }}
          >
            Tenants
          </h1>
        </div>
        <div className="page-header-actions">
          {hasPermission("Tenants.Create") && (
            <button
              onClick={() => setCreateModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: colors.text,
                color: colors.surface,
                border: "none",
                borderRadius: 8,
                padding: "9px 16px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              <Plus size={15} /> New tenant
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: colors.textMuted,
            fontFamily: "var(--font-mono)",
          }}
        >
          Loading...
        </div>
      ) : error ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: colors.danger,
            fontFamily: "var(--font-mono)",
          }}
        >
          {error}
        </div>
      ) : (
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            overflowX: "auto",
          }}
        >
          <table
            style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ background: colors.bg }}>
                {[
                  "Company",
                  "Slug",
                  "Email",
                  "Phone",
                  "Users",
                  "Status",
                  "Created",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontSize: 11,
                      color: colors.textMuted,
                      fontFamily: "var(--font-mono)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 500,
                      borderBottom: `1px solid ${colors.border}`,
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
                      padding: 32,
                      textAlign: "center",
                      color: colors.textMuted,
                      fontFamily: "var(--font-sans)",
                      fontSize: 13,
                    }}
                  >
                    No tenants yet.
                  </td>
                </tr>
              )}
              {tenants.map((t, i) => {
                const isCurrent = String(t.id) === String(activeTenantId);
                return (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom:
                        i < tenants.length - 1
                          ? `1px solid ${colors.border}`
                          : "none",
                      background: isCurrent ? colors.infoSoft : "transparent",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 13,
                        fontWeight: 500,
                        color: colors.text,
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {t.name}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 12,
                        color: colors.textMuted,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {t.slug}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 12,
                        color: colors.textMuted,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {t.contactEmail || "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 12,
                        color: colors.textMuted,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {t.contactPhone || "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 13,
                        color: colors.text,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {t.userCount}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          background: t.isActive
                            ? colors.successSoft
                            : colors.dangerSoft,
                          color: t.isActive ? colors.success : colors.danger,
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontFamily: "var(--font-mono)",
                          fontWeight: 500,
                        }}
                      >
                        {t.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 12,
                        color: colors.textMuted,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {fmt(t.createdAt)}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <IconBtn
                          title={
                            !t.isActive
                              ? "Tenant is suspended — activate it first"
                              : isCurrent
                                ? "You are inside this tenant"
                                : "Enter tenant"
                          }
                          onClick={() => enterTenant(t.id, t.name)}
                          disabled={isCurrent || !t.isActive}
                          color={colors.info}
                        >
                          <LogIn size={13} />
                        </IconBtn>
                        {hasPermission("Tenants.Edit") && (
                          <IconBtn
                            title="Edit"
                            onClick={() => {
                              setEditModal(t);
                              setEditForm({
                                name: t.name,
                                contactEmail: t.contactEmail || "",
                                contactPhone: t.contactPhone || "",
                              });
                            }}
                          >
                            <Edit2 size={13} />
                          </IconBtn>
                        )}
                        {hasPermission("Tenants.Edit") && (
                          <IconBtn
                            title={t.isActive ? "Suspend" : "Activate"}
                            onClick={() => toggleActive(t)}
                            color={t.isActive ? colors.danger : colors.success}
                          >
                            {t.isActive ? (
                              <PowerOff size={13} />
                            ) : (
                              <Power size={13} />
                            )}
                          </IconBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {createModal && (
        <Modal title="New tenant" onClose={() => setCreateModal(false)}>
          <form onSubmit={handleCreate}>
            <Field label="Company name">
              <input
                required
                style={inputStyle}
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: slugTouched ? f.slug : slugify(name),
                  }));
                }}
                placeholder="Acme Corp"
              />
            </Field>
            <Field label="Slug (unique)">
              <input
                required
                style={inputStyle}
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
                }}
                placeholder="acme-corp"
              />
            </Field>
            <Field label="Contact email ">
              <input
                required
                type="email"
                style={inputStyle}
                value={form.contactEmail}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactEmail: e.target.value }))
                }
                placeholder="info@acme.com"
              />
            </Field>
            <Field label="Contact phone">
              <input
                required
                type="tel"
                style={inputStyle}
                value={form.contactPhone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactPhone: e.target.value }))
                }
                placeholder="+383 44 123 456"
              />
            </Field>

            <div
              style={{
                borderTop: `1px solid ${colors.border}`,
                marginTop: 8,
                paddingTop: 16,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                First admin
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: colors.textMuted,
                  fontFamily: "var(--font-sans)",
                  marginTop: 4,
                }}
              >
                Created together with the tenant and given the Admin role inside
                it.
              </div>
            </div>

            <Field label="Admin name">
              <input
                required
                style={inputStyle}
                value={form.adminName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, adminName: e.target.value }))
                }
                placeholder="Jane Doe"
              />
            </Field>
            <Field label="Admin email">
              <input
                required
                type="email"
                style={inputStyle}
                value={form.adminEmail}
                onChange={(e) =>
                  setForm((f) => ({ ...f, adminEmail: e.target.value }))
                }
                placeholder="jane@acme.com"
              />
            </Field>
            <Field label="Password">
              <input
                required
                type="password"
                style={inputStyle}
                value={form.adminPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, adminPassword: e.target.value }))
                }
                placeholder="Min 6 characters, one uppercase letter and a digit"
              />
            </Field>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setCreateModal(false)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  background: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  color: colors.text,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  border: "none",
                  borderRadius: 8,
                  background: colors.text,
                  color: colors.surface,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editModal && (
        <Modal
          title={`Edit — ${editModal.name}`}
          onClose={() => setEditModal(null)}
        >
          <form onSubmit={handleEdit}>
            <Field label="Company name">
              <input
                required
                style={inputStyle}
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </Field>
            <Field label="Contact email">
              <input
                type="email"
                style={inputStyle}
                value={editForm.contactEmail}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, contactEmail: e.target.value }))
                }
              />
            </Field>

            <Field label="Contact phone">
              <input
                required
                type="tel"
                style={inputStyle}
                value={editForm.contactPhone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, contactPhone: e.target.value }))
                }
              />
            </Field>

            <div
              style={{
                fontSize: 12,
                color: colors.textMuted,
                fontFamily: "var(--font-sans)",
                marginTop: -4,
                marginBottom: 8,
              }}
            >
              The slug cannot be changed once the tenant has been created.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setEditModal(null)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  background: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  color: colors.text,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  border: "none",
                  borderRadius: 8,
                  background: colors.text,
                  color: colors.surface,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Suspend confirm */}
      {suspendModal && (
        <Modal
          title="Suspend tenant"
          onClose={() => !suspending && setSuspendModal(null)}
        >
          <div
            style={{
              display: "flex",
              gap: 14,
              padding: 14,
              marginBottom: 18,
              background: colors.dangerSoft,
              borderRadius: 10,
              border: `1px solid ${colors.danger}30`,
            }}
          >
            <AlertTriangle
              size={20}
              color={colors.danger}
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: colors.text,
                  fontFamily: "var(--font-sans)",
                  marginBottom: 6,
                }}
              >
                {suspendModal.name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: colors.text,
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1.55,
                }}
              >
                <strong>{suspendModal.userCount}</strong>
                {suspendModal.userCount === 1 ? " user" : " users"} will lose
                access.
              </div>
            </div>
          </div>

          <ul
            style={{
              margin: "0 0 20px",
              padding: 0,
              listStyle: "none",
              fontSize: 13,
              color: colors.textMuted,
              fontFamily: "var(--font-sans)",
              lineHeight: 1.7,
            }}
          >
            <li style={{ display: "flex", gap: 8 }}>
              <span style={{ color: colors.danger }}>•</span>
              Sign-in is blocked immediately for everyone.
            </li>
            <li style={{ display: "flex", gap: 8 }}>
              <span style={{ color: colors.danger }}>•</span>
              Active sessions end as soon as the token expires.
            </li>
            <li style={{ display: "flex", gap: 8 }}>
              <span style={{ color: colors.success }}>•</span>
              No data is deleted — suspension can be reverted at any time.
            </li>
          </ul>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => setSuspendModal(null)}
              disabled={suspending}
              style={{
                flex: 1,
                padding: "9px 0",
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                background: "none",
                cursor: suspending ? "not-allowed" : "pointer",
                fontSize: 13,
                fontFamily: "var(--font-sans)",
                color: colors.text,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmSuspend}
              disabled={suspending}
              style={{
                flex: 1,
                padding: "9px 0",
                border: "none",
                borderRadius: 8,
                background: colors.danger,
                color: "#fff",
                cursor: suspending ? "not-allowed" : "pointer",
                opacity: suspending ? 0.6 : 1,
                fontSize: 13,
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
              }}
            >
              {suspending ? "Suspending..." : "Suspend"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
