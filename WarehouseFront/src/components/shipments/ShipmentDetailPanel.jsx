import { Check, XCircle, Truck, CheckCircle2 } from 'lucide-react';
import { colors } from '../../theme/colors';
import { DetailRow } from '../ui/Stat';

const actionBtn = {
  all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '10px 14px', borderRadius: 8,
  background: colors.surface, border: `1px solid ${colors.border}`,
  color: colors.text, fontSize: 13, fontWeight: 500, cursor: 'pointer',
  fontFamily: 'var(--font-sans)', textAlign: 'center',
  transition: 'background 0.15s',
};

const STATUS_FLOW = ['Draft', 'Ready', 'Shipped', 'Delivered'];

// Paneli anësor që shfaqet kur klikohet një shipment në tabelë.
// Tregon timeline-in e statusit dhe butona veprimi sipas statusit aktual.
export default function ShipmentDetailPanel({ shipment, onClose }) {
  const currentIdx = STATUS_FLOW.indexOf(shipment.status);

  return (
    <div style={{
      background: colors.surface, border: `1px solid ${colors.border}`,
      borderRadius: 12, padding: 20, height: 'fit-content',
      position: 'sticky', top: 100,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
        <div>
          <div style={{
            fontSize: 11, color: colors.textMuted, fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>Shipment Detail</div>
          <div style={{
            fontSize: 18, fontWeight: 600, color: colors.text,
            fontFamily: 'var(--font-mono)', marginTop: 4,
          }}>{shipment.number}</div>
        </div>
        <button onClick={onClose} style={{
          all: 'unset', cursor: 'pointer', padding: 4, borderRadius: 4, color: colors.textMuted,
        }}>
          <XCircle size={18} />
        </button>
      </div>

      {/* Status flow timeline */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 11, color: colors.textMuted, fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
        }}>Status Flow</div>
        <div style={{ position: 'relative' }}>
          {STATUS_FLOW.map((step, i) => {
            const done = i <= currentIdx;
            const current = i === currentIdx;
            return (
              <div key={step} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                paddingBottom: i < STATUS_FLOW.length - 1 ? 16 : 0,
                position: 'relative',
              }}>
                {i < STATUS_FLOW.length - 1 && (
                  <div style={{
                    position: 'absolute', left: 9, top: 22, width: 2, height: 22,
                    background: i < currentIdx ? colors.accent : colors.border,
                  }} />
                )}
                <div style={{
                  width: 20, height: 20, borderRadius: 999,
                  background: done ? colors.accent : colors.surface,
                  border: done ? 'none' : `2px solid ${colors.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: current ? `0 0 0 4px ${colors.accentSoft}` : 'none',
                }}>
                  {done && <Check size={11} color="white" strokeWidth={3} />}
                </div>
                <div>
                  <div style={{
                    fontSize: 13, fontWeight: current ? 600 : 400,
                    color: done ? colors.text : colors.textMuted, fontFamily: 'var(--font-sans)',
                  }}>{step}</div>
                  {current && (
                    <div style={{ fontSize: 11, color: colors.accent, fontFamily: 'var(--font-mono)', marginTop: 2 }}>Current</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details */}
      <div style={{ padding: 14, background: colors.bg, borderRadius: 8, marginBottom: 16 }}>
        <DetailRow label="Packing List" value={shipment.packingListNumber} mono />
        <DetailRow label="Warehouse" value={shipment.warehouseName} />
        <DetailRow label="Created" value={shipment.date} mono />
      </div>

      {/* Actions sipas statusit */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {shipment.status === 'Draft' && (
          <button style={actionBtn}>Mark as Ready →</button>
        )}
        {shipment.status === 'Ready' && (
          <button style={{ ...actionBtn, background: colors.accent, color: 'white', border: 'none' }}>
            Ship Now <Truck size={14} />
          </button>
        )}
        {shipment.status === 'Shipped' && (
          <button style={{ ...actionBtn, background: colors.success, color: 'white', border: 'none' }}>
            Mark Delivered <CheckCircle2 size={14} />
          </button>
        )}
        <button style={{ ...actionBtn, color: colors.textMuted }}>View Full Details</button>
      </div>
    </div>
  );
}
