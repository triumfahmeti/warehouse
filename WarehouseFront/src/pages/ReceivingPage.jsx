import { useState, useEffect } from "react";
import { ScanLine, Package, Keyboard, CheckCircle2 } from "lucide-react";
import { colors } from "../theme/colors";
import { mockData } from "../data/mockData";
import BarcodeScanner from "../components/scanner/BarcodeScanner";
import { PrimaryButton } from "../components/ui/Button";
import { productsApi, inventoryApi, raftsApi } from "../api";

export default function ReceivingPage() {
  const [scanning, setScanning] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [product, setProduct] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [looking, setLooking] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [rafts, setRafts] = useState([[]]);
  const [raftId, setRaftId] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    raftsApi
      .getAll()
      .then(setRafts)
      .catch((e) => setSubmitError(e.message));
  }, []);

  // Thirret nga skaneri ose nga input-i manualf
  const lookup = async (code) => {
    setLookupError(null);
    setDone(false);
    setLooking(true);
    try {
      const p = await productsApi.getByBarcode(code);
      setProduct(p);
      setScanning(false); // ndalon kamerën që worker-i të shkruajë sasinë
    } catch (e) {
      setProduct(null);
      setLookupError(e.message);
    } finally {
      setLooking(false);
    }
  };

  const reset = () => {
    setProduct(null);
    setQuantity("");
    setRaftId("");
    setManualCode("");
    setLookupError(null);
    setSubmitError(null);
    setSubmitting(false);
    setDone(false);
    setScanning(true);
  };

  const canConfirm = product && Number(quantity) > 0 && !!raftId;

  const confirm = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await inventoryApi.addStock({
        productId: product.id,
        raftId: Number(raftId),
        quantity: Number(quantity),
      });
      setDone(true);
      setTimeout(reset, 1500);
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 560, margin: "0 auto" }}>
      <h2
        style={{
          margin: "0 0 4px",
          fontSize: 18,
          fontWeight: 600,
          color: colors.text,
        }}
      >
        Goods receiving
      </h2>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: colors.textMuted }}>
        Scan the product barcode to receive it into the warehouse.
      </p>

      {/* Skaneri */}
      {scanning && (
        <div style={cardStyle}>
          <BarcodeScanner onScan={lookup} />
        </div>
      )}

      {/* Input manual, nëse kamera s'punon ose barkodi s'lexohet */}
      {scanning && (
        <div
          style={{
            ...cardStyle,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Keyboard size={16} color={colors.textMuted} />
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && manualCode && lookup(manualCode)
            }
            placeholder="Or write the barcode manually"
            style={inputStyle}
          />
          <PrimaryButton onClick={() => manualCode && lookup(manualCode)}>
            Search
          </PrimaryButton>
        </div>
      )}

      {looking && (
        <p style={{ color: colors.textMuted, fontSize: 13 }}>
          Product is being searched…
        </p>
      )}

      {lookupError && (
        <div
          style={{
            ...cardStyle,
            borderColor: colors.danger,
            color: colors.danger,
            fontSize: 13,
          }}
        >
          {lookupError}
          <div style={{ marginTop: 10 }}>
            <button onClick={reset} style={linkBtn}>
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Produkti i gjetur + forma e pranimit */}
      {product && !done && (
        <div
          style={{
            ...cardStyle,
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div style={iconBox}>
              <Package size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--color-text)",
                }}
              >
                {product.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: colors.textMuted,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {product.sku} · {product.barcode}
              </div>
            </div>
          </div>

          <label style={labelStyle}>Amount</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={inputStyle}
            placeholder=" Type the amount"
          />

          <label style={{ ...labelStyle, marginTop: 14 }}>Raft</label>
          <select
            value={raftId}
            onChange={(e) => setRaftId(e.target.value)}
            style={inputStyle}
          >
            <option value=""> Chose Raft </option>
            {rafts.map((r) => (
              <option key={r.id} value={r.id}>
                {r.raftNumber} · {r.warehouseName} · Available slots:{" "}
                {Math.max(0, (r.maxCapacity ?? 0) - (r.usedCapacity ?? 0))}
              </option>
            ))}
          </select>

          {submitError && (
            <div style={{ color: colors.danger, fontSize: 13, marginTop: 12 }}>
              {submitError}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={reset} style={{ ...linkBtn, flex: 1 }}>
              Cancel
            </button>
            <PrimaryButton onClick={confirm}>
              {submitting
                ? "Submitting…"
                : canConfirm
                  ? "Confirm the receiving"
                  : "Fill in all fields"}
            </PrimaryButton>
          </div>
        </div>
      )}

      {done && (
        <div
          style={{
            ...cardStyle,
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: colors.success,
          }}
        >
          <CheckCircle2 size={18} /> Recieve is registered.
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
};

const iconBox = {
  width: 36,
  height: 36,
  borderRadius: 8,
  background: "var(--color-accent-soft)",
  color: "var(--color-accent)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const labelStyle = {
  display: "block",
  fontSize: 11,
  color: colors.textMuted,
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 6,
};

const inputStyle = {
  all: "unset",
  boxSizing: "border-box",
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  background: colors.bg,
  fontSize: 14,
  color: colors.text,
  fontFamily: "var(--font-sans)",
};

const linkBtn = {
  all: "unset",
  cursor: "pointer",
  padding: "8px 12px",
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  fontSize: 13,
  color: colors.text,
  textAlign: "center",
};
