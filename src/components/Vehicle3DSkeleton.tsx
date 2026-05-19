import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { Skeleton } from '@/components/state';

export function Vehicle3DSkeleton() {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.fill, { backgroundColor: theme.colors.bgBase }]}
    >
      <View style={styles.center}>
        <Skeleton.Block height={120} width={220} radius={theme.radius.lg} />
        <View style={{ height: theme.spacing.md }} />
        <View style={styles.row}>
          <Skeleton.Circle size={36} />
          <View style={{ width: theme.spacing.md }} />
          <View style={{ gap: theme.spacing.xs }}>
            <Skeleton.Line width={140} />
            <Skeleton.Line width={90} height={10} />
          </View>
        </View>
      </View>

      <View style={[styles.hint, { gap: theme.spacing.xs }]}>
        <Icon name="cube-outline" size={20} color="muted" />
        <Text variant="caption" color="muted">
          Carregando modelo 3D…
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hint: {
    position: 'absolute',
    bottom: 120,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
