import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOutLeft, Layout } from 'react-native-reanimated';
import { GlassPanel, Icon, Text, type IconName } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import type { Alert, AlertCategory, AlertSeverity } from '@/services/mocks/alertsApi';

const ICON_BY_CATEGORY: Record<AlertCategory, IconName> = {
  maintenance: 'construct-outline',
  'tire-low': 'ellipse-outline',
  'tire-high': 'ellipse-outline',
  engine: 'thermometer-outline',
  fuel: 'water-outline',
  battery: 'battery-half-outline',
  terrain: 'trail-sign-outline',
};

export type AlertCardProps = {
  alert: Alert;
  onDismiss?: (id: string) => void;
};

export function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const theme = useTheme();
  const colorBySeverity: Record<AlertSeverity, string> = {
    warn: theme.colors.alertWarn,
    critical: theme.colors.alertCritical,
  };
  const accent = colorBySeverity[alert.severity];

  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOutLeft.duration(180)} layout={Layout}>
      <GlassPanel
        padding="lg"
        style={{
          gap: theme.spacing.sm,
          borderColor: `${accent}55`,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${accent}26`,
            }}
          >
            <Icon
              name={ICON_BY_CATEGORY[alert.category]}
              size={22}
              color={alert.severity === 'critical' ? 'critical' : 'warn'}
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              variant="caption"
              color={alert.severity === 'critical' ? 'critical' : 'warn'}
              style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
            >
              {alert.severity === 'critical' ? 'Crítico' : 'Atenção'}
            </Text>
            <Text variant="h3">{alert.title}</Text>
          </View>
          {onDismiss ? (
            <Pressable
              onPress={() => onDismiss(alert.id)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={`Dispensar alerta ${alert.title}`}
              style={{
                width: theme.touchTarget.min,
                height: theme.touchTarget.min,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="close" size={20} color="muted" />
            </Pressable>
          ) : null}
        </View>
        <Text variant="body" color="muted">
          {alert.description}
        </Text>
      </GlassPanel>
    </Animated.View>
  );
}
