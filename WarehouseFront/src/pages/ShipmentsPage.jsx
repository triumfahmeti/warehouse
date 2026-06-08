import { useEffect, useState } from 'react';
import { Plus, ChevronRight, X, Search } from 'lucide-react';
import { colors } from '../theme/colors';
import { shipmentsApi, packingListsApi } from '../api';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import StatusBadge from '../components/ui/StatusBadge';
import { PrimaryButton } from '../components/ui/Button';
import { Stat } from '../components/ui/Stat';
import ShipmentDetailPanel from '../components/shipments/ShipmentDetailPanel';
import { useAuth } from '../auth/AuthContext';
import { useLiveResource } from '../realtime/useLiveResource';
import { exportToCsv } from '../utils/exportCsv';


const emptyForm = { packingListId: '', notes: '' };

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [packingListOptions, setPackingListOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [showFilter, setShowFilter] = useState(false);
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const { user, hasPermission } = useAuth();
  const isClient = user?.roles?.includes('Client'); // vetëm për etiketa kozmetike te paneli
  // Gat-im sipas lejeve reale.
  const canViewAll = hasPermission('Shipments.View'); // sheh të gjitha vs. vetëm të vetat
  const canCreate = hasPermission('Shipments.Create');
  const canMarkReady = hasPermission('Shipments.MarkReady');
  const canShip = hasPermission('Shipments.Ship');
  const canDeliver = hasPermission('Shipments.Deliver');

  const showFeedback = (msg, ok = true) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3000);
  };

  // silent=true: rifreskim live në sfond pa flash "Loading...".
  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [shData, plData] = await Promise.all([
        canViewAll ? shipmentsApi.getAll() : shipmentsApi.getMine(),
        packingListsApi.getAvailable().catch(() => []),
      ]);
      setShipments(shData);
      // Ri-sinkronizo panelin e hapur me të dhënat e freskëta → status flow live
      // edhe kur ndryshimin e bën dikush tjetër (p.sh. klienti konfirmon marrjen).
      setSelected(prev => prev ? (shData.find(s => s.id === prev.id) ?? prev) : prev);
      setPackingListOptions(plData);
      setError(null);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAll]);

  // Rifreskim live për të gjitha rolet: kur ndryshon ndonjë shipment (ready/ship/
  // deliver/cancel) ose packing list, tabela përditësohet pa refresh manual.
  useLiveResource(['shipments', 'packinglists'], () => load(true));

  const count = status => shipments.filter(s => s.status === status).length;

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await shipmentsApi.create({
        packingListId: Number(form.packingListId),
        notes: form.notes || null,
      });
      showFeedback('Shipment created successfully.');
      setModalMode(null);
      await load();
    } catch (err) {
      showFeedback(err.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReady = async (id) => {
    try {
      await shipmentsApi.markReady(id);
      showFeedback('Marked as Ready.');
      await load();
      setSelected(s => s?.id === id ? { ...s, status: 'Ready' } : s);
    } catch (err) {
      showFeedback(err.message, false);
    }
  };

  const handleShip = async (id) => {
    try {
      await shipmentsApi.ship(id);
      showFeedback('Shipment shipped.');
      await load();
      setSelected(s => s?.id === id ? { ...s, status: 'Shipped' } : s);
    } catch (err) {
      showFeedback(err.message, false);
    }
  };

  const handleDeliver = async (id) => {
    try {
      await shipmentsApi.deliver(id);
      showFeedback('Shipment delivered.');
      await load();
      setSelected(s => s?.id === id ? { ...s, status: 'Delivered' } : s);
    } catch (err) {
      showFeedback(err.message, false);
    }
  };

  const toggleFilter = () => {
    setShowFilter(v => {
      if (v) { setQuery(''); setFilterStatus(''); }
      return !v;
    });
  };

  const q = query.trim().toLowerCase();
  const filtered = shipments.filter(s => {
    const matchesQuery = !q || (s.shipmentNumber || '').toLowerCase().includes(q) || (s.warehouseName || '').toLowerCase().includes(q);
    const matchesStatus = !filterStatus || s.status === filterStatus;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="page-content">
      {/* Stats */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 24, padding: 16,
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: 12,
      }}>
        <Stat label="Draft" value={count('Draft')} />
        <Stat label="Ready" value={count('Ready')} />
        <Stat label="Shipped" value={count('Shipped')} />
        <Stat label="Delivered" value={count('Delivered')} />
      </div>

      <PageHeader
        title="Shipments"
        count={filtered.length}
        onFilter={toggleFilter}
        filterActive={showFilter}
        onExport={() => {
          const headers = ['Number', 'Packing List', 'Warehouse', 'Date', 'Status'];
          const rows = filtered.map(s => [
            s.shipmentNumber,
            s.packingListNumber || '—',
            s.warehouseName || '—',
            s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—',
            s.status
          ]);
          exportToCsv(headers, rows, 'shipments');
        }}
        action={canCreate && (
          <PrimaryButton icon={Plus} onClick={() => { setForm(emptyForm); setModalMode('create'); }}>
            New Shipment
          </PrimaryButton>
        )}
      />

      {showFilter && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 320 }}>
            <Search size={14} color={colors.textMuted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by number or warehouse..."
              style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', cursor: 'pointer' }}>
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Ready">Ready</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 16, alignItems: 'start' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: colors.textMuted, fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading...</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: colors.danger, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{error}</div>
        ) : (
          <Table
            onRowClick={r => setSelected(prev => prev?.id === r.id ? null : r)}
            rows={filtered}
            columns={[
              { key: 'id', label: 'ID', width: '60px', render: r => <span style={{ fontFamily: 'var(--font-mono)', color: colors.textMuted, fontSize: 12 }}>#{r.id}</span> },
              { key: 'shipmentNumber', label: 'Number', width: '180px', render: r => (
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {selected?.id === r.id && <ChevronRight size={12} color={colors.accent} />}
                  {r.shipmentNumber}
                </span>
              )},
              { key: 'packingListNumber', label: 'Packing List', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.packingListNumber || '—'}</span> },
              { key: 'warehouseName', label: 'Warehouse', render: r => <span>{r.warehouseName || '—'}</span> },
              { key: 'createdAt', label: 'Date', width: '120px', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: colors.textMuted }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</span> },
              { key: 'status', label: 'Status', width: '140px', render: r => <StatusBadge status={r.status} /> },
            ]}
          />
        )}

      {selected && (
          <ShipmentDetailPanel
            shipment={selected}
            onClose={() => setSelected(null)}
            onMarkReady={canMarkReady ? () => handleMarkReady(selected.id) : undefined}
            onShip={canShip ? () => handleShip(selected.id) : undefined}
            onDeliver={canDeliver ? () => handleDeliver(selected.id) : undefined}
            readOnly={false}
            isClient={isClient}  // etiketë kozmetike ("Confirm Receipt" vs "Mark Delivered")
          />
        )}
      </div>

      {/* Modal krijim */}
      {modalMode && (
        <Modal title="New Shipment" onClose={() => setModalMode(null)}>
          <form onSubmit={handleCreate}>
            <Field label="Packing List">
              <select required style={inputStyle} value={form.packingListId} onChange={e => setForm(f => ({ ...f, packingListId: e.target.value }))}>
                <option value="" disabled>Select packing list...</option>
                {packingListOptions.filter(pl => pl.status === 'Ready').map(pl => (
                  <option key={pl.id} value={pl.id}>{pl.packingListNumber} — {pl.status}</option>
                ))}
              </select>
            </Field>
            <Field label="Notes (optional)">
              <input style={inputStyle} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes..." />
            </Field>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button type="button" onClick={() => setModalMode(null)} style={{ flex: 1, padding: '9px 0', border: `1px solid ${colors.border}`, borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', color: colors.text }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, background: colors.text, color: colors.surface, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {feedback && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1100, background: feedback.ok ? colors.text : colors.danger, color: colors.surface, padding: '12px 18px', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-sans)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxWidth: 360 }}>
          {feedback.msg}
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: colors.surface, borderRadius: 14, padding: 28, width: 460, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
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