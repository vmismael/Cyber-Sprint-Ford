import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type IconColor =
  | 'primary'
  | 'muted'
  | 'accent'
  | 'warn'
  | 'critical'
  | 'success'
  | 'inverse';

export type IconProps = {
  name: IconName;
  size?: number;
  color?: IconColor;
  /**
   * Quando o icone tem significado proprio (nao apenas decorativo), passar
   * label para que o leitor de tela anuncie. Ex.: icone-only buttons.
   * Por padrao, icones sao tratados como decorativos e ignorados pelo leitor.
   */
  accessibilityLabel?: string;
};

export function Icon({ name, size = 20, color = 'primary', accessibilityLabel }: IconProps) {
  const theme = useTheme();
  const map: Record<IconColor, string> = {
    primary: theme.colors.textPrimary,
    muted: theme.colors.textMuted,
    accent: theme.plan.accent,
    warn: theme.colors.alertWarn,
    critical: theme.colors.alertCritical,
    success: theme.colors.success,
    inverse: theme.plan.accentContrast,
  };
  const decorative = !accessibilityLabel;
  return (
    <Ionicons
      name={name}
      size={size}
      color={map[color]}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
    />
  );
}
