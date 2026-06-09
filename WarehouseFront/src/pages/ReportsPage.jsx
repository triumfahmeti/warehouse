import { useState, useEffect } from 'react';
import { Download, FileText, BarChart3, Truck } from 'lucide-react';
import { colors } from '../theme/colors';
import { reportsApi, warehousesApi } from '../api';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import StatusBadge from '../components/ui/StatusBadge';

const REPORT_TYPES = [
  { id: 'inventory', label: 'Inventory', icon: BarChart3, description: 'Stock levels, reserved and available quantities' },
  { id: 'sales-orders', label: 'Sales Orders', icon: FileText, description: 'Orders by status, client and total amount' },
  { id: 'shipments', label: 'Shipments', icon: Truck, description: 'Shipment history by warehouse and status' },
];

const STATUS_OPTIONS = {
  'inventory': [],
  'sales-orders': ['New', 'Confirmed', 'Processing', 'Completed', 'Cancelled'],
  'shipments': ['Draft', 'Ready', 'Shipped', 'Delivered', 'Cancelled'],
};

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('inventory');
  const [warehouses, setWarehouses] = useState([]);
  const [filter, setFilter] = useState({ from: '', to: '', status: '', warehouseId: '' });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    warehousesApi.getAll().then(setWarehouses).catch(() => {});
  }, []);

  useEffect(() => {
    setData([]);
    setGenerated(false);
    setError(null);
  }, [activeReport]);

  const buildFilter = (format = 'json') => ({
    from: filter.from || null,
    to: filter.to || null,
    status: filter.status || null,
    warehouseId: filter.warehouseId ? Number(filter.warehouseId) : null,
    format,
  });

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await reportsApi.generate(activeReport, buildFilter());
      setData(result);
      setGenerated(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const blob = await reportsApi.export(activeReport, buildFilter(format));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeReport}-report.${format === 'excel' ? 'xlsx' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = {
    'inventory': [
      { key: 'productName', label: 'Product', render: r => <div><div style={{ fontWeight: 500 }}>{r.productName}</div><div style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'var(--font-mono)' }}>{r.sku}</div></div> },
      { key: 'warehouseName', label: 'Warehouse' },
      { key: 'raftName', label: 'Raft', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.raftName}</span> },
      { key: 'totalQuantity', label: 'On Hand', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{r.totalQuantity}</span> },
      { key: 'reservedQuantity', label: 'Reserved', render: r => <span style={{ fontFamily: 'var(--font-mono)', color: colors.warning }}>{r.reservedQuantity}</span> },
      { key: 'availableQuantity', label: 'Available', render: r => <span style={{ fontFamily: 'var(--font-mono)', color: colors.success, fontWeight: 500 }}>{r.availableQuantity}</span> },
    ],
    'sales-orders': [
      { key: 'orderId', label: 'ID', render: r => <span style={{ fontFamily: 'var(--font-mono)', color: colors.textMuted }}>#{r.orderId}</span> },
      { key: 'clientName', label: 'Client', render: r => <span style={{ fontWeight: 500 }}>{r.clientName}</span> },
      { key: 'totalItems', label: 'Items', render: r => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.totalItems}</span> },
      { key: 'totalAmount', label: 'Total', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{Number(r.totalAmount).toFixed(2)} €</span> },
      { key: 'createdAt', label: 'Date', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: colors.textMuted }}>{new Date(r.createdAt).toLocaleDateString()}</span> },
      { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    ],
    'shipments': [
      { key: 'shipmentNumber', label: 'Number', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{r.shipmentNumber}</span> },
      { key: 'warehouseName', label: 'Warehouse' },
      { key: 'packingListNumber', label: 'Packing List', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.packingListNumber}</span> },
      { key: 'createdAt', label: 'Date', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: colors.textMuted }}>{new Date(r.createdAt).toLocaleDateString()}</span> },
      { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    ],
  };

  const inputStyle = {
    padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.border}`,
    background: colors.surface, color: colors.text, fontSize: 13,
    fontFamily: 'var(--font-sans)', outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div className="page-content">
      <PageHeader title="Reports" count={generated ? data.length : undefined} />

      {/* Report type selector */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {REPORT_TYPES.map(rt => {
          const Icon = rt.icon;
          const active = activeReport === rt.id;
          return (
            <button key={rt.id} onClick={() => setActiveReport(rt.id)} style={{
              flex: 1, padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${active ? colors.accent : colors.border}`,
              background: active ? colors.accentSoft : colors.surface,
              textAlign: 'left', transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Icon size={16} color={active ? colors.accent : colors.textMuted} />
                <span style={{ fontSize: 13, fontWeight: 600, color: active ? colors.accent : colors.text, fontFamily: 'var(--font-sans)' }}>
                  {rt.label}
                </span>
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'var(--font-sans)' }}>
                {rt.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          Filters
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: colors.textMuted, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>From</label>
            <input type="date" style={inputStyle} value={filter.from} onChange={e => setFilter(f => ({ ...f, from: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: colors.textMuted, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>To</label>
            <input type="date" style={inputStyle} value={filter.to} onChange={e => setFilter(f => ({ ...f, to: e.target.value }))} />
          </div>
          {STATUS_OPTIONS[activeReport].length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: 11, color: colors.textMuted, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Status</label>
              <select style={inputStyle} value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
                <option value="">All</option>
                {STATUS_OPTIONS[activeReport].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          {(activeReport === 'inventory' || activeReport === 'shipments') && (
            <div>
              <label style={{ display: 'block', fontSize: 11, color: colors.textMuted, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Warehouse</label>
              <select style={inputStyle} value={filter.warehouseId} onChange={e => setFilter(f => ({ ...f, warehouseId: e.target.value }))}>
                <option value="">All</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button onClick={() => handleExport('csv')} disabled={!generated} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
            border: `1px solid ${colors.border}`, background: 'none', cursor: generated ? 'pointer' : 'not-allowed',
            fontSize: 13, fontFamily: 'var(--font-sans)', color: generated ? colors.text : colors.textMuted,
            opacity: generated ? 1 : 0.5,
          }}>
            <Download size={14} /> CSV
          </button>
          <button onClick={() => handleExport('excel')} disabled={!generated} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
            border: `1px solid ${colors.border}`, background: 'none', cursor: generated ? 'pointer' : 'not-allowed',
            fontSize: 13, fontFamily: 'var(--font-sans)', color: generated ? colors.text : colors.textMuted,
            opacity: generated ? 1 : 0.5,
          }}>
            <Download size={14} /> Excel
          </button>
          <button onClick={handleGenerate} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8,
            border: 'none', background: colors.text, color: colors.surface,
            cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13,
            fontFamily: 'var(--font-sans)', fontWeight: 500, opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Results */}
      {error && (
        <div style={{ padding: 16, background: colors.dangerSoft, borderRadius: 8, color: colors.danger, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {generated && !loading && (
        data.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: colors.textMuted, fontSize: 13, fontFamily: 'var(--font-sans)' }}>
            No data found for the selected filters.
          </div>
        ) : (
          <Table rows={data} columns={columns[activeReport]} />
        )
      )}
    </div>
  );
}