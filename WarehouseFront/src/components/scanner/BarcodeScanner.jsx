import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { colors } from "../../theme/colors";

const FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF,
];

// Të gjitha operacionet e kamerës radhiten këtu, që start() dhe stop()
// të mos mbivendosen kurrë, edhe kur React i montoi efektet dy herë.
let scannerQueue = Promise.resolve();

async function safeStop(scanner) {
  try {
    if (scanner.isScanning) await scanner.stop();
  } catch {
    // kamera mund të jetë ndaluar tashmë
  }
  try {
    scanner.clear();
  } catch {
    // elementi mund të jetë hequr tashmë
  }
}

async function requestContinuousFocus(scanner) {
  try {
    await scanner.applyVideoConstraints({ focusMode: "continuous" });
    return;
  } catch {
    // Disa browser-a e pranojne focusMode vetem brenda advanced.
  }

  try {
    await scanner.applyVideoConstraints({
      advanced: [{ focusMode: "continuous" }],
    });
  } catch {
    // Pajisja nuk e mbeshtet fokusin e kontrolluar nga browser-i.
  }
}

async function requestUsefulZoom(scanner) {
  try {
    const capabilities = scanner.getRunningTrackCapabilities?.();
    const zoom = capabilities?.zoom;
    if (!zoom || zoom.max <= zoom.min) return;

    const targetZoom = Math.min(zoom.max, Math.max(zoom.min, 3));
    await scanner.applyVideoConstraints({ zoom: targetZoom });
  } catch {
    // Telefoni/browser-i mund te mos lejoje kontrollin e zoom-it.
  }
}

export default function BarcodeScanner({ onScan, onError }) {
  const containerId = `barcode-reader-${useId().replace(/:/g, "")}`;
  const lastReadRef = useRef({ code: null, at: 0 });
  const candidateRef = useRef({ code: null, count: 0, at: 0 });

  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onScanRef.current = onScan;
    onErrorRef.current = onError;
  }, [onScan, onError]);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const scanner = new Html5Qrcode(containerId, {
      formatsToSupport: FORMATS,
      verbose: false,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    });

    scannerQueue = scannerQueue.then(async () => {
      if (cancelled) return;
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (w, h) => {
              const size = Math.floor(Math.min(w, h) * 0.8);
              return { width: size, height: Math.floor(size * 0.6) };
            },
          },
          (decodedText) => {
            const now = Date.now();
            const last = lastReadRef.current;
            if (last.code === decodedText && now - last.at < 2000) return;

            const candidate = candidateRef.current;
            if (candidate.code !== decodedText || now - candidate.at > 1200) {
              candidateRef.current = { code: decodedText, count: 1, at: now };
              return;
            }

            candidateRef.current = {
              code: decodedText,
              count: candidate.count + 1,
              at: now,
            };
            if (candidate.count + 1 < 2) return;

            lastReadRef.current = { code: decodedText, at: now };
            candidateRef.current = { code: null, count: 0, at: 0 };
            onScanRef.current?.(decodedText);
          },
          () => {},
        );

        if (cancelled) {
          await safeStop(scanner);
          return;
        }
        await requestContinuousFocus(scanner);
        await requestUsefulZoom(scanner);
        window.setTimeout(() => {
          if (!cancelled) {
            void requestContinuousFocus(scanner);
            void requestUsefulZoom(scanner);
          }
        }, 500);

        setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError("Kamera nuk u hap. Kontrollo lejet e browser-it.");
          onErrorRef.current?.(e);
        }
      }
    });

    return () => {
      cancelled = true;
      // Ndalimi radhitet pas start() të fundit, jo menjëherë
      scannerQueue = scannerQueue.then(() => safeStop(scanner));
    };
  }, [containerId]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
      }}
    >
      <div
        id={containerId}
        style={{
          width: "100%",
          borderRadius: 12,
          overflow: "hidden",
          background: "#000",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "8%",
          right: "8%",
          height: 1,
          background: "#ef4444",
          boxShadow: "0 0 10px 2px #ef4444",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />
      {!ready && !error && (
        <p
          style={{ textAlign: "center", color: colors.textMuted, fontSize: 13 }}
        >
          Camera is opening…
        </p>
      )}
      {error && (
        <p style={{ textAlign: "center", color: colors.danger, fontSize: 13 }}>
          {error}
        </p>
      )}
    </div>
  );
}
