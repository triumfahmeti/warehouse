import { Plus, MoreHorizontal } from 'lucide-react';
import { colors } from '../theme/colors';
import { mockData } from '../data/mockData';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import { PrimaryButton } from '../components/ui/Button';

export default function WarehousesPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Warehouses"
        count={mockData.warehouses.length}
        action={<PrimaryButton icon={Plus}>New Warehouse</PrimaryButton>}
      />
      <Table
        onRowClick={r => console.log(r)}
        rows={mockData.warehouses}
        columns={[
          { key: 'id', label: 'ID', width: '60px', render: r => <span style={{ fontFamily: 'var(--font-mono)', color: colors.textMuted, fontSize: 12 }}>#{r.id}</span> },
          { key: 'name', label: 'Name', render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
          { key: 'location', label: 'Location' },
          { key: 'rafts', label: 'Rafts', width: '100px', render: r => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.rafts}</span> },
          { key: 'utilization', label: 'Utilization', width: '180px', render: r => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 80, height: 4, background: colors.bg, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${r.utilization}%`, height: '100%', background: r.utilization > 70 ? colors.accent : colors.text }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: colors.textMuted }}>{r.utilization}%</span>
            </div>
          ) },
          { key: 'action', label: '', width: '40px', render: () => <MoreHorizontal size={15} color={colors.textMuted} /> },
        ]}
      />
    </div>
  );
}
