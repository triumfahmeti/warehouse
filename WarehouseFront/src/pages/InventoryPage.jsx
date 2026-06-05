import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { colors } from '../theme/colors';
import { inventoryApi, importApi } from '../api';
import { useAuth } from '../auth/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import ImportButton from '../components/ui/ImportButton';

export default function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = (user?.roles || []).includes('Admin');
  const [inventory, setInventory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const showFeedback = (msg, ok = true) => { setFeedback({ msg, ok }); setTimeout(() => setFeedback(null), 3000); };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showFilter, setShowFilter] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await inventoryApi.getAll();
        setInventory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleFilter = () => setShowFilter(v => { if (v) { setQuery(''); setSortBy(''); } return !v; });

  const exportCsv = () => {
    const headers = ['Product', 'SKU', 'Raft', 'Warehouse', 'OnHand', 'Reserved', 'Available'];
    const rows = sorted.map(r => [r.productName, r.sku, r.raftNumber, r.warehouseName, r.quantityOnHand, r.reservedQuantity, r.availableQuantity]);
    const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter(r =>
      (r.productName || '').toLowerCase().includes(q) ||
      (r.sku || '').toLowerCase().includes(q) ||
      (r.raftNumber || '').toLowerCase().includes(q) ||
      (r.warehouseName || '').toLowerCase().includes(q));
  }, [query, inventory]);

  const sorted = [...filtered];
  const comparators = {
    'onhand-desc': (a, b) => b.quantityOnHand - a.quantityOnHand,
    'onhand-asc': (a, b) => a.quantityOnHand - b.quantityOnHand,
    'available-desc': (a, b) => b.availableQuantity - a.availableQuantity,
    'available-asc': (a, b) => a.availableQuantity - b.availableQuantity,
    'product-asc': (a, b) => (a.productName || '').localeCompare(b.productName || ''),
  };
  if (comparators[sortBy]) sorted.sort(comparators[sortBy]);

  return (
    <div className="page-content">
      <PageHeader
        title="Inventory"
        count={sorted.length}
        onFilter={toggleFilter}
        filterActive={showFilter}
        onExport={exportCsv}
        action={isAdmin && (
          <ImportButton
            onImport={async (file) => {
              const res = await importApi.inventory(file);
              const msg = res?.errors?.length
                ? `Imported: ${res.successCount}, skipped: ${res.skippedCount}. Errors: ${res.errors.map(e => `Row ${e.row}: ${e.message}`).join('; ')}`
                : `Imported: ${res?.successCount ?? 0} records, skipped: ${res?.skippedCount ?? 0}`;
              showFeedback(msg, !res?.errors?.length);
            }}
          />
        )}
      />
      {feedback && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1100, background: feedback.ok ? colors.text : colors.danger, color: colors.surface, padding: '12px 18px', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-sans)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
          {feedback.msg}
        </div>
      )}

      {showFilter && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 320 }}>
            <Search size={14} color={colors.textMuted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by product, SKU, raft or warehouse..."
              style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', cursor: 'pointer' }}>
            <option value="">Sort by: Default</option>
            <option value="onhand-desc">On Hand (high → low)</option>
            <option value="onhand-asc">On Hand (low → high)</option>
            <option value="available-desc">Available (high → low)</option>
            <option value="available-asc">Available (low → high)</option>
            <option value="product-asc">Product (A → Z)</option>
          </select>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: colors.textMuted, fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading...</div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', color: colors.danger, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{error}</div>
      ) : (
        <>
          <Table
            rows={sorted}
            columns={[
              { key: 'product', label: 'Product', render: r => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 500 }}>{r.productName}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: colors.textMuted }}>{r.sku}</span>
                </div>
              ) },
              { key: 'raftNumber', label: 'Raft', width: '110px', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.raftNumber}</span> },
              { key: 'warehouseName', label: 'Warehouse', render: r => <span style={{ fontSize: 12, color: colors.textMuted }}>{r.warehouseName || '—'}</span> },
              { key: 'onhand', label: 'On Hand', width: '100px', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{r.quantityOnHand}</span> },
              { key: 'reserved', label: 'Reserved', width: '100px', render: r => <span style={{ fontFamily: 'var(--font-mono)', color: r.reservedQuantity > 0 ? colors.warning : colors.textMuted }}>{r.reservedQuantity}</span> },
              { key: 'available', label: 'Available', width: '100px', render: r => <span style={{ fontFamily: 'var(--font-mono)', color: colors.success, fontWeight: 500 }}>{r.availableQuantity}</span> },
            ]}
          />
          {sorted.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: colors.textMuted, fontFamily: 'var(--font-sans)', fontSize: 13 }}>
              No inventory found{query ? ` for "${query}"` : ''}.
            </div>
          )}
        </>
      )}
    </div>
  );
}
