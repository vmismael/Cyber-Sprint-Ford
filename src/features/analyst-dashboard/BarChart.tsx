import { memo, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import type { BarPoint } from '@/services/mocks/analystApi';

const MAX_BAR_HEIGHT = 110;
const BAR_WIDTH = 10;

interface BarProps {
  targetHeight: number;
  color: string;
  delay: number;
}

function AnimatedBar({ targetHeight, color, delay }: BarProps) {
  const height = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => {
      height.value = withTiming(targetHeight, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);
    return () => {
      clearTimeout(t);
      cancelAnimation(height);
    };
  }, [targetHeight, delay]); // eslint-disable-line react-hooks/exhaustive-deps -- shared value ref is stable

  const style = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <Animated.View
      style={[
        style,
        {
          width: BAR_WIDTH,
          backgroundColor: color,
          borderRadius: 3,
          alignSelf: 'flex-end',
        },
      ]}
    />
  );
}

interface BarChartProps {
  data: BarPoint[];
}

export const BarChart = memo(function BarChart({ data }: BarChartProps) {
  const theme = useTheme();

  const maxVal = Math.max(...data.flatMap((d) => [d.bookings, d.conversions]), 1);

  const refLines = [0.25, 0.5, 0.75, 1].map((pct) =>
    Math.round(maxVal * pct),
  );

  return (
    <View style={{ gap: theme.spacing.md }}>
      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: theme.colors.fordBlueLight }} />
          <Text variant="caption" color="muted">Agendamentos</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: theme.colors.success }} />
          <Text variant="caption" color="muted">Conversões</Text>
        </View>
      </View>

      {/* Chart area */}
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        {/* Y-axis labels */}
        <View
          style={{
            width: 28,
            height: MAX_BAR_HEIGHT,
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          {[...refLines].reverse().map((v, i) => (
            <Text key={i} variant="caption" color="muted" style={{ fontSize: 9 }}>
              {v}
            </Text>
          ))}
        </View>

        {/* Bars + grid */}
        <View style={{ flex: 1, position: 'relative' }}>
          {/* Reference lines */}
          {refLines.map((_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: ((i + 1) / refLines.length) * MAX_BAR_HEIGHT,
                height: 1,
                borderTopWidth: 0.5,
                borderColor: theme.colors.border,
                borderStyle: 'dashed',
              }}
            />
          ))}

          {/* Bar groups */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              height: MAX_BAR_HEIGHT,
            }}
          >
            {data.map((point, i) => {
              const bH = Math.round((point.bookings / maxVal) * MAX_BAR_HEIGHT);
              const cH = Math.round((point.conversions / maxVal) * MAX_BAR_HEIGHT);
              return (
                <View key={i} style={{ alignItems: 'center', gap: 2 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-end',
                      gap: 2,
                      height: MAX_BAR_HEIGHT,
                    }}
                  >
                    <AnimatedBar targetHeight={bH} color={theme.colors.fordBlueLight} delay={i * 60} />
                    <AnimatedBar targetHeight={cH} color={theme.colors.success} delay={i * 60 + 80} />
                  </View>
                  <Text variant="caption" color="muted" style={{ fontSize: 9 }}>
                    {point.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
});
