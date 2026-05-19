import { useEffect, type PropsWithChildren } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

type FadeRiseProps = PropsWithChildren<{
  duration?: number;
  translateY?: number;
  style?: ViewStyle;
}>;

export function FadeRise({ children, duration = 500, translateY = 12, style }: FadeRiseProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
  }, [duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * translateY }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

type PopInProps = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function PopIn({ children, style }: PopInProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(1, { damping: 12, stiffness: 140 });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
