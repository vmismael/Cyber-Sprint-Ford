import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';

export type ErrorStateProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  style?: ViewStyle;
  compact?: boolean;
};

export function ErrorState({
  title = 'Algo deu errado',
  description = 'Não foi possível carregar essa seção. Tente novamente em instantes.',
  retryLabel = 'Tentar novamente',
  onRetry,
  style,
  compact = false,
}: ErrorStateProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${description}`}
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
      <Icon name="warning-outline" size={compact ? 28 : 36} color="critical" />
      <Text variant="bodyStrong" color="primary" style={styles.center}>
        {title}
      </Text>
      <Text variant="body" color="muted" style={styles.center}>
        {description}
      </Text>
      {onRetry ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <Button
            label={retryLabel}
            variant="secondary"
            onPress={onRetry}
            accessibilityHint="Tenta carregar os dados novamente"
          />
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
