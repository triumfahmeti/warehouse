import { useState } from 'react';
import { Truck, Plus, ChevronRight } from 'lucide-react';
import { colors } from '../theme/colors';
import { mockData } from '../data/mockData';
import PageHeader from '../components/ui/PageHeader';
import Table from '../components/ui/Table';
import StatusBadge from '../components/ui/StatusBadge';
import { PrimaryButton } from '../components/ui/Button';
import { Stat } from '../components/ui/Stat';
import ShipmentDetailPanel from '../components/shipments/ShipmentDetailPanel';

export default function ShipmentsPage() {
  const [selected, setSelected] = useState(null);

  const count = status => mockData.shipments.filter(s => s.status === status).length;

  return (
    <div className="page-content">
      {/* Hero special për Shipment */}
      <div className="shipment-hero" style={{
        background: `linear-gradient(135deg, ${colors.accentSoft} 0%, ${colors.surface} 100%)`,
        border: `1px solid ${colors.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: colors.accent, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Truck size={20} />
          </div>
          <div>
            <div style={{
              fontSize: 11, color: colors.textMuted, fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>Era's Module</div>
            <div style={{
              fontSize: 18, fontWeight: 600, color: colors.text,
              fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em',
            }}>Shipment Management</div>
          </div>
        </div>
        <div className="shipment-stats">
          <Stat label="Draft" value={count('Draft')} />
          <Stat label="Ready" value={count('Ready')} />
          <Stat label="Shipped" value={count('Shipped')} />
          <Stat label="Delivered" value={count('Delivered')} />
        </div>
      </div>

      <PageHeader
        title="All Shipments"
        count={mockData.shipments.length}
        action={<PrimaryButton icon={Plus}>New Shipment</PrimaryButton>}
      />

      {/* Tabela + detail panel kur ka të selektuar */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 16 }}>
        <Table
          onRowClick={r => setSelected(r)}
          rows={mockData.shipments}
          columns={[
            { key: 'number', label: 'Number', width: '170px', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{r.number}</span> },
            { key: 'packingListNumber', label: 'Packing List', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.packingListNumber}</span> },
            { key: 'warehouseName', label: 'Warehouse' },
            { key: 'date', label: 'Date', width: '120px', render: r => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: colors.textMuted }}>{r.date}</span> },
            { key: 'status', label: 'Status', width: '140px', render: r => <StatusBadge status={r.status} /> },
            { key: 'action', label: '', width: '40px', render: () => <ChevronRight size={15} color={colors.textMuted} /> },
          ]}
        />

        {selected && (
          <ShipmentDetailPanel shipment={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}
