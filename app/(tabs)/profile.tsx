import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Badge, Button, Card, GlassPanel, Icon, Screen, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePlanStore } from '@/stores/usePlanStore';
import { useUserStore } from '@/stores/useUserStore';
import { useSchedulingStore } from '@/stores/useSchedulingStore';
import { BookingListItem } from '@/features/scheduling/BookingListItem';
import { planAccents, planIds, type PlanId } from '@/theme/plans';
import type { Booking } from '@/types/scheduling';
import { haptic } from '@/utils/haptics';

export default function ProfileScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const plan = usePlanStore((s) => s.plan);
  const profile = useUserStore((s) => s.profile);
  const updatePlan = useUserStore((s) => s.updatePlan);
  const bookings = useSchedulingStore((s) => s.bookings);
  const cancelBooking = useSchedulingStore((s) => s.cancelBooking);
  const clearBookings = useSchedulingStore((s) => s.clearBookings);
  const tabBarHeight = useBottomTabBarHeight();
  const [signingOut, setSigningOut] = useState(false);
  const [switchingPlan, setSwitchingPlan] = useState<PlanId | null>(null);

  const requestPlanSwitch = (next: PlanId) => {
    if (next === plan || switchingPlan) return;
    const label = planAccents[next].label;
    const message = `Trocar para o plano ${label}? A interface se adapta na hora.`;
    const apply = async () => {
      setSwitchingPlan(next);
      try {
        await updatePlan(next);
      } finally {
        setSwitchingPlan(null);
      }
    };
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' && window.confirm(message);
      if (ok) apply();
      return;
    }
    Alert.alert(`Trocar para ${label}?`, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Trocar', onPress: apply },
    ]);
  };

  const performLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const ok =
        typeof window !== 'undefined' &&
        window.confirm('Deseja realmente encerrar a sessão?');
      if (ok) performLogout();
      return;
    }
    Alert.alert('Sair da conta', 'Deseja realmente encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: performLogout },
    ]);
  };

  const confirmCancel = (booking: Booking) => {
    if (booking.status === 'cancelled') return;
    const message = `Cancelar agendamento ${booking.protocol}?`;
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' && window.confirm(message);
      if (ok) {
        haptic.medium();
        cancelBooking(booking.id);
      }
      return;
    }
    Alert.alert('Cancelar agendamento', message, [
      { text: 'Manter', style: 'cancel' },
      {
        text: 'Cancelar agendamento',
        style: 'destructive',
        onPress: () => {
          haptic.medium();
          cancelBooking(booking.id);
        },
      },
    ]);
  };

  const confirmClearHistory = () => {
    if (bookings.length === 0) return;
    const message = `Apagar todos os ${bookings.length} agendamentos do histórico? Esta ação não pode ser desfeita.`;
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' && window.confirm(message);
      if (ok) {
        haptic.medium();
        clearBookings();
      }
      return;
    }
    Alert.alert('Limpar histórico', message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar tudo',
        style: 'destructive',
        onPress: () => {
          haptic.medium();
          clearBookings();
        },
      },
    ]);
  };

  const activeBookings = bookings.filter((b) => b.status === 'confirmed');

  return (
    <Screen scroll contentContainerStyle={{ paddingBottom: tabBarHeight + theme.spacing.lg }}>
      <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.lg }}>
        <Text variant="h1">Perfil</Text>
        <Text variant="body" color="muted">
          Sua conta e preferências.
        </Text>
      </View>

      <Card>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="caption" color="muted">
            CONTA
          </Text>
          <Text variant="h3">{user?.name ?? 'Motorista'}</Text>
          <Text variant="body" color="muted">
            {user?.email ?? '—'}
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Badge label={`Plano ${planAccents[plan].label}`} tone="accent" />
          </View>
        </View>
      </Card>

      {profile ? (
        <Card>
          <View style={{ gap: theme.spacing.md }}>
            <View style={{ gap: theme.spacing.xs }}>
              <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
                PLANO SAAS
              </Text>
              <Text variant="h3">Trocar plano</Text>
              <Text variant="body" color="muted">
                A interface se ajusta ao plano: cores, alertas e atalhos exclusivos.
              </Text>
            </View>
            <View style={{ gap: theme.spacing.sm }}>
              {planIds.map((id) => {
                const accent = planAccents[id];
                const selected = id === plan;
                const busy = switchingPlan === id;
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    accessibilityState={{ selected, busy }}
                    accessibilityLabel={`Selecionar plano ${accent.label}`}
                    disabled={busy || (switchingPlan !== null && !selected)}
                    onPress={() => requestPlanSwitch(id)}
                    style={({ pressed }) => [
                      styles.planChip,
                      {
                        backgroundColor: selected ? accent.accentSoft : theme.colors.bgElevated,
                        borderColor: selected ? accent.accent : theme.colors.border,
                        borderRadius: theme.radius.md,
                        paddingHorizontal: theme.spacing.lg,
                        paddingVertical: theme.spacing.md,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: accent.accent,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon
                        name={
                          id === 'agro'
                            ? 'leaf-outline'
                            : id === 'urban'
                              ? 'business-outline'
                              : 'sparkles-outline'
                        }
                        size={16}
                        color="inverse"
                      />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{accent.label}</Text>
                      <Text variant="caption" color="muted">
                        {accent.description}
                      </Text>
                    </View>
                    {selected ? (
                      <Icon name="checkmark-circle" size={22} color="accent" />
                    ) : (
                      <Icon name="chevron-forward" size={18} color="muted" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Card>
      ) : null}

      <View style={{ gap: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="h3">Meus agendamentos</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            {activeBookings.length > 0 ? (
              <Badge label={`${activeBookings.length} ativos`} tone="info" />
            ) : null}
            {bookings.length > 0 ? (
              <Pressable
                onPress={confirmClearHistory}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Limpar histórico de agendamentos"
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: theme.spacing.xs,
                  paddingVertical: theme.spacing.xs,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Icon name="trash-outline" size={16} color="muted" />
                <Text variant="caption" color="muted">Limpar</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {bookings.length === 0 ? (
          <GlassPanel padding="lg" style={{ gap: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
              <Icon name="calendar-outline" size={20} color="muted" />
              <Text variant="bodyStrong">Sem agendamentos por aqui</Text>
            </View>
            <Text variant="body" color="muted">
              Quando você agendar um serviço pelo mapa, ele aparece aqui.
            </Text>
          </GlassPanel>
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {bookings.map((b) => (
              <BookingListItem key={b.id} booking={b} onPress={confirmCancel} />
            ))}
          </View>
        )}
      </View>

      <Button
        label="Sair da conta"
        variant="secondary"
        onPress={handleLogout}
        loading={signingOut}
        fullWidth
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  planChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
});
