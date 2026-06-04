import { Plus, MoreHorizontal } from 'lucide-react';
import { colors } from '../theme/colors';
import { mockData } from '../data/mockData';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import { PrimaryButton } from '../components/ui/Button';
import { exportToCsv } from '../utils/exportCsv';

export default function PalletsPage() {
  const exportCsv = () => {
    const headers = ['Number', 'Packaging Type', 'Items', 'Weight (kg)', 'Sales Order'];
    const rows = mockData.pallets.map(p => [
      p.number, p.packagingType, p.items, p.weight,
      `SO-2026-${String(p.salesOrderId).padStart(4, '0')}`,
    ]);
    exportToCsv(headers, rows, 'pallets');
  };

  return (
    <div className="page-content">
      <PageHeader
        title="Pallets"
        count={mockData.pallets.length}
        onExport={exportCsv}
        action={<PrimaryButton icon={Plus}>From Sales Order</PrimaryButton>}
      />
      <Table
        rows={mockData.pallets}
        columns={[
          { key: 'number', label: 'Number', width: '140px', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{r.number}</span> },
          { key: 'packagingType', label: 'Packaging', width: '140px', render: r => (
            <span style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 999,
              background: colors.bg, color: colors.textMuted, fontFamily: 'var(--font-mono)',
            }}>{r.packagingType}</span>
          ) },
          { key: 'items', label: 'Items', width: '100px', render: r => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.items}</span> },
          { key: 'weight', label: 'Weight', width: '100px', render: r => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.weight} kg</span> },
          { key: 'salesOrderId', label: 'Sales Order', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>SO-2026-{String(r.salesOrderId).padStart(4, '0')}</span> },
          { key: 'action', label: '', width: '40px', render: () => <MoreHorizontal size={15} color={colors.textMuted} /> },
        ]}
      />
    </div>
  );
}
