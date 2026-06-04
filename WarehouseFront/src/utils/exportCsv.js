/**
 * Utility i përbashkët për eksport CSV.
 * @param {string[]} headers  - Titujt e kolonave
 * @param {Array[]}  rows     - Array i rows, ku çdo row është array vlerash
 * @param {string}   filename - Emri i skedarit (pa .csv)
 */
export function exportToCsv(headers, rows, filename) {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
