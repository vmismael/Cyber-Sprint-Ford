import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Card, Icon, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import {
  MODE_LABEL,
  SERVICE_LABEL,
  type Booking,
} from '@/types/scheduling';
import { fetchDealerById } from '@/services/mocks/dealersApi';

function formatDate(iso: string): string {
  try {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
}

export type BookingListItemProps = {
  booking: Booking;
  onPress?: (booking: Booking) => void;
};

export function BookingListItem({ booking, onPress }: BookingListItemProps) {
  const theme = useTheme();
  const [dealerName, setDealerName] = useState<string>('Concessionária');

  useEffect(() => {
    let cancelled = false;
    fetchDealerById(booking.dealerId).then((d) => {
      if (!cancelled && d) setDealerName(d.name);
    });
    return () => {
      cancelled = true;
    };
  }, [booking.dealerId]);

  const isCancelled = booking.status === 'cancelled';

  return (
    <Pressable
      onPress={() => onPress?.(booking)}
      accessibilityRole="button"
      accessibilityLabel={`Agendamento ${booking.protocol}, status ${booking.status}`}
      hitSlop={6}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Card padding="md">
        <View style={{ gap: theme.spacing.sm }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: theme.spacing.sm,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
                {booking.protocol}
              </Text>
              <Text variant="bodyStrong" style={{ textDecorationLine: isCancelled ? 'line-through' : 'none' }}>
                {SERVICE_LABEL[booking.service]} · {dealerName}
              </Text>
            </View>
            <Badge
              label={isCancelled ? 'Cancelado' : 'Confirmado'}
              tone={isCancelled ? 'neutral' : 'success'}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="calendar-outline" size={14} color="muted" />
              <Text variant="caption" color="muted">
                {formatDate(booking.date)} às {booking.slot}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="car-outline" size={14} color="muted" />
              <Text variant="caption" color="muted">
                {MODE_LABEL[booking.mode]}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
