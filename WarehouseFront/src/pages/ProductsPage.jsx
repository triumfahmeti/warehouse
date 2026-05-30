import { Plus, MoreHorizontal } from 'lucide-react';
import { colors } from '../theme/colors';
import { mockData } from '../data/mockData';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import { PrimaryButton } from '../components/ui/Button';

export default function ProductsPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Products"
        count={mockData.products.length}
        action={<PrimaryButton icon={Plus}>New Product</PrimaryButton>}
      />
      <Table
        rows={mockData.products}
        columns={[
          { key: 'sku', label: 'SKU', width: '120px', render: r => <span style={{ fontFamily: 'var(--font-mono)', color: colors.text, fontWeight: 500 }}>{r.sku}</span> },
          { key: 'name', label: 'Name' },
          { key: 'type', label: 'Type', width: '140px', render: r => (
            <span style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 999,
              background: colors.bg, color: colors.textMuted, fontFamily: 'var(--font-mono)',
            }}>{r.type}</span>
          ) },
          { key: 'dim', label: 'Dimensions', width: '160px', render: r => (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: colors.textMuted }}>
              {r.length}×{r.width}×{r.height} cm
            </span>
          ) },
          { key: 'weight', label: 'Weight', width: '100px', render: r => (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.weight} kg</span>
          ) },
          { key: 'action', label: '', width: '40px', render: () => <MoreHorizontal size={15} color={colors.textMuted} /> },
        ]}
      />
    </div>
  );
}
