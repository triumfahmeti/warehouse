import { Plus, MoreHorizontal } from 'lucide-react';
import { colors } from '../theme/colors';
import { mockData } from '../data/mockData';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import StatusBadge from '../components/ui/StatusBadge';
import { PrimaryButton } from '../components/ui/Button';
import { exportToCsv } from '../utils/exportCsv';

export default function PackingListsPage() {
  const exportCsv = () => {
    const headers = ['Number', 'Sales Order', 'Warehouse', 'Pallets', 'Date', 'Status'];
    const rows = mockData.packingLists.map(p => [p.number, p.salesOrderNumber, p.warehouseName, p.pallets, p.date, p.status]);
    exportToCsv(headers, rows, 'packing-lists');
  };

  return (
    <div className="page-content">
      <PageHeader
        title="Packing Lists"
        count={mockData.packingLists.length}
        onExport={exportCsv}
        action={<PrimaryButton icon={Plus}>New Packing List</PrimaryButton>}
      />
      <Table
        rows={mockData.packingLists}
        columns={[
          { key: 'number', label: 'Number', width: '160px', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{r.number}</span> },
          { key: 'salesOrderNumber', label: 'Sales Order', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.salesOrderNumber}</span> },
          { key: 'warehouseName', label: 'Warehouse' },
          { key: 'pallets', label: 'Pallets', width: '100px', render: r => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.pallets}</span> },
          { key: 'date', label: 'Date', width: '120px', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: colors.textMuted }}>{r.date}</span> },
          { key: 'status', label: 'Status', width: '140px', render: r => <StatusBadge status={r.status} /> },
          { key: 'action', label: '', width: '40px', render: () => <MoreHorizontal size={15} color={colors.textMuted} /> },
        ]}
      />
    </div>
  );
}
