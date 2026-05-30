// ============ DESIGN TOKENS ============
// Paleta qendrore e ngjyrave. Çdo komponentë importon nga këtu që
// të kemi konsistencë dhe një vend të vetëm për ndryshime.
export const colors = {
  bg: '#FAFAF7',
  surface: '#FFFFFF',
  border: '#E8E6E1',
  borderStrong: '#D4D2CC',
  text: '#0A0A08',
  textMuted: '#6B6B66',
  textDim: '#9B9B94',
  accent: '#FF5C28',
  accentSoft: '#FFE8DE',
  success: '#1F7A4D',
  successSoft: '#D7F0DF',
  warning: '#B8860B',
  warningSoft: '#FFF4D6',
  info: '#2B5BD7',
  infoSoft: '#DCE6FF',
  danger: '#C2362B',
  dangerSoft: '#FCE0DD',
};

// Konfigurimi i ngjyrave për çdo status. Përdoret nga StatusBadge.
export const statusConfig = {
  Draft:      { bg: '#F0EFEA', fg: '#6B6B66', dot: '#9B9B94' },
  New:        { bg: colors.infoSoft, fg: colors.info, dot: colors.info },
  Ready:      { bg: colors.warningSoft, fg: colors.warning, dot: colors.warning },
  Processing: { bg: colors.warningSoft, fg: colors.warning, dot: colors.warning },
  Confirmed:  { bg: colors.infoSoft, fg: colors.info, dot: colors.info },
  Shipped:    { bg: '#E5DFFB', fg: '#5B3FBC', dot: '#5B3FBC' },
  Delivered:  { bg: colors.successSoft, fg: colors.success, dot: colors.success },
  Completed:  { bg: colors.successSoft, fg: colors.success, dot: colors.success },
  Cancelled:  { bg: colors.dangerSoft, fg: colors.danger, dot: colors.danger },
};

// Font tokens (përdoren si CSS variables te App.jsx, por i mbajmë edhe këtu për referencë)
export const fonts = {
  sans: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
};
