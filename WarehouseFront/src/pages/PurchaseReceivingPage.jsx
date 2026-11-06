import { useEffect, useState } from "react";
import { ArrowLeft, PackageCheck, CheckCircle2 } from "lucide-react";
import { colors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import { purchaseOrdersApi, raftsApi } from "../api";
import StatusBadge from "../components/ui/StatusBadge";
import { PrimaryButton } from "../components/ui/Button";

// Statuset ku porosia mund të pranohet akoma
const RECEIVABLE = ["Pending", "Approved", "Receiving"];

export default function PurchaseReceivingPage() {
  const [orders, setOrders] = useState([]);
  const [rafts, setRafts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = () =>
    purchaseOrdersApi
      .getAll()
      .then((all) =>
        setOrders(all.filter((o) => RECEIVABLE.includes(o.status))),
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadOrders();
    raftsApi
      .getAll()
      .then(setRafts)
      .catch((e) => setError(e.message));
  }, []);

  if (selectedId) {
    return (
      <OrderDetail
        orderId={selectedId}
        rafts={rafts}
        onBack={() => setSelectedId(null)}
        onChanged={loadOrders}
      />
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: "0 auto" }}>
      <h2
        style={{
          margin: "0 0 4px",
          fontSize: 18,
          fontWeight: 600,
          color: colors.text,
        }}
      >
        Purchase Order Receiving
      </h2>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: colors.textMuted }}>
        Chose a purchase order to receive.
      </p>

      {error && (
        <div style={{ color: colors.danger, fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}
      {loading && (
        <p style={{ color: colors.textMuted, fontSize: 13 }}>Po ngarkohet…</p>
      )}

      {!loading && orders.length === 0 && (
        <div style={cardStyle}>
          <p style={{ margin: 0, fontSize: 13, color: colors.textMuted }}>
            There is no purchase order to receive.
          </p>
        </div>
      )}

      {orders.map((o) => (
        <button
          key={o.id}
          onClick={() => setSelectedId(o.id)}
          style={{
            ...cardStyle,
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
              {o.supplierName || "Furnitor"} · #{o.id}
            </div>
            <div
              style={{
                fontSize: 12,
                color: colors.textMuted,
                fontFamily: "var(--font-mono)",
                marginTop: 4,
              }}
            >
              {o.items?.length ?? 0} rows
            </div>
          </div>
          <StatusBadge status={o.status} />
        </button>
      ))}
    </div>
  );
}

// Detaji i porosisë: një formë për secilën linjë me mbetje
function OrderDetail({ orderId, rafts, onBack, onChanged }) {
  const [order, setOrder] = useState(null);
  const [forms, setForms] = useState({});
  const [error, setError] = useState(null);

  const reload = () => purchaseOrdersApi.getById(orderId).then(setOrder);

  useEffect(() => {
    reload().catch((e) => setError(e.message));
  }, [orderId]);

  const setForm = (itemId, patch) =>
    setForms((f) => ({ ...f, [itemId]: { ...f[itemId], ...patch } }));

  const receive = async (item) => {
    const f = forms[item.id] || {};
    const qty = Number(f.qty);

    if (!f.raftId) {
      setForm(item.id, { err: "Chose raft.", ok: null });
      return;
    }
    if (!(qty > 0)) {
      setForm(item.id, {
        err: "Quantity must be greater than zero.",
        ok: null,
      });
      return;
    }
    if (qty > item.remainingQuantity) {
      setForm(item.id, {
        err: `Maximum is ${item.remainingQuantity}.`,
        ok: null,
      });
      return;
    }

    setForm(item.id, { busy: true, err: null, ok: null });
    try {
      await purchaseOrdersApi.receiveLine(orderId, {
        purchaseOrderItemId: item.id,
        raftId: Number(f.raftId),
        quantityReceived: qty,
      });
      setForm(item.id, {
        busy: false,
        qty: "",
        ok: ` ${qty} piece is accepted.`,
      });
      await reload();
      onChanged();
    } catch (e) {
      setForm(item.id, { busy: false, err: e.message, ok: null });
    }
  };

  if (error) {
    return (
      <div style={{ padding: 32 }}>
        <BackButton onClick={onBack} />
        <div style={{ color: colors.danger, fontSize: 13 }}>{error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: 32, color: colors.textMuted, fontSize: 13 }}>
        Po ngarkohet…
      </div>
    );
  }

  const isReceivable = RECEIVABLE.includes(order.status);

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: "0 auto" }}>
      <BackButton onClick={onBack} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "12px 0 20px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: colors.text,
            }}
          >
            Purchase Order #{order.id}
          </h2>
          <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
            {order.supplierName || "Furnitor"}
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {!isReceivable && (
        <div
          style={{
            ...cardStyle,
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: colors.success,
          }}
        >
          <CheckCircle2 size={18} /> Kjo porosi nuk pranon më mallra.
        </div>
      )}

      {order.items.map((item) => {
        const f = forms[item.id] || {};
        const done = item.remainingQuantity === 0;

        return (
          <div key={item.id} style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={iconBox}>
                  <PackageCheck size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: colors.text,
                    }}
                  >
                    {item.productName}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    ordered {item.quantity} · received {item.receivedQuantity} ·
                    remaining {item.remainingQuantity}
                  </div>
                </div>
              </div>
              {done && <CheckCircle2 size={18} color={colors.success} />}
            </div>

            {isReceivable && !done && (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 120px",
                    gap: 10,
                  }}
                >
                  <select
                    value={f.raftId || ""}
                    onChange={(e) =>
                      setForm(item.id, { raftId: e.target.value, err: null })
                    }
                    style={inputStyle}
                  >
                    <option value="">— Chose raft —</option>
                    {rafts.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.raftNumber} · {r.warehouseName} · Available slots:{" "}
                        {Math.max(
                          0,
                          (r.maxCapacity ?? 0) - (r.usedCapacity ?? 0),
                        )}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    max={item.remainingQuantity}
                    value={f.qty || ""}
                    onChange={(e) =>
                      setForm(item.id, { qty: e.target.value, err: null })
                    }
                    placeholder={`max ${item.remainingQuantity}`}
                    style={inputStyle}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 12,
                  }}
                >
                  <div style={{ fontSize: 13 }}>
                    {f.err && (
                      <span style={{ color: colors.danger }}>{f.err}</span>
                    )}
                    {f.ok && (
                      <span style={{ color: colors.success }}>{f.ok}</span>
                    )}
                  </div>
                  <PrimaryButton disableHover onClick={() => receive(item)}>
                    {f.busy ? "Being received…" : "Receive"}
                  </PrimaryButton>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BackButton({ onClick }) {
  const { isDark } = useTheme();

  return (
    <button
      onClick={onClick}
      style={{
        ...linkBtn,
        background: isDark ? "#FFFFFF" : "var(--color-text)",
        color: isDark ? "#0A0A08" : "var(--color-surface)",
        borderColor: isDark ? "#FFFFFF" : "var(--color-text)",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <ArrowLeft size={14} /> Back
    </button>
  );
}

const cardStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  padding: 20,
  marginBottom: 12,
};

const iconBox = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: "var(--color-accent-soft)",
  color: "var(--color-accent)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const inputStyle = {
  all: "unset",
  boxSizing: "border-box",
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--color-border)",
  background: "var(--color-bg)",
  fontSize: 14,
  color: "var(--color-text)",
  fontFamily: "var(--font-sans)",
};

const linkBtn = {
  all: "unset",
  cursor: "pointer",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--color-border)",
  fontSize: 13,
  color: "var(--color-text)",
};
