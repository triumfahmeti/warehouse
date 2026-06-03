import { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, X, Pencil, Trash2, Search } from 'lucide-react';
import { colors } from '../theme/colors';
import { raftsApi, warehousesApi } from '../api';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import { PrimaryButton } from '../components/ui/Button';

const emptyForm = { raftNumber: '', warehouseId: '', maxCapacity: '' };

export default function RaftsPage() {
  const [rafts, setRafts] = useState([]);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
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
  const [sortBy, setSortBy] = useState(''); // '' | cap-desc | cap-asc | num-asc | num-desc

  const showFeedback = (msg, ok = true) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await raftsApi.getAll();
      setRafts(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Opsionet e depove për dropdown-in e formës.
    warehousesApi.getAll().then(setWarehouseOptions).catch(() => setWarehouseOptions([]));
  }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModalMode('create'); };
  const openEdit = (r) => {
    setForm({ raftNumber: r.raftNumber || '', warehouseId: String(r.warehouseId ?? ''), maxCapacity: String(r.maxCapacity ?? '') });
    setEditId(r.id);
    setModalMode('edit');
    setRowMenu(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dto = {
        raftNumber: form.raftNumber,
        warehouseId: Number(form.warehouseId),
        maxCapacity: Number(form.maxCapacity),
      };
      if (modalMode === 'edit') {
        await raftsApi.update(editId, dto);
        showFeedback('Raft updated successfully.');
      } else {
        await raftsApi.create(dto);
        showFeedback('Raft created successfully.');
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
      await raftsApi.remove(target.id);
      await load();
      showFeedback('Raft deleted.');
    } catch (err) {
      showFeedback(err.message, false);
    }
  };

  const toggleRowMenu = (e, r) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setRowMenu(prev => prev?.id === r.id ? null : { id: r.id, x: rect.right, y: rect.bottom });
  };

  const toggleFilter = () => {
    setShowFilter(v => {
      if (v) { setQuery(''); setSortBy(''); }
      return !v;
    });
  };

  // Filtrim sipas numrit të raftit ose emrit të depos.
  const q = query.trim().toLowerCase();
  const filtered = q
    ? rafts.filter(r => (r.raftNumber || '').toLowerCase().includes(q) || (r.warehouseName || '').toLowerCase().includes(q))
    : rafts;

  // Renditje sipas kapacitetit ose numrit të raftit.
  const sorted = [...filtered];
  const comparators = {
    'cap-desc': (a, b) => b.maxCapacity - a.maxCapacity,
    'cap-asc': (a, b) => a.maxCapacity - b.maxCapacity,
    'items-desc': (a, b) => b.usedCapacity - a.usedCapacity,
    'items-asc': (a, b) => a.usedCapacity - b.usedCapacity,
    'num-asc': (a, b) => (a.raftNumber || '').localeCompare(b.raftNumber || ''),
    'num-desc': (a, b) => (b.raftNumber || '').localeCompare(a.raftNumber || ''),
  };
  if (comparators[sortBy]) sorted.sort(comparators[sortBy]);

  return (
    <div className="page-content">
      <PageHeader
        title="Rafts"
        count={sorted.length}
        onFilter={toggleFilter}
        filterActive={showFilter}
        action={<PrimaryButton icon={Plus} onClick={openCreate}>New Raft</PrimaryButton>}
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
              placeholder="Search by raft number or warehouse..."
              style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">Sort by: Default</option>
            <option value="items-desc">Items (high → low)</option>
            <option value="items-asc">Items (low → high)</option>
            <option value="cap-desc">Max Capacity (high → low)</option>
            <option value="cap-asc">Max Capacity (low → high)</option>
            <option value="num-asc">Raft Number (A → Z)</option>
            <option value="num-desc">Raft Number (Z → A)</option>
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
            { key: 'raftNumber', label: 'Raft Number', render: r => <span style={{ fontWeight: 500 }}>{r.raftNumber}</span> },
            { key: 'warehouseName', label: 'Warehouse', render: r => <span>{r.warehouseName || '—'}</span> },
            { key: 'usedCapacity', label: 'Items', width: '160px', render: r => {
              const pct = r.maxCapacity > 0 ? Math.min(100, Math.round((r.usedCapacity / r.maxCapacity) * 100)) : 0;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} title={`${r.usedCapacity} / ${r.maxCapacity}`}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, minWidth: 26 }}>{r.usedCapacity}</span>
                  <div style={{ width: 60, height: 4, background: colors.bg, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct > 70 ? colors.accent : colors.text }} />
                  </div>
                </div>
              );
            } },
            { key: 'maxCapacity', label: 'Max Capacity', width: '120px', render: r => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.maxCapacity}</span> },
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

      {/* Menu i veprimeve (Edit/Delete) */}
      {rowMenu && (
        <>
          <div onClick={() => setRowMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
          <div style={{
            position: 'fixed', top: rowMenu.y + 4, left: rowMenu.x - 150, width: 150, zIndex: 1001,
            background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10,
            padding: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}>
            <MenuItem icon={<Pencil size={14} />} label="Edit" onClick={() => openEdit(rafts.find(r => r.id === rowMenu.id))} />
            <MenuItem icon={<Trash2 size={14} />} label="Delete" danger onClick={() => { setDeleteTarget(rafts.find(r => r.id === rowMenu.id)); setRowMenu(null); }} />
          </div>
        </>
      )}

      {/* Modal krijim/editim */}
      {modalMode && (
        <Modal title={modalMode === 'edit' ? 'Edit Raft' : 'New Raft'} onClose={() => setModalMode(null)}>
          <form onSubmit={handleSubmit}>
            <Field label="Raft Number">
              <input required style={inputStyle} value={form.raftNumber} onChange={e => setForm(f => ({ ...f, raftNumber: e.target.value }))} placeholder="A1" />
            </Field>
            <Field label="Warehouse">
              <select required style={inputStyle} value={form.warehouseId} onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))}>
                <option value="" disabled>Select warehouse...</option>
                {warehouseOptions.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </Field>
            <Field label="Max Capacity">
              <input required type="number" min="1" style={inputStyle} value={form.maxCapacity} onChange={e => setForm(f => ({ ...f, maxCapacity: e.target.value }))} placeholder="100" />
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
        <Modal title="Delete Raft" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: colors.text, fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
            Are you sure you want to delete raft <strong>{deleteTarget.raftNumber}</strong>? This action cannot be undone.
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
