import { BlurView } from 'expo-blur';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useTheme, type Theme } from '@/theme/ThemeProvider';

type SpacingKey = keyof Theme['spacing'];

export type GlassPanelProps = ViewProps & {
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  padding?: SpacingKey | 'none';
  borderless?: boolean;
};

export function GlassPanel({
  intensity,
  tint = 'dark',
  padding = 'lg',
  borderless = false,
  style,
  children,
  ...rest
}: GlassPanelProps) {
  const theme = useTheme();
  const paddingValue = padding === 'none' ? 0 : theme.spacing[padding];

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderRadius: theme.radius.lg,
          borderWidth: borderless ? 0 : 1,
          borderColor: theme.colors.border,
          padding: paddingValue,
        },
        style,
      ]}
      {...rest}
    >
      <BlurView
        intensity={intensity ?? theme.blur.panel}
        tint={tint}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.surfaceGlass }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
});
