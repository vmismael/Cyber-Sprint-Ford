import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export type BadgeTone = 'info' | 'warn' | 'critical' | 'success' | 'accent' | 'neutral';

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
};

export function Badge({ label, tone = 'info' }: BadgeProps) {
  const theme = useTheme();

  const palette: Record<BadgeTone, { bg: string; fg: string }> = {
    info: { bg: 'rgba(31,111,235,0.18)', fg: theme.colors.fordBlueLight },
    warn: { bg: 'rgba(255,176,32,0.18)', fg: theme.colors.alertWarn },
    critical: { bg: 'rgba(229,72,77,0.18)', fg: theme.colors.alertCritical },
    success: { bg: 'rgba(48,164,108,0.18)', fg: theme.colors.success },
    accent: { bg: theme.plan.accentSoft, fg: theme.plan.accent },
    neutral: { bg: theme.colors.border, fg: theme.colors.textMuted },
  };
  const { bg, fg } = palette[tone];

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.full,
        backgroundColor: bg,
      }}
    >
      <Text
        variant="caption"
        style={{ color: fg, fontFamily: theme.fontFamily.medium, letterSpacing: 0.3 }}
      >
        {label}
      </Text>
    </View>
  );
}
