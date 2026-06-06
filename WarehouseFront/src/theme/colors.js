const lightColors = {
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

const darkColors = {
  bg: '#111110',
  surface: '#1A1A17',
  border: '#2A2A26',
  borderStrong: '#3A3A35',
  text: '#F0F0EC',
  textMuted: '#A0A09A',
  textDim: '#6B6B66',
  accent: '#FF6B3D',
  accentSoft: '#3D1F14',
  success: '#34C97A',
  successSoft: '#0D2E1C',
  warning: '#F0B429',
  warningSoft: '#2E2208',
  info: '#5B8EF0',
  infoSoft: '#0D1A3D',
  danger: '#E05050',
  dangerSoft: '#2E0D0D',
};

const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

export const colors = new Proxy({}, {
  get(_, key) {
    return isDark() ? darkColors[key] : lightColors[key];
  }
});

export const statusConfig = {
  Draft:      { bg: '#F0EFEA', fg: '#6B6B66', dot: '#9B9B94' },
  New:        { bg: lightColors.infoSoft, fg: lightColors.info, dot: lightColors.info },
  Ready:      { bg: lightColors.warningSoft, fg: lightColors.warning, dot: lightColors.warning },
  Processing: { bg: lightColors.warningSoft, fg: lightColors.warning, dot: lightColors.warning },
  Confirmed:  { bg: lightColors.infoSoft, fg: lightColors.info, dot: lightColors.info },
  Shipped:    { bg: '#E5DFFB', fg: '#5B3FBC', dot: '#5B3FBC' },
  Delivered:  { bg: lightColors.successSoft, fg: lightColors.success, dot: lightColors.success },
  Completed:  { bg: lightColors.successSoft, fg: lightColors.success, dot: lightColors.success },
  Cancelled:  { bg: lightColors.dangerSoft, fg: lightColors.danger, dot: lightColors.danger },
};

export const fonts = {
  sans: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
};