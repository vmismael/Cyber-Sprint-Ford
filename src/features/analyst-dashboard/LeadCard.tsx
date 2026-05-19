import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge, Card, Icon, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import type { Lead } from '@/services/mocks/analystApi';
import { VEHICLE_LABEL, PLAN_LABEL, STATUS_LABEL, STATUS_TONE, RISK_TONE } from './leadDisplayMaps';
import { daysAgo } from '@/utils/date';

interface LeadCardProps {
  lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/(analyst)/leads/${lead.id}` as never)}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      accessibilityRole="button"
      accessibilityLabel={`Lead ${lead.clientName}, score ${lead.aiScore}`}
    >
      <Card padding="md">
        {/* Row 1: name + score badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {lead.clientName}
          </Text>
          <Badge label={`IA ${lead.aiScore}`} tone={RISK_TONE[lead.riskLabel]} />
        </View>

        {/* Row 2: vehicle · plan · service */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.xs,
            flexWrap: 'wrap',
          }}
        >
          <Text variant="caption" color="muted">
            {VEHICLE_LABEL[lead.vehicleModel]}
          </Text>
          <Text variant="caption" color="muted">·</Text>
          <Badge label={PLAN_LABEL[lead.plan]} tone="info" />
          <Text variant="caption" color="muted">·</Text>
          <Text variant="caption" color="muted" numberOfLines={1} style={{ flex: 1 }}>
            {lead.service}
          </Text>
        </View>

        {/* Row 3: last activity + status + revenue */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
            <Icon name="time-outline" size={13} color="muted" />
            <Text variant="caption" color="muted">
              {daysAgo(lead.lastActivity)}
            </Text>
          </View>
          <Badge label={STATUS_LABEL[lead.status]} tone={STATUS_TONE[lead.status]} />
          <Text variant="caption" color="muted">
            R$ {lead.estimatedRevenue.toLocaleString('pt-BR')}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
