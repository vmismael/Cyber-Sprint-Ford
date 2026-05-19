import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';

export type EmptyStateProps = {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  compact?: boolean;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
  compact = false,
}: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      style={[
        styles.container,
        {
          paddingVertical: compact ? theme.spacing.lg : theme.spacing.xl,
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.sm,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={compact ? 28 : 36} color="muted" /> : null}
      <Text variant="bodyStrong" color="primary" style={styles.center}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" color="muted" style={styles.center}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <Button label={actionLabel} variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
  },
});
