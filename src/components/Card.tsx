import { View, type ViewProps } from 'react-native';
import { useTheme, type Theme } from '@/theme/ThemeProvider';

type SpacingKey = keyof Theme['spacing'];

export type CardProps = ViewProps & {
  elevated?: boolean;
  padding?: SpacingKey | 'none';
};

export function Card({
  elevated = false,
  padding = 'lg',
  style,
  children,
  ...rest
}: CardProps) {
  const theme = useTheme();
  const paddingValue = padding === 'none' ? 0 : theme.spacing[padding];

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.bgElevated,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.lg,
          padding: paddingValue,
        },
        elevated && theme.shadow.md,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
