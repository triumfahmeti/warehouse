import { Plus, MoreHorizontal } from 'lucide-react';
import { colors } from '../theme/colors';
import { mockData } from '../data/mockData';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import { PrimaryButton } from '../components/ui/Button';

export default function RaftsPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Rafts"
        count={mockData.rafts.length}
        action={<PrimaryButton icon={Plus}>New Raft</PrimaryButton>}
      />
      <Table
        rows={mockData.rafts}
        columns={[
          { key: 'id', label: 'ID', width: '60px', render: r => <span style={{ fontFamily: 'var(--font-mono)', color: colors.textMuted, fontSize: 12 }}>#{r.id}</span> },
          { key: 'name', label: 'Name', render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
          { key: 'warehouseName', label: 'Warehouse' },
          { key: 'items', label: 'Items', width: '100px', render: r => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.items}</span> },
          { key: 'action', label: '', width: '40px', render: () => <MoreHorizontal size={15} color={colors.textMuted} /> },
        ]}
      />
    </div>
  );
}
