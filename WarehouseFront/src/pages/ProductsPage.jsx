import { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, X, Pencil, Trash2, Search, Eye } from 'lucide-react';
import { colors } from '../theme/colors';
import { productsApi } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useLiveResource } from '../realtime/useLiveResource';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import { PrimaryButton } from '../components/ui/Button';
import { exportToCsv } from '../utils/exportCsv';
import ImportButton from '../components/ui/ImportButton';
import { importApi } from '../api';

// Duhet të përputhen me enum-in ProductType në backend.
const PRODUCT_TYPES = ['Laptop', 'TV', 'PC', 'Monitor', 'Accessories', 'Phone', 'Tablet'];

const emptyForm = { name: '', sku: '', type: '', description: '', length: '', width: '', height: '', weight: '' };

export default function ProductsPage() {
  const { user } = useAuth();
  const canManage = (user?.roles || []).some(r => r === 'Admin' || r === 'Manager');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalMode, setModalMode] = useState(null); // null | 'create' | 'edit'
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rowMenu, setRowMenu] = useState(null);
  const [detail, setDetail] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [showFilter, setShowFilter] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState(''); // '' | name-asc | name-desc | weight-desc | weight-asc

  const showFeedback = (msg, ok = true) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3000);
  };

  // silent=true: rifreskim live në sfond pa flash "Loading...".
  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await productsApi.getAll();
      setProducts(data);
      setError(null);
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useLiveResource('products', () => load(true));

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModalMode('create'); };
  const openEdit = (p) => {
    setForm({
      name: p.name || '', sku: p.sku || '', type: p.type || '', description: p.description || '',
      length: String(p.length ?? ''), width: String(p.width ?? ''), height: String(p.height ?? ''), weight: String(p.weight ?? ''),
    });
    setEditId(p.id);
    setModalMode('edit');
    setRowMenu(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dto = {
        name: form.name,
        sku: form.sku,
        type: form.type,
        description: form.description || '',
        length: Number(form.length) || 0,
        width: Number(form.width) || 0,
        height: Number(form.height) || 0,
        weight: Number(form.weight) || 0,
      };
      if (modalMode === 'edit') {
        await productsApi.update(editId, dto);
        showFeedback('Product updated successfully.');
      } else {
        await productsApi.create(dto);
        showFeedback('Product created successfully.');
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
      await productsApi.remove(target.id);
      await load();
      showFeedback('Product deleted.');
    } catch (err) {
      showFeedback(err.message, false);
    }
  };

  const toggleRowMenu = (e, p) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setRowMenu(prev => prev?.id === p.id ? null : { id: p.id, x: rect.right, y: rect.bottom });
  };

  const toggleFilter = () => {
    setShowFilter(v => {
      if (v) { setQuery(''); setSortBy(''); }
      return !v;
    });
  };

  // Filtrim sipas emrit, SKU-së ose tipit.
  const q = query.trim().toLowerCase();
  const filtered = q
    ? products.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.type || '').toLowerCase().includes(q))
    : products;

  // Renditje sipas emrit ose peshës.
  const sorted = [...filtered];
  const comparators = {
    'name-asc': (a, b) => (a.name || '').localeCompare(b.name || ''),
    'name-desc': (a, b) => (b.name || '').localeCompare(a.name || ''),
    'weight-desc': (a, b) => b.weight - a.weight,
    'weight-asc': (a, b) => a.weight - b.weight,
  };
  if (comparators[sortBy]) sorted.sort(comparators[sortBy]);

  const exportCsv = () => {
    const headers = ['SKU', 'Name', 'Type', 'Description', 'Length (cm)', 'Width (cm)', 'Height (cm)', 'Weight (kg)'];
    const rows = sorted.map(p => [p.sku, p.name, p.type, p.description || '', p.length, p.width, p.height, p.weight]);
    exportToCsv(headers, rows, 'products');
  };

  return (
    <div className="page-content">
      <PageHeader
        title="Products"
        count={sorted.length}
        onFilter={toggleFilter}
        filterActive={showFilter}
        onExport={exportCsv}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            {(user?.roles || []).includes('Admin') && (
              <ImportButton
                onImport={async (file) => {
                  const res = await importApi.products(file);
                  const msg = res?.errors?.length
                    ? `Imported: ${res.successCount}, skipped: ${res.skippedCount}. Errors: ${res.errors.map(e => `Row ${e.row}: ${e.message}`).join('; ')}`
                    : `Imported: ${res?.successCount ?? 0} products, skipped: ${res?.skippedCount ?? 0}`;
                  showFeedback(msg, !res?.errors?.length);
                  await load();
                }}
              />
            )}
            {canManage && <PrimaryButton icon={Plus} onClick={openCreate}>New Product</PrimaryButton>}
          </div>
        }
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
              placeholder="Search by name, SKU or type..."
              style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">Sort by: Default</option>
            <option value="name-asc">Name (A → Z)</option>
            <option value="name-desc">Name (Z → A)</option>
            <option value="weight-desc">Weight (high → low)</option>
            <option value="weight-asc">Weight (low → high)</option>
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
          onRowClick={p => setDetail(p)}
          columns={[
            { key: 'sku', label: 'SKU', width: '120px', render: r => <span style={{ fontFamily: 'var(--font-mono)', color: colors.text, fontWeight: 500 }}>{r.sku}</span> },
            { key: 'name', label: 'Name', render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
            { key: 'type', label: 'Type', width: '140px', render: r => (
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: colors.bg, color: colors.textMuted, fontFamily: 'var(--font-mono)' }}>{r.type}</span>
            ) },
            { key: 'dim', label: 'Dimensions', width: '160px', render: r => (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: colors.textMuted }}>
                {r.length}×{r.width}×{r.height} cm
              </span>
            ) },
            { key: 'weight', label: 'Weight', width: '100px', render: r => (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.weight} kg</span>
            ) },
            { key: 'stock', label: 'Stock', width: '90px', render: r => (
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: r.stock > 0 ? colors.success : colors.danger }}>{r.stock}</span>
            ) },
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
            <MenuItem icon={<Eye size={14} />} label="View details" onClick={() => { setDetail(products.find(p => p.id === rowMenu.id)); setRowMenu(null); }} />
            {canManage && (
              <>
                <MenuItem icon={<Pencil size={14} />} label="Edit" onClick={() => openEdit(products.find(p => p.id === rowMenu.id))} />
                <MenuItem icon={<Trash2 size={14} />} label="Delete" danger onClick={() => { setDeleteTarget(products.find(p => p.id === rowMenu.id)); setRowMenu(null); }} />
              </>
            )}
          </div>
        </>
      )}

      {/* Modal krijim/editim */}
      {modalMode && (
        <Modal title={modalMode === 'edit' ? 'Edit Product' : 'New Product'} onClose={() => setModalMode(null)}>
          <form onSubmit={handleSubmit}>
            <Field label="Name">
              <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dell XPS 15" />
            </Field>
            <Field label="SKU">
              <input required style={inputStyle} value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="DLL-XPS-15" />
            </Field>
            <Field label="Type">
              <select required style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="" disabled>Select type...</option>
                {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Description (optional)">
              <input style={inputStyle} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="Length (cm)">
                <input required type="number" step="0.001" min="0" style={inputStyle} value={form.length} onChange={e => setForm(f => ({ ...f, length: e.target.value }))} />
              </Field>
              <Field label="Width (cm)">
                <input required type="number" step="0.001" min="0" style={inputStyle} value={form.width} onChange={e => setForm(f => ({ ...f, width: e.target.value }))} />
              </Field>
              <Field label="Height (cm)">
                <input required type="number" step="0.001" min="0" style={inputStyle} value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} />
              </Field>
            </div>
            <Field label="Weight (kg)">
              <input required type="number" step="0.001" min="0" style={inputStyle} value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
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
        <Modal title="Delete Product" onClose={() => setDeleteTarget(null)}>
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

      {/* Modal detajesh (përfshin përshkrimin) */}
      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <DetailRow label="SKU" value={detail.sku} mono />
          <DetailRow label="Type" value={detail.type} />
          <DetailRow label="Description" value={detail.description?.trim() ? detail.description : '—'} />
          <DetailRow label="Dimensions" value={`${detail.length} × ${detail.width} × ${detail.height} cm`} mono />
          <DetailRow label="Weight" value={`${detail.weight} kg`} mono />
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button onClick={() => { const p = detail; setDetail(null); openEdit(p); }} style={{ flex: 1, padding: '9px 0', border: `1px solid ${colors.border}`, borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', color: colors.text }}>
              Edit
            </button>
            <button onClick={() => setDetail(null)} style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, background: colors.text, color: colors.surface, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
              Close
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

function DetailRow({ label, value, mono }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
      <div style={{ fontSize: 10, color: colors.textMuted, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: colors.text, fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', lineHeight: 1.5, wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: colors.surface, borderRadius: 14, padding: 28, width: 480, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
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
