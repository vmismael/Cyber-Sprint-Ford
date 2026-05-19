import { Pressable, View } from 'react-native';
import { Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';

export type SelectableCardProps = {
  title: string;
  description?: string;
  meta?: string;
  selected: boolean;
  onPress: () => void;
  accentColor?: string;
};

export function SelectableCard({
  title,
  description,
  meta,
  selected,
  onPress,
  accentColor,
}: SelectableCardProps) {
  const theme = useTheme();
  const accent = accentColor ?? theme.plan.accent;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        minHeight: theme.touchTarget.comfortable + 16,
        backgroundColor: selected
          ? `${accent}1F`
          : theme.colors.bgElevated,
        borderColor: selected ? accent : theme.colors.border,
        borderWidth: selected ? 2 : 1,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        opacity: pressed ? 0.9 : 1,
        gap: theme.spacing.xs,
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing.md,
        }}
      >
        <Text variant="h3" style={{ color: selected ? accent : theme.colors.textPrimary }}>
          {title}
        </Text>
        {meta ? (
          <Text variant="caption" color="muted">
            {meta}
          </Text>
        ) : null}
      </View>
      {description ? (
        <Text variant="body" color="muted">
          {description}
        </Text>
      ) : null}
    </Pressable>
  );
}
