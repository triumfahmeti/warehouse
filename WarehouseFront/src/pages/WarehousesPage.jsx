import { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, X, Pencil, Trash2, Search } from 'lucide-react';
import { colors } from '../theme/colors';
import { warehousesApi } from '../api';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import { PrimaryButton } from '../components/ui/Button';

const emptyForm = { name: '', location: '', phone: '', email: '' };

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // modalMode: null | 'create' | 'edit'
  const [modalMode, setModalMode] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rowMenu, setRowMenu] = useState(null); // { id, x, y }
  const [feedback, setFeedback] = useState(null);

  const [showFilter, setShowFilter] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState(''); // '' | rafts-desc | rafts-asc | util-desc | util-asc

  const showFeedback = (msg, ok = true) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await warehousesApi.getAll();
      setWarehouses(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModalMode('create'); };
  const openEdit = (w) => {
    setForm({ name: w.name || '', location: w.location || '', phone: w.phone || '', email: w.email || '' });
    setEditId(w.id);
    setModalMode('edit');
    setRowMenu(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dto = {
        name: form.name,
        location: form.location,
        phone: form.phone || null,
        email: form.email || null,
      };
      if (modalMode === 'edit') {
        await warehousesApi.update(editId, dto);
        showFeedback('Warehouse updated successfully.');
      } else {
        await warehousesApi.create(dto);
        showFeedback('Warehouse created successfully.');
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
      await warehousesApi.remove(target.id);
      await load();
      showFeedback('Warehouse deleted.');
    } catch (err) {
      showFeedback(err.message, false);
    }
  };

  const toggleRowMenu = (e, w) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setRowMenu(prev => prev?.id === w.id ? null : { id: w.id, x: rect.right, y: rect.bottom });
  };

  const toggleFilter = () => {
    setShowFilter(v => {
      if (v) { setQuery(''); setSortBy(''); } // mbyllja pastron kërkimin + renditjen
      return !v;
    });
  };

  // Filtrim sipas emrit ose vendndodhjes.
  const q = query.trim().toLowerCase();
  const filtered = q
    ? warehouses.filter(w => w.name.toLowerCase().includes(q) || (w.location || '').toLowerCase().includes(q))
    : warehouses;

  // Renditje sipas numrit të rafteve ose utilization (kopje që të mos mutohet state-i).
  const sorted = [...filtered];
  const comparators = {
    'rafts-desc': (a, b) => b.raftCount - a.raftCount,
    'rafts-asc': (a, b) => a.raftCount - b.raftCount,
    'util-desc': (a, b) => b.utilization - a.utilization,
    'util-asc': (a, b) => a.utilization - b.utilization,
  };
  if (comparators[sortBy]) sorted.sort(comparators[sortBy]);

  return (
    <div className="page-content">
      <PageHeader
        title="Warehouses"
        count={sorted.length}
        onFilter={toggleFilter}
        filterActive={showFilter}
        action={<PrimaryButton icon={Plus} onClick={openCreate}>New Warehouse</PrimaryButton>}
      />

      {/* Shiriti i filtrit: kërkim + renditje */}
      {showFilter && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 320 }}>
            <Search size={14} color={colors.textMuted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or location..."
              style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">Sort by: Default</option>
            <option value="rafts-desc">Rafts (high → low)</option>
            <option value="rafts-asc">Rafts (low → high)</option>
            <option value="util-desc">Utilization (high → low)</option>
            <option value="util-asc">Utilization (low → high)</option>
          </select>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: colors.textMuted, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          Loading...
        </div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', color: colors.danger, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          {error}
        </div>
      ) : (
        <Table
          rows={sorted}
          columns={[
            { key: 'id', label: 'ID', width: '60px', render: r => <span style={{ fontFamily: 'var(--font-mono)', color: colors.textMuted, fontSize: 12 }}>#{r.id}</span> },
            { key: 'name', label: 'Name', render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
            { key: 'location', label: 'Location' },
            { key: 'raftCount', label: 'Rafts', width: '90px', render: r => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.raftCount}</span> },
            { key: 'utilization', label: 'Utilization', width: '200px', render: r => {
              if (!r.maxCapacity) {
                return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: colors.textDim }}>n/a</span>;
              }
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} title={`${r.usedCapacity} / ${r.maxCapacity} njësi`}>
                  <div style={{ width: 80, height: 4, background: colors.bg, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${r.utilization}%`, height: '100%', background: r.utilization > 70 ? colors.accent : colors.text }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: colors.textMuted }}>{r.utilization}%</span>
                </div>
              );
            } },
            { key: 'action', label: '', width: '48px', render: r => (
              <button
                onClick={e => toggleRowMenu(e, r)}
                title="Veprime"
                style={{ all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, cursor: 'pointer', color: colors.textMuted }}
                onMouseEnter={e => { e.currentTarget.style.background = colors.bg; e.currentTarget.style.color = colors.text; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.textMuted; }}
              >
                <MoreHorizontal size={15} />
              </button>
            ) },
          ]}
        />
      )}

      {/* Menu i veprimeve (Edit/Delete) — fixed që të mos klipohet nga tabela */}
      {rowMenu && (
        <>
          <div onClick={() => setRowMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
          <div style={{
            position: 'fixed', top: rowMenu.y + 4, left: rowMenu.x - 150, width: 150, zIndex: 1001,
            background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10,
            padding: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}>
            <MenuItem icon={<Pencil size={14} />} label="Edit" onClick={() => openEdit(warehouses.find(w => w.id === rowMenu.id))} />
            <MenuItem icon={<Trash2 size={14} />} label="Delete" danger onClick={() => { setDeleteTarget(warehouses.find(w => w.id === rowMenu.id)); setRowMenu(null); }} />
          </div>
        </>
      )}

      {/* Modal krijim/editim */}
      {modalMode && (
        <Modal title={modalMode === 'edit' ? 'Edit Warehouse' : 'New Warehouse'} onClose={() => setModalMode(null)}>
          <form onSubmit={handleSubmit}>
            <Field label="Name">
              <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Warehouse Prishtinë" />
            </Field>
            <Field label="Location">
              <input required style={inputStyle} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Prishtinë, Kosovë" />
            </Field>
            <Field label="Phone (optional)">
              <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+383..." />
            </Field>
            <Field label="Email (optional)">
              <input type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="depo@example.com" />
            </Field>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button type="button" onClick={() => setModalMode(null)} style={{ flex: 1, padding: '9px 0', border: `1px solid ${colors.border}`, borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', color: colors.text }}>
                Cancel
              </button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, background: colors.text, color: colors.surface, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : (modalMode === 'edit' ? 'Save' : 'Create')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Konfirmim fshirjeje */}
      {deleteTarget && (
        <Modal title="Delete Warehouse" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: colors.text, fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
            Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '9px 0', border: `1px solid ${colors.border}`, borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', color: colors.text }}>
              Cancel
            </button>
            <button onClick={confirmDelete} style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, background: colors.danger, color: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
              Delete
            </button>
          </div>
        </Modal>
      )}

      {/* Feedback toast */}
      {feedback && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1100,
          background: feedback.ok ? colors.text : colors.danger, color: colors.surface,
          padding: '12px 18px', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-sans)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxWidth: 360,
        }}>
          {feedback.msg}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset', display: 'flex', alignItems: 'center', gap: 8, width: '100%', boxSizing: 'border-box',
        padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)',
        color: danger ? colors.danger : colors.text,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? colors.dangerSoft : colors.bg)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {icon} {label}
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: colors.surface, borderRadius: 14, padding: 28, width: 460, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: colors.text, fontFamily: 'var(--font-sans)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: 4 }}>
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
      <label style={{ display: 'block', fontSize: 12, color: colors.textMuted, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 12px', border: `1px solid ${colors.border}`,
  borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-sans)',
  background: colors.bg, color: colors.text, outline: 'none', boxSizing: 'border-box',
};
