import { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, X, Search, Eye, Ban, Lock, PackageCheck, Trash2 } from 'lucide-react';
import { exportToCsv } from '../utils/exportCsv';
import { colors } from '../theme/colors';
import { purchaseOrdersApi, suppliersApi, productsApi, raftsApi } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useLiveResource } from '../realtime/useLiveResource';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import { PrimaryButton } from '../components/ui/Button';

const STATUS_COLORS = {
  Pending: { bg: colors.warningSoft, fg: colors.warning },
  Approved: { bg: colors.infoSoft, fg: colors.info },
  Received: { bg: colors.successSoft, fg: colors.success },
  Cancelled: { bg: colors.dangerSoft, fg: colors.danger },
  Closed: { bg: colors.bg, fg: colors.textMuted },
};

const money = v => `${Number(v || 0).toFixed(2)} €`;
const emptyLine = () => ({ productId: '', quantity: '', unitPrice: '' });

export default function PurchaseOrdersPage() {
  const { hasPermission } = useAuth();
  // Gat-im sipas lejeve reale.
  const canCreate = hasPermission('PurchaseOrders.Create');
  const canReceive = hasPermission('PurchaseOrders.Receive');
  const canCancel = hasPermission('PurchaseOrders.Cancel');
  const canClose = hasPermission('PurchaseOrders.Close');

  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [rafts, setRafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [lines, setLines] = useState([emptyLine()]);
  const [saving, setSaving] = useState(false);

  const [receivePo, setReceivePo] = useState(null);
  const [raftByItem, setRaftByItem] = useState({});
  const [viewPo, setViewPo] = useState(null);
  const [rowMenu, setRowMenu] = useState(null); // { po, x, y }
  const [feedback, setFeedback] = useState(null);

  const [showFilter, setShowFilter] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('');

  const showFeedback = (msg, ok = true) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3500);
  };

  // silent=true: rifreskim live në sfond pa flash "Loading...".
  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await purchaseOrdersApi.getAll();
      setOrders(data);
      setError(null);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Listat ndihmëse për modalet (supplier/product/raft).
  const loadAux = () => {
    suppliersApi.getAll().then(setSuppliers).catch(() => {});
    productsApi.getAll().then(setProducts).catch(() => {});
    raftsApi.getAll().then(setRafts).catch(() => {});
  };

  useEffect(() => {
    load();
    loadAux();
  }, []);

  // Rifreskim live: PO-të + listat ndihmëse që modali i krijimit/marrjes të jetë i freskët.
  useLiveResource(['purchaseorders', 'products', 'suppliers', 'rafts'], () => { load(true); loadAux(); });

  // ---- Create ----
  const openCreate = () => { setSupplierId(''); setExpectedDate(''); setLines([emptyLine()]); setCreateOpen(true); };
  const setLine = (i, patch) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  const addLine = () => setLines(ls => [...ls, emptyLine()]);
  const removeLine = i => setLines(ls => ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        supplierId: Number(supplierId),
        expectedDeliveryDate: expectedDate || null,
        items: lines.map(l => ({
          productId: Number(l.productId),
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
        })),
      };
      await purchaseOrdersApi.create(payload);
      setCreateOpen(false);
      await load();
      showFeedback('Purchase order created.');
    } catch (err) {
      showFeedback(err.message, false);
    } finally {
      setSaving(false);
    }
  };

  // ---- Status actions ----
  const doAction = async (fn, label) => {
    setRowMenu(null);
    try {
      await fn();
      await load();
      showFeedback(`Purchase order ${label}.`);
    } catch (err) {
      showFeedback(err.message, false);
    }
  };

  // ---- Receive ----
  const openReceive = (po) => { setReceivePo(po); setRaftByItem({}); setRowMenu(null); };
  const handleReceive = async (e) => {
    e.preventDefault();
    if (receivePo.items.some(it => !raftByItem[it.id])) {
      showFeedback('Select a raft for every item.', false);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        items: receivePo.items.map(it => ({
          purchaseOrderItemId: it.id,
          raftId: Number(raftByItem[it.id]),
          quantityReceived: it.quantity,
        })),
      };
      await purchaseOrdersApi.receive(receivePo.id, payload);
      setReceivePo(null);
      await load();
      raftsApi.getAll().then(setRafts).catch(() => {}); // rifresko kapacitetet
      showFeedback('Stock received and inventory updated.');
    } catch (err) {
      showFeedback(err.message, false);
    } finally {
      setSaving(false);
    }
  };

  const toggleRowMenu = (e, po) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setRowMenu(prev => prev?.po?.id === po.id ? null : { po, x: rect.right, y: rect.bottom });
  };

  const toggleFilter = () => setShowFilter(v => { if (v) { setQuery(''); setSortBy(''); } return !v; });

  // Filter + sort
  const q = query.trim().toLowerCase();
  const filtered = q
    ? orders.filter(o => (o.supplierName || '').toLowerCase().includes(q) || String(o.id).includes(q) || (o.status || '').toLowerCase().includes(q))
    : orders;
  const sorted = [...filtered];
  const comparators = {
    'date-desc': (a, b) => new Date(b.orderDate) - new Date(a.orderDate),
    'date-asc': (a, b) => new Date(a.orderDate) - new Date(b.orderDate),
    'total-desc': (a, b) => b.totalAmount - a.totalAmount,
    'total-asc': (a, b) => a.totalAmount - b.totalAmount,
  };
  if (comparators[sortBy]) sorted.sort(comparators[sortBy]);

  const menuActions = (po) => {
    const acts = [{ label: 'View details', icon: <Eye size={14} />, onClick: () => { setViewPo(po); setRowMenu(null); } }];
    if (po.status === 'Pending') {
      if (canReceive) acts.push({ label: 'Receive', icon: <PackageCheck size={14} />, onClick: () => openReceive(po) });
      if (canCancel) acts.push({ label: 'Cancel', icon: <Ban size={14} />, danger: true, onClick: () => doAction(() => purchaseOrdersApi.cancel(po.id), 'cancelled') });
    } else if (po.status === 'Received') {
      if (canClose) acts.push({ label: 'Close', icon: <Lock size={14} />, onClick: () => doAction(() => purchaseOrdersApi.close(po.id), 'closed') });
    }
    return acts;
  };

  const productName = id => products.find(p => p.id === id)?.name || `#${id}`;

  const exportCsv = () => {
    const headers = ['ID', 'Supplier', 'Items', 'Total (€)', 'Order Date', 'Expected Date', 'Status'];
    const rows = sorted.map(o => [
      o.id,
      o.supplierName || '',
      o.items?.length || 0,
      Number(o.totalAmount || 0).toFixed(2),
      new Date(o.orderDate).toLocaleDateString('sq-AL'),
      o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toLocaleDateString('sq-AL') : '',
      o.status,
    ]);
    exportToCsv(headers, rows, 'purchase-orders');
  };

  return (
    <div className="page-content">
      <PageHeader
        title="Purchase Orders"
        count={sorted.length}
        onFilter={toggleFilter}
        filterActive={showFilter}
        onExport={exportCsv}
        action={canCreate ? <PrimaryButton icon={Plus} onClick={openCreate}>New Purchase Order</PrimaryButton> : undefined}
      />

      {showFilter && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 320 }}>
            <Search size={14} color={colors.textMuted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by supplier, id or status..."
              style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
            <option value="">Sort by: Default</option>
            <option value="date-desc">Date (newest)</option>
            <option value="date-asc">Date (oldest)</option>
            <option value="total-desc">Total (high → low)</option>
            <option value="total-asc">Total (low → high)</option>
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
          onRowClick={po => setViewPo(po)}
          columns={[
            { key: 'id', label: 'ID', width: '60px', render: r => <span style={{ fontFamily: 'var(--font-mono)', color: colors.textMuted, fontSize: 12 }}>#{r.id}</span> },
            { key: 'supplierName', label: 'Supplier', render: r => <span style={{ fontWeight: 500 }}>{r.supplierName || '—'}</span> },
            { key: 'items', label: 'Items', width: '80px', render: r => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.items?.length || 0}</span> },
            { key: 'total', label: 'Total', width: '120px', render: r => <span style={{ fontFamily: 'var(--font-mono)' }}>{money(r.totalAmount)}</span> },
            { key: 'status', label: 'Status', width: '120px', render: r => <StatusBadge status={r.status} /> },
            { key: 'date', label: 'Date', width: '120px', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: colors.textMuted }}>{new Date(r.orderDate).toLocaleDateString('sq-AL')}</span> },
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
          <div style={{ position: 'fixed', top: rowMenu.y + 4, left: rowMenu.x - 170, width: 170, zIndex: 1001, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            {menuActions(rowMenu.po).map((a, i) => (
              <MenuItem key={i} icon={a.icon} label={a.label} danger={a.danger} onClick={a.onClick} />
            ))}
          </div>
        </>
      )}

      {/* Create modal */}
      {createOpen && (
        <Modal title="New Purchase Order" wide onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate}>
            <Field label="Supplier">
              <select required style={inputStyle} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                <option value="" disabled>Select supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Expected Delivery Date">
              <input required type="date" style={inputStyle} value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
            </Field>

            <label style={labelStyle}>Items</label>
            {lines.map((l, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <select required style={inputStyle} value={l.productId} onChange={e => setLine(i, { productId: e.target.value })}>
                  <option value="" disabled>Product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input required type="number" min="1" placeholder="Qty" style={inputStyle} value={l.quantity} onChange={e => setLine(i, { quantity: e.target.value })} />
                <input required type="number" min="0.01" step="0.01" placeholder="Unit €" style={inputStyle} value={l.unitPrice} onChange={e => setLine(i, { unitPrice: e.target.value })} />
                <button type="button" onClick={() => removeLine(i)} title="Remove" disabled={lines.length === 1}
                  style={{ all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, cursor: lines.length === 1 ? 'not-allowed' : 'pointer', color: colors.textMuted, opacity: lines.length === 1 ? 0.4 : 1 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addLine} style={{ all: 'unset', display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 13, color: colors.text, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              <Plus size={14} /> Add item
            </button>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button type="button" onClick={() => setCreateOpen(false)} style={cancelBtn}>Cancel</button>
              <button type="submit" disabled={saving} style={submitBtn(saving)}>{saving ? 'Creating...' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Receive modal */}
      {receivePo && (
        <Modal title={`Receive PO #${receivePo.id}`} wide onClose={() => setReceivePo(null)}>
          <form onSubmit={handleReceive}>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: colors.textMuted, fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
              Choose a raft for each item. Stock will be added to inventory and the order marked as <strong>Received</strong>.
            </p>
            {receivePo.items.map(it => (
              <div key={it.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: colors.text, fontFamily: 'var(--font-sans)' }}>{it.productName || productName(it.productId)}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: colors.textMuted }}>qty: {it.quantity}</span>
                </div>
                <select required style={inputStyle} value={raftByItem[it.id] || ''} onChange={e => setRaftByItem(m => ({ ...m, [it.id]: e.target.value }))}>
                  <option value="" disabled>Select raft...</option>
                  {rafts.map(r => {
                    const free = (r.maxCapacity || 0) - (r.usedCapacity || 0);
                    return <option key={r.id} value={r.id} disabled={free < it.quantity}>
                      {r.raftNumber} — {r.warehouseName} ({free} free){free < it.quantity ? ' — not enough' : ''}
                    </option>;
                  })}
                </select>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setReceivePo(null)} style={cancelBtn}>Cancel</button>
              <button type="submit" disabled={saving} style={submitBtn(saving)}>{saving ? 'Receiving...' : 'Receive'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* View modal */}
      {viewPo && (
        <Modal title={`Purchase Order #${viewPo.id}`} onClose={() => setViewPo(null)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: colors.textMuted, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Supplier</div>
              <div style={{ fontSize: 14, color: colors.text, fontFamily: 'var(--font-sans)' }}>{viewPo.supplierName || '—'}</div>
            </div>
            <StatusBadge status={viewPo.status} />
          </div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 14, fontSize: 12, color: colors.textMuted, fontFamily: 'var(--font-mono)' }}>
            <span>Ordered: {new Date(viewPo.orderDate).toLocaleDateString('sq-AL')}</span>
            <span>Expected: {viewPo.expectedDeliveryDate ? new Date(viewPo.expectedDeliveryDate).toLocaleDateString('sq-AL') : '—'}</span>
          </div>
          <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
            {viewPo.items.map((it, i) => (
              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderBottom: i < viewPo.items.length - 1 ? `1px solid ${colors.border}` : 'none', fontSize: 13 }}>
                <span style={{ fontFamily: 'var(--font-sans)', color: colors.text }}>{it.productName || productName(it.productId)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: colors.textMuted }}>{it.quantity} × {money(it.unitPrice)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: colors.text, fontFamily: 'var(--font-sans)' }}>
            <span>Total</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{money(viewPo.totalAmount)}</span>
          </div>
          <button onClick={() => setViewPo(null)} style={{ ...submitBtn(false), width: '100%', marginTop: 20 }}>Close</button>
        </Modal>
      )}

      {/* Feedback toast */}
      {feedback && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1100, background: feedback.ok ? colors.text : colors.danger, color: colors.surface, padding: '12px 18px', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-sans)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxWidth: 380 }}>
          {feedback.msg}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { bg: colors.bg, fg: colors.textMuted };
  return <span style={{ background: c.bg, color: c.fg, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{status}</span>;
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

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: colors.surface, borderRadius: 14, padding: 28, width: wide ? 560 : 460, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
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
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, color: colors.textMuted, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 };

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
