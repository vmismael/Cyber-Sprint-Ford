import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeProvider';

const PULSE_DURATION = 600;

export function PlanSwitchPulse() {
  const theme = useTheme();
  const previousPlanRef = useRef(theme.plan.id);
  const [pulsing, setPulsing] = useState(false);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (previousPlanRef.current === theme.plan.id) return;
    previousPlanRef.current = theme.plan.id;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPulsing(true);

    opacity.value = withSequence(
      withTiming(0.3, { duration: 280, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) runOnJS(setPulsing)(false);
      }),
    );
  }, [theme.plan.id, opacity]);

  useEffect(() => () => cancelAnimation(opacity), [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!pulsing) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer]}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.plan.accent }, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    zIndex: 999,
  },
});

export const PLAN_PULSE_DURATION = PULSE_DURATION;
