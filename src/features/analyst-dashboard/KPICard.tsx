import { View } from 'react-native';
import { Card, Icon, Text, type IconName } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';

interface KPICardProps {
  label: string;
  value: string;
  icon: IconName;
  delta?: string;
  deltaPositive?: boolean;
}

export function KPICard({ label, value, icon, delta, deltaPositive }: KPICardProps) {
  const theme = useTheme();

  return (
    <Card elevated padding="md" style={{ flex: 1, gap: theme.spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: theme.radius.md,
            backgroundColor: 'rgba(31,111,235,0.14)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={16} color="accent" />
        </View>
        {delta ? (
          <Text
            variant="caption"
            style={{
              color: deltaPositive ? theme.colors.success : theme.colors.alertCritical,
              fontWeight: '600',
            }}
          >
            {delta}
          </Text>
        ) : null}
      </View>

      <Text
        variant="h1"
        style={{ color: theme.colors.textPrimary, lineHeight: 36 }}
      >
        {value}
      </Text>

      <Text
        variant="caption"
        color="muted"
        style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
      >
        {label}
      </Text>
    </Card>
  );
}
