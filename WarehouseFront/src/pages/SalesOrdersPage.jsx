import { Plus, MoreHorizontal } from 'lucide-react';
import { colors } from '../theme/colors';
import { mockData } from '../data/mockData';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import StatusBadge from '../components/ui/StatusBadge';
import { PrimaryButton } from '../components/ui/Button';

export default function SalesOrdersPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Sales Orders"
        count={mockData.salesOrders.length}
        action={<PrimaryButton icon={Plus}>New Order</PrimaryButton>}
      />
      <Table
        rows={mockData.salesOrders}
        columns={[
          { key: 'number', label: 'Number', width: '160px', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{r.number}</span> },
          { key: 'clientName', label: 'Client' },
          { key: 'items', label: 'Items', width: '80px', render: r => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.items}</span> },
          { key: 'total', label: 'Total', width: '120px', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>€{r.total.toFixed(2)}</span> },
          { key: 'date', label: 'Date', width: '120px', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: colors.textMuted }}>{r.date}</span> },
          { key: 'status', label: 'Status', width: '140px', render: r => <StatusBadge status={r.status} /> },
          { key: 'action', label: '', width: '40px', render: () => <MoreHorizontal size={15} color={colors.textMuted} /> },
        ]}
      />
    </div>
  );
}
