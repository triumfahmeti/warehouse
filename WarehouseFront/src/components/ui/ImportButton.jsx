import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { colors } from '../../theme/colors';

/**
 * Buton importi për Admin.
 * Props:
 *   onImport(file) → async funksion që bën upload
 *   accept         → llojet e lejuara (default: ".csv,.xlsx,.json")
 *   label          → teksti i butonit (default: "Import")
 */
export default function ImportButton({ onImport, accept = '.csv,.xlsx,.json', label = 'Import' }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      await onImport(file);
    } finally {
      setLoading(false);
      e.target.value = ''; // reset input që të mund të importosh sërisht
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: colors.surface, color: colors.text,
          border: `1px solid ${colors.border}`, borderRadius: 8,
          padding: '9px 14px', fontSize: 13, fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)', opacity: loading ? 0.6 : 1,
        }}
      >
        <Upload size={14} />
        {loading ? 'Importing...' : label}
      </button>
    </>
  );
}
