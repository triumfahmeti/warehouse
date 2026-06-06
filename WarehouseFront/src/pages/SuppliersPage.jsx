import { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, X, Pencil, Trash2, Search } from 'lucide-react';
import { colors } from '../theme/colors';
import { suppliersApi } from '../api';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import { PrimaryButton } from '../components/ui/Button';
import { exportToCsv } from '../utils/exportCsv';
import ImportButton from '../components/ui/ImportButton';
import { importApi } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useLiveResource } from '../realtime/useLiveResource';

const emptyForm = { name: '', contactPerson: '', email: '', phone: '', address: '', city: '', country: '' };

export default function SuppliersPage() {
  const { user } = useAuth();
  const isAdmin = (user?.roles || []).includes('Admin');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalMode, setModalMode] = useState(null); // null | 'create' | 'edit'
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rowMenu, setRowMenu] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [showFilter, setShowFilter] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('');

  const showFeedback = (msg, ok = true) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3000);
  };

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await suppliersApi.getAll();
      setSuppliers(data);
      setError(null);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useLiveResource('suppliers', () => load(true));

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModalMode('create'); };
  const openEdit = (s) => {
    setForm({
      name: s.name || '', contactPerson: s.contactPerson || '', email: s.email || '',
      phone: s.phone || '', address: s.address || '', city: s.city || '', country: s.country || '',
    });
    setEditId(s.id);
    setModalMode('edit');
    setRowMenu(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dto = {
        name: form.name,
        contactPerson: form.contactPerson,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        country: form.country,
      };
      if (modalMode === 'edit') {
        await suppliersApi.update(editId, dto);
        showFeedback('Supplier updated successfully.');
      } else {
        await suppliersApi.create(dto);
        showFeedback('Supplier created successfully.');
      }
      setModalMode(null);
      await load();
    } catch (err) {
      showFeedback(err.message, false);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await suppliersApi.remove(target.id);
      await load();
      showFeedback('Supplier deleted.');
    } catch (err) {
      showFeedback(err.message, false);
    }
  };

  const toggleRowMenu = (e, s) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setRowMenu(prev => prev?.id === s.id ? null : { id: s.id, x: rect.right, y: rect.bottom });
  };

  const toggleFilter = () => setShowFilter(v => { if (v) { setQuery(''); setSortBy(''); } return !v; });

  const q = query.trim().toLowerCase();
  const filtered = q
    ? suppliers.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.contactPerson || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q))
    : suppliers;
  const sorted = [...filtered];
  const comparators = {
    'name-asc': (a, b) => (a.name || '').localeCompare(b.name || ''),
    'name-desc': (a, b) => (b.name || '').localeCompare(a.name || ''),
  };
  if (comparators[sortBy]) sorted.sort(comparators[sortBy]);

  const exportCsv = () => {
    const headers = ['ID', 'Name', 'Contact Person', 'Email', 'Phone', 'Address', 'City', 'Country'];
    const rows = sorted.map(s => [s.id, s.name, s.contactPerson || '', s.email || '', s.phone || '', s.address || '', s.city || '', s.country || '']);
    exportToCsv(headers, rows, 'suppliers');
  };

  return (
    <div className="page-content">
      <PageHeader
        title="Suppliers"
        count={sorted.length}
        onFilter={toggleFilter}
        filterActive={showFilter}
        onExport={exportCsv}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdmin && (
              <ImportButton
                onImport={async (file) => {
                  const res = await importApi.suppliers(file);
                  const msg = res?.errors?.length
                    ? `Imported: ${res.successCount}, skipped: ${res.skippedCount}. Errors: ${res.errors.map(e => `Row ${e.row}: ${e.message}`).join('; ')}`
                    : `Imported: ${res?.successCount ?? 0} suppliers, skipped: ${res?.skippedCount ?? 0}`;
                  showFeedback(msg, !res?.errors?.length);
                  await load();
                }}
              />
            )}
            <PrimaryButton icon={Plus} onClick={openCreate}>New Supplier</PrimaryButton>
          </div>
        }
      />

      {showFilter && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 320 }}>
            <Search size={14} color={colors.textMuted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, email, contact or city..."
              style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
            <option value="">Sort by: Default</option>
            <option value="name-asc">Name (A → Z)</option>
            <option value="name-desc">Name (Z → A)</option>
          </select>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: colors.textMuted, fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading...</div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', color: colors.danger, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{error}</div>
      ) : (
        <Table
          rows={sorted}
          columns={[
            { key: 'id', label: 'ID', width: '60px', render: r => <span style={{ fontFamily: 'var(--font-mono)', color: colors.textMuted, fontSize: 12 }}>#{r.id}</span> },
            { key: 'name', label: 'Name', render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
            { key: 'contactPerson', label: 'Contact', render: r => <span style={{ color: r.contactPerson ? colors.text : colors.textDim }}>{r.contactPerson || '—'}</span> },
            { key: 'email', label: 'Email', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: colors.textMuted }}>{r.email || '—'}</span> },
            { key: 'phone', label: 'Phone', width: '140px', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: r.phone ? colors.text : colors.textDim }}>{r.phone || '—'}</span> },
            { key: 'address', label: 'Address', render: r => <span style={{ fontSize: 12, color: r.address ? colors.textMuted : colors.textDim }}>{r.address || '—'}</span> },
            { key: 'location', label: 'Location', width: '160px', render: r => <span style={{ fontSize: 12, color: colors.textMuted }}>{[r.city, r.country].filter(Boolean).join(', ') || '—'}</span> },
            { key: 'action', label: '', width: '48px', render: r => (
              <button onClick={e => toggleRowMenu(e, r)} title="Actions"
                style={{ all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, cursor: 'pointer', color: colors.textMuted }}
                onMouseEnter={e => { e.currentTarget.style.background = colors.bg; e.currentTarget.style.color = colors.text; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.textMuted; }}>
                <MoreHorizontal size={15} />
              </button>
            ) },
          ]}
        />
      )}

      {/* Row actions menu */}
      {rowMenu && (
        <>
          <div onClick={() => setRowMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
          <div style={{ position: 'fixed', top: rowMenu.y + 4, left: rowMenu.x - 150, width: 150, zIndex: 1001, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            <MenuItem icon={<Pencil size={14} />} label="Edit" onClick={() => openEdit(suppliers.find(s => s.id === rowMenu.id))} />
            <MenuItem icon={<Trash2 size={14} />} label="Delete" danger onClick={() => { setDeleteTarget(suppliers.find(s => s.id === rowMenu.id)); setRowMenu(null); }} />
          </div>
        </>
      )}

      {/* Create / Edit modal */}
      {modalMode && (
        <Modal title={modalMode === 'edit' ? 'Edit Supplier' : 'New Supplier'} onClose={() => setModalMode(null)}>
          <form onSubmit={handleSubmit}>
            <Field label="Name">
              <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Distribution" />
            </Field>
            <Field label="Contact Person">
              <input required style={inputStyle} value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} placeholder="John Doe" />
            </Field>
            <Field label="Email">
              <input required type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="orders@acme.com" />
            </Field>
            <Field label="Phone">
              <input required style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+383..." />
            </Field>
            <Field label="Address">
              <input required style={inputStyle} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Rruga..." />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="City">
                <input required style={inputStyle} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Prishtinë" />
              </Field>
              <Field label="Country">
                <input required style={inputStyle} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="Kosovë" />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button type="button" onClick={() => setModalMode(null)} style={cancelBtn}>Cancel</button>
              <button type="submit" disabled={saving} style={submitBtn(saving)}>{saving ? 'Saving...' : (modalMode === 'edit' ? 'Save' : 'Create')}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <Modal title="Delete Supplier" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: colors.text, fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
            Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setDeleteTarget(null)} style={cancelBtn}>Cancel</button>
            <button onClick={confirmDelete} style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, background: colors.danger, color: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Delete</button>
          </div>
        </Modal>
      )}

      {/* Feedback toast */}
      {feedback && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1100, background: feedback.ok ? colors.text : colors.danger, color: colors.surface, padding: '12px 18px', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-sans)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxWidth: 360 }}>
          {feedback.msg}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick}
      style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 8, width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', color: danger ? colors.danger : colors.text }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? colors.dangerSoft : colors.bg)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      {icon} {label}
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: colors.surface, borderRadius: 14, padding: 28, width: 480, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: colors.text, fontFamily: 'var(--font-sans)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: 4 }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, color: colors.textMuted, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 12px', border: `1px solid ${colors.border}`,
  borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-sans)',
  background: colors.bg, color: colors.text, outline: 'none', boxSizing: 'border-box',
};

const selectStyle = {
  padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.border}`,
  background: colors.surface, color: colors.text, fontSize: 13,
  fontFamily: 'var(--font-sans)', outline: 'none', cursor: 'pointer',
};

const cancelBtn = { flex: 1, padding: '9px 0', border: `1px solid ${colors.border}`, borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', color: colors.text };
const submitBtn = (saving) => ({ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, background: colors.text, color: colors.surface, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500, opacity: saving ? 0.6 : 1 });
