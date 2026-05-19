import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export type StepIndicatorProps = {
  total: number;
  current: number;
};

export function StepIndicator({ total, current }: StepIndicatorProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Passo ${current} de ${total}`}
      style={{ flexDirection: 'row', gap: theme.spacing.xs, paddingVertical: theme.spacing.sm }}
    >
      {Array.from({ length: total }).map((_, idx) => {
        const reached = idx < current;
        return (
          <View
            key={idx}
            style={{
              flex: 1,
              height: 4,
              borderRadius: theme.radius.full,
              backgroundColor: reached ? theme.plan.accent : theme.colors.border,
            }}
          />
        );
      })}
    </View>
  );
}
