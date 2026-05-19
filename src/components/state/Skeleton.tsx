import { StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  makeMutable,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';

type SharedProps = {
  style?: ViewStyle;
  shimmer?: boolean;
};

type BlockProps = SharedProps & {
  height?: number;
  width?: DimensionValue;
  radius?: number;
};

// Shared driver: 1 unico worklet para todo o app, independente de quantos
// skeletons estao montados simultaneamente. Todos pulsam em sincronia
// (visualmente coeso) e a UI thread nao satura mesmo em listas grandes.
let sharedShimmer: SharedValue<number> | null = null;

function getShimmerDriver(): SharedValue<number> {
  if (!sharedShimmer) {
    const sv = makeMutable(0.55);
    sv.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    sharedShimmer = sv;
  }
  return sharedShimmer;
}

// Constante para o caso `shimmer={false}` — evita criar novo SharedValue
// por skeleton estatico.
let staticOpacity: SharedValue<number> | null = null;
function getStaticOpacity(): SharedValue<number> {
  if (!staticOpacity) staticOpacity = makeMutable(0.55);
  return staticOpacity;
}

function useShimmerStyle(enabled: boolean) {
  const driver = enabled ? getShimmerDriver() : getStaticOpacity();
  return useAnimatedStyle(() => ({ opacity: driver.value }));
}

function SkeletonBase({
  style,
  shimmer = true,
  children,
}: SharedProps & { children?: React.ReactNode }) {
  const theme = useTheme();
  const animated = useShimmerStyle(shimmer);
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          backgroundColor: theme.colors.bgElevated,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        style,
        animated,
      ]}
    >
      {children}
    </Animated.View>
  );
}

function SkeletonBlock({ height = 16, width, radius, style, shimmer }: BlockProps) {
  const theme = useTheme();
  return (
    <SkeletonBase
      shimmer={shimmer}
      style={{
        height,
        width,
        borderRadius: radius ?? theme.radius.sm,
        ...style,
      }}
    />
  );
}

function SkeletonLine({
  width = '100%',
  height = 12,
  style,
  shimmer,
}: SharedProps & { width?: DimensionValue; height?: number }) {
  return <SkeletonBlock width={width} height={height} radius={4} style={style} shimmer={shimmer} />;
}

function SkeletonCircle({
  size = 40,
  style,
  shimmer,
}: SharedProps & { size?: number }) {
  return (
    <SkeletonBlock
      width={size}
      height={size}
      radius={size / 2}
      style={style}
      shimmer={shimmer}
    />
  );
}

function SkeletonGroup({
  children,
  gap = 8,
  style,
}: {
  children: React.ReactNode;
  gap?: number;
  style?: ViewStyle;
}) {
  return <View style={[styles.group, { gap }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'column',
  },
});

export const Skeleton = {
  Block: SkeletonBlock,
  Line: SkeletonLine,
  Circle: SkeletonCircle,
  Group: SkeletonGroup,
};
