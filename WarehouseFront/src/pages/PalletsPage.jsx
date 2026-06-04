import { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, X, Pencil, Trash2, Search, Eye } from 'lucide-react';
import { colors } from '../theme/colors';
import { palletsApi, salesOrdersApi, raftsApi } from '../api';
import { useAuth } from '../auth/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import { PrimaryButton } from '../components/ui/Button';
import { exportToCsv } from '../utils/exportCsv';

const PACKAGING_TYPES = ['EuroPallet', 'Box', 'Crate'];
const emptyForm = { palletCode: '', packingType: 'Standard' };

export default function PalletsPage() {
  const { user } = useAuth();
  const canManage = (user?.roles || []).some(r => r === 'Admin' || r === 'Manager');

  const [pallets, setPallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [modalMode, setModalMode] = useState(null); // null | 'create' | 'edit'
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rowMenu, setRowMenu] = useState(null);
  const [detail, setDetail] = useState(null);

  const [showFilter, setShowFilter] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('');

  // Modal "From Sales Order"
  const [orderModal, setOrderModal] = useState(false);
  const [salesOrders, setSalesOrders] = useState([]);
  const [rafts, setRafts] = useState([]);
  const [orderForm, setOrderForm] = useState({ salesOrderId: '', packagingType: 'EuroPallet', raftId: '' });

  const showFeedback = (msg, ok = true) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await palletsApi.getAll();
      setPallets(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModalMode('create'); };
  const openEdit = (p) => {
    setForm({ palletCode: p.palletCode || '', packingType: p.packingType || 'Standard' });
    setEditId(p.id);
    setModalMode('edit');
    setRowMenu(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === 'edit') {
        await palletsApi.update(editId, form);
        showFeedback('Pallet updated successfully.');
      } else {
        await palletsApi.create(form);
        showFeedback('Pallet created successfully.');
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
      await palletsApi.remove(target.id);
      await load();
      showFeedback('Pallet deleted.');
    } catch (err) {
      showFeedback(err.message, false);
    }
  };

  const openFromOrder = async () => {
    try {
      const [ordersData, raftsData] = await Promise.all([
        salesOrdersApi.getAll(),
        raftsApi.getAll(),
      ]);
      setSalesOrders(ordersData.filter(o => o.status === 'Confirmed'));
      setRafts(raftsData);
      setOrderForm({ salesOrderId: '', packagingType: 'EuroPallet', raftId: '' });
      setOrderModal(true);
    } catch {
      showFeedback('Could not load data.', false);
    }
  };

  const handleFromOrder = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await palletsApi.fromOrder({
        salesOrderId: Number(orderForm.salesOrderId),
        packagingType: orderForm.packagingType,
        raftId: Number(orderForm.raftId),
      });
      setOrderModal(false);
      await load();
      showFeedback('Pallet created from sales order.');
    } catch (err) {
      showFeedback(err.message, false);
    } finally {
      setSaving(false);
    }
  };

  const toggleRowMenu = (e, p) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setRowMenu(prev => prev?.id === p.id ? null : { id: p.id, x: rect.right, y: rect.bottom });
  };

  const toggleFilter = () => setShowFilter(v => { if (v) { setQuery(''); setSortBy(''); } return !v; });

  const q = query.trim().toLowerCase();
  const filtered = q
    ? pallets.filter(p =>
        (p.palletCode || '').toLowerCase().includes(q) ||
        (p.packingType || '').toLowerCase().includes(q))
    : pallets;

  const sorted = [...filtered];
  const comparators = {
    'code-asc':  (a, b) => (a.palletCode || '').localeCompare(b.palletCode || ''),
    'code-desc': (a, b) => (b.palletCode || '').localeCompare(a.palletCode || ''),
  };
  if (comparators[sortBy]) sorted.sort(comparators[sortBy]);

  const exportCsv = () => {
    const headers = ['ID', 'Pallet Code', 'Packaging Type'];
    const rows = sorted.map(p => [p.id, p.palletCode, p.packingType]);
    exportToCsv(headers, rows, 'pallets');
  };

  return (
    <div className="page-content">
      <PageHeader
        title="Pallets"
        count={sorted.length}
        onFilter={toggleFilter}
        filterActive={showFilter}
        onExport={exportCsv}
        action={canManage
          ? <PrimaryButton icon={Plus} onClick={openFromOrder}>From Sales Order</PrimaryButton>
          : undefined}
      />

      {showFilter && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 320 }}>
            <Search size={14} color={colors.textMuted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by code or type..."
              style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
            <option value="">Sort by: Default</option>
            <option value="code-asc">Code (A → Z)</option>
            <option value="code-desc">Code (Z → A)</option>
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
          onRowClick={p => setDetail(p)}
          columns={[
            { key: 'id', label: 'ID', width: '60px', render: r => <span style={{ fontFamily: 'var(--font-mono)', color: colors.textMuted, fontSize: 12 }}>#{r.id}</span> },
            { key: 'palletCode', label: 'Pallet Code', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{r.palletCode}</span> },
            { key: 'packingType', label: 'Packaging', width: '160px', render: r => (
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: colors.bg, color: colors.textMuted, fontFamily: 'var(--font-mono)' }}>
                {r.packingType}
              </span>
            )},
            { key: 'action', label: '', width: '48px', render: r => (
              <button
                onClick={e => toggleRowMenu(e, r)}
                style={{ all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, cursor: 'pointer', color: colors.textMuted }}
                onMouseEnter={e => { e.currentTarget.style.background = colors.bg; e.currentTarget.style.color = colors.text; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.textMuted; }}
              >
                <MoreHorizontal size={15} />
              </button>
            )},
          ]}
        />
      )}

      {/* Row menu */}
      {rowMenu && (
        <>
          <div onClick={() => setRowMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
          <div style={{ position: 'fixed', top: rowMenu.y + 4, left: rowMenu.x - 150, width: 150, zIndex: 1001, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            <MenuItem icon={<Eye size={14} />} label="View details" onClick={() => { setDetail(pallets.find(p => p.id === rowMenu.id)); setRowMenu(null); }} />
            {canManage && (
              <>
                <MenuItem icon={<Pencil size={14} />} label="Edit" onClick={() => openEdit(pallets.find(p => p.id === rowMenu.id))} />
                <MenuItem icon={<Trash2 size={14} />} label="Delete" danger onClick={() => { setDeleteTarget(pallets.find(p => p.id === rowMenu.id)); setRowMenu(null); }} />
              </>
            )}
          </div>
        </>
      )}

      {/* Create / Edit modal */}
      {modalMode && (
        <Modal title={modalMode === 'edit' ? 'Edit Pallet' : 'New Pallet'} onClose={() => setModalMode(null)}>
          <form onSubmit={handleSubmit}>
            <Field label="Pallet Code">
              <input required style={inputStyle} value={form.palletCode} onChange={e => setForm(f => ({ ...f, palletCode: e.target.value }))} placeholder="PAL-001" />
            </Field>
            <Field label="Packaging Type">
              <select required style={inputStyle} value={form.packingType} onChange={e => setForm(f => ({ ...f, packingType: e.target.value }))}>
                {PACKAGING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button type="button" onClick={() => setModalMode(null)} style={cancelBtn}>Cancel</button>
              <button type="submit" disabled={saving} style={submitBtn(saving)}>{saving ? 'Saving...' : (modalMode === 'edit' ? 'Save' : 'Create')}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* From Sales Order modal */}
      {orderModal && (
        <Modal title="Create Pallet from Sales Order" onClose={() => setOrderModal(false)}>
          <form onSubmit={handleFromOrder}>
            <Field label="Sales Order (Confirmed)">
              <select required style={inputStyle} value={orderForm.salesOrderId} onChange={e => setOrderForm(f => ({ ...f, salesOrderId: e.target.value }))}>
                <option value="" disabled>Select order...</option>
                {salesOrders.map(o => (
                  <option key={o.id} value={o.id}>#{o.id} — {o.clientName || 'Client'} ({o.status})</option>
                ))}
              </select>
            </Field>
            <Field label="Packaging Type">
              <select required style={inputStyle} value={orderForm.packagingType} onChange={e => setOrderForm(f => ({ ...f, packagingType: e.target.value }))}>
                {PACKAGING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Raft">
              <select required style={inputStyle} value={orderForm.raftId} onChange={e => setOrderForm(f => ({ ...f, raftId: e.target.value }))}>
                <option value="" disabled>Select raft...</option>
                {rafts.map(r => (
                  <option key={r.id} value={r.id}>{r.raftNumber} — {r.warehouseName || 'Warehouse'}</option>
                ))}
              </select>
            </Field>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button type="button" onClick={() => setOrderModal(false)} style={cancelBtn}>Cancel</button>
              <button type="submit" disabled={saving} style={submitBtn(saving)}>{saving ? 'Creating...' : 'Create Pallet'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <Modal title="Delete Pallet" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: colors.text, fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
            Are you sure you want to delete pallet <strong>{deleteTarget.palletCode}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setDeleteTarget(null)} style={cancelBtn}>Cancel</button>
            <button onClick={confirmDelete} style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, background: colors.danger, color: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Delete</button>
          </div>
        </Modal>
      )}

      {/* Detail modal */}
      {detail && (
        <Modal title={detail.palletCode} onClose={() => setDetail(null)}>
          <DetailRow label="ID" value={`#${detail.id}`} mono />
          <DetailRow label="Pallet Code" value={detail.palletCode} mono />
          <DetailRow label="Packaging Type" value={detail.packingType} />
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            {canManage && (
              <button onClick={() => { const p = detail; setDetail(null); openEdit(p); }} style={cancelBtn}>Edit</button>
            )}
            <button onClick={() => setDetail(null)} style={submitBtn(false)}>Close</button>
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

function DetailRow({ label, value, mono }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
      <div style={{ fontSize: 10, color: colors.textMuted, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: colors.text, fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '9px 12px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-sans)', background: colors.bg, color: colors.text, outline: 'none', boxSizing: 'border-box' };
const selectStyle = { padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', cursor: 'pointer' };
const cancelBtn = { flex: 1, padding: '9px 0', border: `1px solid ${colors.border}`, borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', color: colors.text };
const submitBtn = saving => ({ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, background: colors.text, color: colors.surface, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500, opacity: saving ? 0.6 : 1 });
