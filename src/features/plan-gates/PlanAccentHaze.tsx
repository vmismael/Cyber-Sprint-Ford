import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export type PlanAccentHazeProps = {
  size?: number;
  top?: number;
  right?: number;
  opacity?: number;
};

export function PlanAccentHaze({
  size = 320,
  top = -140,
  right = -120,
  opacity = 0.12,
}: PlanAccentHazeProps) {
  const theme = useTheme();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.wrap]}>
      <View
        style={{
          position: 'absolute',
          top,
          right,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.plan.accent,
          opacity,
          transform: [{ scale: 1.4 }],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
});
