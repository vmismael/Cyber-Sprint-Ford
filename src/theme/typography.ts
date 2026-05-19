export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography = {
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: fontFamily.semibold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: fontFamily.semibold,
    fontSize: 20,
    lineHeight: 26,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  bodyStrong: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
} as const;

export type TypographyVariant = keyof typeof typography;
