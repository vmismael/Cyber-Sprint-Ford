export const colors = {
  fordBlue: '#003478',
  fordBlueLight: '#1F6FEB',
  bgBase: '#0A0E14',
  bgElevated: '#13171F',
  surfaceGlass: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  textPrimary: '#F5F7FA',
  textMuted: '#8A93A6',
  alertWarn: '#FFB020',
  alertCritical: '#E5484D',
  success: '#30A46C',
  overlay: 'rgba(0,0,0,0.45)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const blur = {
  panel: 20,
  modal: 30,
} as const;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} as const;

export const touchTarget = {
  min: 44,
  comfortable: 48,
} as const;
