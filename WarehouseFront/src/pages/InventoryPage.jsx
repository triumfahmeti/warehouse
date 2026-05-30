import { Plus, MoreHorizontal } from 'lucide-react';
import { colors } from '../theme/colors';
import { mockData } from '../data/mockData';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import { PrimaryButton } from '../components/ui/Button';

export default function InventoryPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Inventory"
        count={mockData.inventory.length}
        action={<PrimaryButton icon={Plus}>Add Stock</PrimaryButton>}
      />
      <Table
        rows={mockData.inventory}
        columns={[
          { key: 'productName', label: 'Product', render: r => <span style={{ fontWeight: 500 }}>{r.productName}</span> },
          { key: 'raftName', label: 'Raft', width: '120px' },
          { key: 'quantity', label: 'On Hand', width: '110px', render: r => (
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{r.quantity}</span>
          ) },
          { key: 'reserved', label: 'Reserved', width: '110px', render: r => (
            <span style={{ fontFamily: 'var(--font-mono)', color: colors.warning }}>{r.reserved}</span>
          ) },
          { key: 'available', label: 'Available', width: '110px', render: r => (
            <span style={{ fontFamily: 'var(--font-mono)', color: colors.success, fontWeight: 500 }}>{r.available}</span>
          ) },
          { key: 'action', label: '', width: '40px', render: () => <MoreHorizontal size={15} color={colors.textMuted} /> },
        ]}
      />
    </div>
  );
}
