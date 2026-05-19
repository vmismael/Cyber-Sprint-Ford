import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type PressableProps,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import type { PressFeedback } from '@/theme/plans';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
};

const FEEDBACK_PARAMS: Record<
  PressFeedback,
  { scale: number; translateY: number; opacity: number; duration: number }
> = {
  sharp: { scale: 0.92, translateY: 0, opacity: 1, duration: 60 },
  soft: { scale: 0.96, translateY: 0, opacity: 0.85, duration: 120 },
  lift: { scale: 0.98, translateY: -2, opacity: 1, duration: 140 },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const params = FEEDBACK_PARAMS[theme.plan.pressFeedback];

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = (e: GestureResponderEvent) => {
    if (isDisabled) return;
    const cfg = { duration: params.duration, easing: Easing.out(Easing.quad) };
    scale.value = withTiming(params.scale, cfg);
    translateY.value = withTiming(params.translateY, cfg);
    opacity.value = withTiming(params.opacity, cfg);
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    const cfg = { duration: params.duration, easing: Easing.out(Easing.quad) };
    scale.value = withTiming(1, cfg);
    translateY.value = withTiming(0, cfg);
    opacity.value = withTiming(1, cfg);
    onPressOut?.(e);
  };

  const surface = (() => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.plan.accent,
          fg: theme.plan.accentContrast,
          border: 'transparent',
        };
      case 'secondary':
        return {
          bg: theme.colors.bgElevated,
          fg: theme.colors.textPrimary,
          border: theme.colors.borderStrong,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          fg: theme.colors.textPrimary,
          border: 'transparent',
        };
    }
  })();

  const liftShadow =
    variant === 'primary' && theme.plan.pressFeedback === 'lift'
      ? {
          shadowColor: theme.plan.glow.color,
          shadowOpacity: theme.plan.glow.opacity,
          shadowRadius: theme.plan.glow.radius,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }
      : null;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={rest.accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={8}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        animatedStyle,
        liftShadow,
        {
          backgroundColor: surface.bg,
          borderColor: surface.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.lg,
          minHeight: theme.touchTarget.comfortable,
          width: fullWidth ? '100%' : undefined,
          opacity: isDisabled ? 0.5 : 1,
        },
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={surface.fg} />
      ) : (
        <View style={styles.content}>
          {iconLeft ? <View style={{ marginRight: theme.spacing.sm }}>{iconLeft}</View> : null}
          <Text variant="bodyStrong" style={{ color: surface.fg }}>
            {label}
          </Text>
          {iconRight ? <View style={{ marginLeft: theme.spacing.sm }}>{iconRight}</View> : null}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
