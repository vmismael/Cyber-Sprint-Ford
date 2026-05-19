import type { ReactNode } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { TypographyVariant } from '@/theme/typography';

export type TextColor =
  | 'primary'
  | 'muted'
  | 'accent'
  | 'warn'
  | 'critical'
  | 'success'
  | 'inverse';

export type TextProps = Omit<RNTextProps, 'children'> & {
  variant?: TypographyVariant;
  color?: TextColor;
  children: ReactNode;
};

// Clamp por variante para preservar layouts glass / KPIs em escalas extremas.
// Variantes "small" (caption/label/body) escalam ate 1.6x; headings sao mais
// conservadores para nao quebrar cards e linhas com letterSpacing negativo.
const FONT_SCALE_CAP: Record<TypographyVariant, number> = {
  h1: 1.3,
  h2: 1.35,
  h3: 1.4,
  body: 1.6,
  bodyStrong: 1.6,
  label: 1.6,
  caption: 1.6,
};

export function Text({
  variant = 'body',
  color = 'primary',
  style,
  children,
  allowFontScaling,
  maxFontSizeMultiplier,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const colorMap: Record<TextColor, string> = {
    primary: theme.colors.textPrimary,
    muted: theme.colors.textMuted,
    accent: theme.plan.accent,
    warn: theme.colors.alertWarn,
    critical: theme.colors.alertCritical,
    success: theme.colors.success,
    inverse: theme.plan.accentContrast,
  };
  return (
    <RNText
      allowFontScaling={allowFontScaling ?? true}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? FONT_SCALE_CAP[variant]}
      style={[theme.typography[variant], { color: colorMap[color] }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
