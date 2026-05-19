import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Skeleton } from '@/components/state';

export function MapSkeleton() {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.fill, { backgroundColor: theme.colors.bgBase }]}
    >
      <View style={styles.gridWrap}>
        {Array.from({ length: 8 }).map((_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: 6 }).map((_, col) => (
              <View
                key={col}
                style={[
                  styles.cell,
                  {
                    borderColor: theme.colors.border,
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={[styles.pin, { top: '32%', left: '40%' }]}>
        <Skeleton.Circle size={28} />
      </View>
      <View style={[styles.pin, { top: '52%', left: '62%' }]}>
        <Skeleton.Circle size={28} />
      </View>
      <View style={[styles.pin, { top: '70%', left: '28%' }]}>
        <Skeleton.Circle size={28} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  gridWrap: {
    flex: 1,
    opacity: 0.4,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pin: {
    position: 'absolute',
  },
});
