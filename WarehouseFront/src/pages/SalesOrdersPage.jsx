import { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, X, Eye, Tag, CheckCircle, Ban, Trash2, Search } from 'lucide-react';
import { exportToCsv } from '../utils/exportCsv';
import { colors } from '../theme/colors';
import { salesOrdersApi, productsApi } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useLiveResource } from '../realtime/useLiveResource';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import StatusBadge from '../components/ui/StatusBadge';
import { PrimaryButton } from '../components/ui/Button';
import { settingsApi } from '../api';

const emptyLine = () => ({ productId: '', quantity: '' });

export default function SalesOrdersPage() {
  const { hasPermission } = useAuth();
  // Gat-im sipas lejeve reale (jo rolit).
  const canViewAll = hasPermission('SalesOrders.View');   // sheh të gjitha vs. vetëm të vetat
  const canCreate = hasPermission('SalesOrders.Create');
  const canSetPrices = hasPermission('SalesOrders.SetPrices');
  const canConfirm = hasPermission('SalesOrders.Confirm');
  const canCancel = hasPermission('SalesOrders.Cancel');
  const [currency, setCurrency] = useState('€');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [rowMenu, setRowMenu] = useState(null);
const money = v => `${Number(v || 0).toFixed(2)} ${currency}`;

  // Client create
  const [createOpen, setCreateOpen] = useState(false);
  const [lines, setLines] = useState([emptyLine()]);
  const [saving, setSaving] = useState(false);

  // Manager set prices
  const [priceOrder, setPriceOrder] = useState(null);
  const [prices, setPrices] = useState({});

  const [viewOrder, setViewOrder] = useState(null);

  // Filter
  const [showFilter, setShowFilter] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('');

  const showFeedback = (msg, ok = true) => { setFeedback({ msg, ok }); setTimeout(() => setFeedback(null), 3500); };

  // silent=true: rifreskim në sfond (poll/focus) pa flash "Loading...".
  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = canViewAll ? await salesOrdersApi.getAll() : await salesOrdersApi.getMine();
      setOrders(data);
      setError(null);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Produktet i ngarkojmë veçmas (klienti i zgjedh kur krijon porosi).
  const loadProducts = () => { if (canCreate) productsApi.getAll().then(setProducts).catch(() => {}); };

  useEffect(() => {
  load();
  loadProducts();
  settingsApi.getAll()
    .then(data => {
      const c = data.find(s => s.key === 'currency');
      if (c?.value) setCurrency(c.value);
    })
    .catch(() => {});

  const onFocus = () => load(true);
  window.addEventListener('focus', onFocus);
  const interval = setInterval(() => load(true), 15000);
  return () => { window.removeEventListener('focus', onFocus); clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // Rifreskim live (SignalR) + refetch në focus, pa poll periodik. 'products'
  // këtu zgjidh rastin kryesor: stoku/availability ndryshon nga PO-të e manager-it,
  // dhe lista te modali "New Order" përditësohet pa refresh manual.
  useLiveResource(['salesorders', 'products'], () => { load(true); loadProducts(); });

  // ---- Client: create ----
  const openCreate = () => { setLines([emptyLine()]); loadProducts(); setCreateOpen(true); };
  const setLine = (i, patch) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  const addLine = () => setLines(ls => [...ls, emptyLine()]);
  const removeLine = i => setLines(ls => ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const items = lines.map(l => ({ productId: Number(l.productId), quantity: Number(l.quantity) }));
      await salesOrdersApi.create(items);
      setCreateOpen(false);
      await load();
      showFeedback('Order created. A manager will set the prices.');
    } catch (err) { showFeedback(err.message, false); } finally { setSaving(false); }
  };

  // ---- Manager: set prices ----
  const openPrices = (o) => {
    setPriceOrder(o);
    const init = {};
    o.items.forEach(it => { init[it.id] = it.unitPrice ?? ''; });
    setPrices(init);
    setRowMenu(null);
  };
  const handleSetPrices = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const items = priceOrder.items.map(it => ({ salesOrderItemId: it.id, unitPrice: Number(prices[it.id]) }));
      await salesOrdersApi.setPrices(priceOrder.id, items);
      setPriceOrder(null);
      await load();
      showFeedback('Prices set. The client can now confirm.');
    } catch (err) { showFeedback(err.message, false); } finally { setSaving(false); }
  };

  // ---- Client: confirm ----
  const doConfirm = async (o) => {
    setRowMenu(null);
    try {
      await salesOrdersApi.confirm(o.id);
      await load();
      showFeedback('Order confirmed. Stock reserved.');
    } catch (err) { showFeedback(err.message, false); }
  };

  // ---- Cancel (manager: çdo; client: të vetën) → liron stokun ----
  const doCancel = async (o) => {
    setRowMenu(null);
    try {
      await salesOrdersApi.cancel(o.id);
      await load();
      showFeedback('Order cancelled.');
    } catch (err) { showFeedback(err.message, false); }
  };

  const toggleRowMenu = (e, o) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setRowMenu(prev => prev?.order?.id === o.id ? null : { order: o, x: rect.right, y: rect.bottom });
  };

  const menuActions = (o) => {
    const acts = [{ label: 'View details', icon: <Eye size={14} />, onClick: () => { setViewOrder(o); setRowMenu(null); } }];
    if (canSetPrices && o.status === 'New') {
      acts.push({ label: o.isPriced ? 'Edit prices' : 'Set prices', icon: <Tag size={14} />, onClick: () => openPrices(o) });
    }
    if (canConfirm && o.status === 'New' && o.isPriced) {
      acts.push({ label: 'Confirm', icon: <CheckCircle size={14} />, onClick: () => doConfirm(o) });
    }
    // Anulim vetëm përpara konfirmimit (status New). Pas Confirm s'ka anulim.
    if (canCancel && o.status === 'New') {
      acts.push({ label: 'Cancel order', icon: <Ban size={14} />, danger: true, onClick: () => doCancel(o) });
    }
    return acts;
  };

  const priceTotal = priceOrder
    ? priceOrder.items.reduce((s, it) => s + (Number(prices[it.id]) || 0) * it.quantity, 0)
    : 0;

  const columns = [
    { key: 'id', label: 'ID', width: '60px', render: r => <span style={{ fontFamily: 'var(--font-mono)', color: colors.textMuted, fontSize: 12 }}>#{r.id}</span> },
    ...(canViewAll ? [{ key: 'clientName', label: 'Client', render: r => <span style={{ fontWeight: 500 }}>{r.clientName || '—'}</span> }] : []),
    { key: 'items', label: 'Items', width: '80px', render: r => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.items?.length || 0}</span> },
    { key: 'total', label: 'Total', width: canViewAll ? '130px' : undefined, render: r => r.isPriced
      ? <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{money(r.totalAmount)}</span>
      : <span style={{ fontSize: 12, color: colors.textDim, fontFamily: 'var(--font-mono)' }}>not priced</span> },
    { key: 'date', label: 'Date', width: '120px', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: colors.textMuted }}>{new Date(r.orderDate).toLocaleDateString('sq-AL')}</span> },
    { key: 'status', label: 'Status', width: '140px', render: r => <StatusBadge status={r.status} /> },
    { key: 'action', label: '', width: '48px', render: r => (
      <button onClick={e => toggleRowMenu(e, r)} title="Actions"
        style={{ all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, cursor: 'pointer', color: colors.textMuted }}
        onMouseEnter={e => { e.currentTarget.style.background = colors.bg; e.currentTarget.style.color = colors.text; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.textMuted; }}>
        <MoreHorizontal size={15} />
      </button>
    ) },
  ];

  const toggleFilter = () => setShowFilter(v => { if (v) { setQuery(''); setStatusFilter(''); setSortBy(''); } return !v; });

  // Filtrim (status + kërkim sipas id/klient/produkt) dhe renditje.
  const q = query.trim().toLowerCase();
  const displayed = (() => {
    let list = orders.filter(o => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (q
        && !String(o.id).includes(q)
        && !(o.clientName || '').toLowerCase().includes(q)
        && !(o.items || []).some(it => (it.productName || '').toLowerCase().includes(q))) return false;
      return true;
    });
    const comparators = {
      'date-desc': (a, b) => new Date(b.orderDate) - new Date(a.orderDate),
      'date-asc': (a, b) => new Date(a.orderDate) - new Date(b.orderDate),
      'total-desc': (a, b) => b.totalAmount - a.totalAmount,
      'total-asc': (a, b) => a.totalAmount - b.totalAmount,
    };
    if (comparators[sortBy]) list = [...list].sort(comparators[sortBy]);
    return list;
  })();

  const exportCsv = () => {
    const headers = ['ID', 'Client', 'Items', 'Total (€)', 'Date', 'Status'];
    const rows = displayed.map(o => [
      o.id,
      o.clientName || '',
      o.items?.length || 0,
      o.isPriced ? Number(o.totalAmount || 0).toFixed(2) : 'not priced',
      new Date(o.orderDate).toLocaleDateString('sq-AL'),
      o.status,
    ]);
    exportToCsv(headers, rows, 'sales-orders');
  };

  return (
    <div className="page-content">
      <PageHeader
        title="Sales Orders"
        count={displayed.length}
        onFilter={toggleFilter}
        filterActive={showFilter}
        onExport={exportCsv}
        action={canCreate ? <PrimaryButton icon={Plus} onClick={openCreate}>New Order</PrimaryButton> : undefined}
      />

      {showFilter && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 320 }}>
            <Search size={14} color={colors.textMuted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder={canViewAll ? 'Search by id, client or product...' : 'Search by id or product...'}
              style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', cursor: 'pointer' }}>
            <option value="">All statuses</option>
            <option value="New">New</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', cursor: 'pointer' }}>
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
        <>
          <Table rows={displayed} onRowClick={o => setViewOrder(o)} columns={columns} />
          {displayed.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: colors.textMuted, fontFamily: 'var(--font-sans)', fontSize: 13 }}>
              {query || statusFilter
                ? 'No orders match your filter.'
                : (canViewAll ? 'No sales orders yet.' : 'You have no orders yet.')}
            </div>
          )}
        </>
      )}

      {/* Row actions menu */}
      {rowMenu && (
        <>
          <div onClick={() => setRowMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
          <div style={{ position: 'fixed', top: rowMenu.y + 4, left: rowMenu.x - 160, width: 160, zIndex: 1001, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            {menuActions(rowMenu.order).map((a, i) => (
              <MenuItem key={i} icon={a.icon} label={a.label} danger={a.danger} onClick={a.onClick} />
            ))}
          </div>
        </>
      )}

      {/* Client: create order (no prices) */}
      {createOpen && (
        <Modal title="New Order" wide onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate}>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: colors.textMuted, fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
              Choose products and quantities. A manager will set the prices, then you can confirm the order.
            </p>
            <label style={labelStyle}>Items</label>
            {lines.map((l, i) => {
              const sel = products.find(p => p.id === Number(l.productId));
              const maxQty = sel ? (sel.availableToOrder ?? 0) : undefined;
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <select required style={inputStyle} value={l.productId} onChange={e => setLine(i, { productId: e.target.value })}>
                    <option value="" disabled>Product...</option>
                    {products.map(p => {
                      const avail = p.availableToOrder ?? 0;
                      return <option key={p.id} value={p.id} disabled={avail <= 0}>{p.name} ({avail} available)</option>;
                    })}
                  </select>
                  <input required type="number" min="1" max={maxQty} placeholder="Qty" style={inputStyle} value={l.quantity} onChange={e => setLine(i, { quantity: e.target.value })} />
                  <button type="button" onClick={() => removeLine(i)} title="Remove" disabled={lines.length === 1}
                    style={{ all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, cursor: lines.length === 1 ? 'not-allowed' : 'pointer', color: colors.textMuted, opacity: lines.length === 1 ? 0.4 : 1 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={addLine} style={{ all: 'unset', display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 13, color: colors.text, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              <Plus size={14} /> Add item
            </button>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button type="button" onClick={() => setCreateOpen(false)} style={cancelBtn}>Cancel</button>
              <button type="submit" disabled={saving} style={submitBtn(saving)}>{saving ? 'Creating...' : 'Create order'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manager: set prices */}
      {priceOrder && (
        <Modal title={`Set prices — Order #${priceOrder.id}`} wide onClose={() => setPriceOrder(null)}>
          <form onSubmit={handleSetPrices}>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: colors.textMuted, fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
              Client: <strong>{priceOrder.clientName}</strong>. Set the unit price for each item.
            </p>
            {priceOrder.items.map(it => (
              <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '2fr 60px 1fr', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: colors.text, fontFamily: 'var(--font-sans)' }}>{it.productName || `#${it.productId}`}</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: colors.textMuted, textAlign: 'center' }}>× {it.quantity}</span>
                <input required type="number" min="0.01" step="0.01" placeholder="Unit €" style={inputStyle} value={prices[it.id]} onChange={e => setPrices(p => ({ ...p, [it.id]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${colors.border}`, fontSize: 14, fontWeight: 600, color: colors.text, fontFamily: 'var(--font-sans)' }}>
              <span>Total</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{money(priceTotal)}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setPriceOrder(null)} style={cancelBtn}>Cancel</button>
              <button type="submit" disabled={saving} style={submitBtn(saving)}>{saving ? 'Saving...' : 'Save prices'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* View details */}
      {viewOrder && (
        <Modal title={`Order #${viewOrder.id}`} onClose={() => setViewOrder(null)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: colors.textMuted, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Client</div>
              <div style={{ fontSize: 14, color: colors.text, fontFamily: 'var(--font-sans)' }}>{viewOrder.clientName || '—'}</div>
            </div>
            <StatusBadge status={viewOrder.status} />
          </div>
          <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
            {viewOrder.items.map((it, i) => (
              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderBottom: i < viewOrder.items.length - 1 ? `1px solid ${colors.border}` : 'none', fontSize: 13 }}>
                <span style={{ fontFamily: 'var(--font-sans)', color: colors.text }}>{it.productName || `#${it.productId}`}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: colors.textMuted }}>
                  {it.quantity} × {it.unitPrice != null ? money(it.unitPrice) : <span style={{ color: colors.textDim }}>—</span>}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: colors.text, fontFamily: 'var(--font-sans)' }}>
            <span>Total</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{viewOrder.isPriced ? money(viewOrder.totalAmount) : 'not priced'}</span>
          </div>
          <button onClick={() => setViewOrder(null)} style={{ ...submitBtn(false), width: '100%', marginTop: 20 }}>Close</button>
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

const labelStyle = { display: 'block', fontSize: 12, color: colors.textMuted, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 };
const inputStyle = {
  width: '100%', padding: '9px 12px', border: `1px solid ${colors.border}`,
  borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-sans)',
  background: colors.bg, color: colors.text, outline: 'none', boxSizing: 'border-box',
};
const cancelBtn = { flex: 1, padding: '9px 0', border: `1px solid ${colors.border}`, borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', color: colors.text };
const submitBtn = (saving) => ({ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, background: colors.text, color: colors.surface, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500, opacity: saving ? 0.6 : 1 });
