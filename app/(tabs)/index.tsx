import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Badge, Button, Card, GlassPanel, Icon, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import { planAccents } from '@/theme/plans';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUserStore, type VehicleModel } from '@/stores/useUserStore';
import { useVehicleStore } from '@/stores/useVehicleStore';
import { useAlertsStore } from '@/stores/useAlertsStore';
import { usePlanStore } from '@/stores/usePlanStore';
import type { TelemetryReading } from '@/features/telemetry/simulator';
import { restartTelemetry, useTelemetry } from '@/features/telemetry/useTelemetry';
import { TelemetryKpi, type TelemetryKpiTone } from '@/features/telemetry/TelemetryKpi';
import { AlertCard } from '@/features/telemetry/AlertCard';
import {
  evaluateAlerts,
  fetchPredictedMaintenance,
  type PredictedMaintenance,
} from '@/services/mocks/alertsApi';
import { usePlanFeatures } from '@/features/plan-gates/usePlanFeatures';
import { SmartRouteCard } from '@/features/plan-gates/SmartRouteCard';
import { OneTapSchedulingButton } from '@/features/plan-gates/OneTapSchedulingButton';
import { PlanAccentHaze } from '@/features/plan-gates/PlanAccentHaze';
import { VoiceCommandFab } from '@/features/plan-gates/VoiceCommandFab';
import { haptic } from '@/utils/haptics';

const VEHICLE_LABELS: Record<VehicleModel, string> = {
  ranger: 'Ford Ranger',
  maverick: 'Ford Maverick',
  territory: 'Ford Territory',
  mustang: 'Ford Mustang',
  raptor: 'Ford F-150 Raptor',
};

function lowestTirePsi(reading: TelemetryReading | null): number | null {
  if (!reading) return null;
  const { tirePressurePsi } = reading;
  return Math.min(
    tirePressurePsi.frontLeft,
    tirePressurePsi.frontRight,
    tirePressurePsi.rearLeft,
    tirePressurePsi.rearRight,
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const user = useAuthStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);

  const reading = useTelemetry();
  const alerts = useAlertsStore((s) => s.alerts);
  const syncAlerts = useAlertsStore((s) => s.syncFromEvaluation);
  const dismiss = useAlertsStore((s) => s.dismiss);
  const clearDismissed = useAlertsStore((s) => s.clearDismissed);
  const plan = usePlanStore((s) => s.plan);
  const features = usePlanFeatures();

  const [prediction, setPrediction] = useState<PredictedMaintenance | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!reading) return;
    syncAlerts(evaluateAlerts(reading, plan));
  }, [reading, syncAlerts, plan]);

  useEffect(() => {
    if (!reading || prediction) return;
    let cancelled = false;
    fetchPredictedMaintenance(reading).then((res) => {
      if (!cancelled) setPrediction(res);
    });
    return () => {
      cancelled = true;
    };
  }, [reading, prediction]);

  const onRefresh = useCallback(async () => {
    haptic.light();
    setRefreshing(true);
    clearDismissed();
    restartTelemetry();
    const seed = useVehicleStore.getState().reading;
    if (seed) {
      const next = await fetchPredictedMaintenance(seed);
      setPrediction(next);
    }
    setRefreshing(false);
  }, [clearDismissed]);

  const planLabel = profile ? planAccents[profile.plan].label : 'Sem plano';
  const greetingName = user?.name?.split(' ')[0] ?? 'Motorista';
  const vehicleLabel = profile ? VEHICLE_LABELS[profile.vehicleModel] : 'Veículo';

  const kpis = useMemo(() => {
    if (!reading) return [];
    const minPsi = lowestTirePsi(reading) ?? 0;
    const tireTone: TelemetryKpiTone = minPsi < 28 ? 'warn' : 'neutral';
    const tempTone: TelemetryKpiTone =
      reading.engineTempC >= 108
        ? 'critical'
        : reading.engineTempC >= 100
          ? 'warn'
          : 'neutral';
    const fuelTone: TelemetryKpiTone = reading.fuelLevelPct < 15 ? 'warn' : 'neutral';
    const batteryTone: TelemetryKpiTone =
      reading.batteryVolts < 11.8 ? 'critical' : 'neutral';

    return [
      {
        key: 'odometer',
        icon: 'speedometer-outline' as const,
        label: 'Hodômetro',
        value: reading.odometerKm.toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
        unit: 'km',
        hint: 'Registrado agora',
        tone: 'neutral' as TelemetryKpiTone,
      },
      {
        key: 'tires',
        icon: 'ellipse-outline' as const,
        label: 'Pneus (mín.)',
        value: minPsi.toFixed(1),
        unit: 'PSI',
        hint: '4 sensores OBD2',
        tone: tireTone,
      },
      {
        key: 'temp',
        icon: 'thermometer-outline' as const,
        label: 'Temp. motor',
        value: reading.engineTempC.toFixed(1),
        unit: '°C',
        hint: 'Faixa ideal 80–95°C',
        tone: tempTone,
      },
      {
        key: 'fuel',
        icon: 'water-outline' as const,
        label: 'Combustível',
        value: reading.fuelLevelPct.toFixed(0),
        unit: '%',
        hint: 'Autonomia estimada',
        tone: fuelTone,
      },
      {
        key: 'battery',
        icon: 'battery-half-outline' as const,
        label: 'Bateria',
        value: reading.batteryVolts.toFixed(2),
        unit: 'V',
        hint: 'Tensão em repouso',
        tone: batteryTone,
      },
    ];
  }, [reading]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: theme.colors.bgBase }}
    >
      <PlanAccentHaze />
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: tabBarHeight + theme.spacing.lg,
          gap: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.plan.accent}
            colors={[theme.plan.accent]}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <Text variant="caption" color="muted">
              Bem-vindo de volta
            </Text>
            <Text variant="h1">Olá, {greetingName}</Text>
            <Text variant="caption" color="muted">
              {vehicleLabel}
            </Text>
          </View>
          <Badge label={planLabel} tone="accent" />
        </View>

        <Card padding="lg">
          <View style={{ gap: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
              <Icon name="sparkles-outline" size={18} color="accent" />
              <Text
                variant="caption"
                color="accent"
                style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}
              >
                Previsão por IA
              </Text>
            </View>
            <Text variant="h2">
              {prediction?.service ?? 'Calculando próxima manutenção…'}
            </Text>
            {prediction ? (
              <View style={{ flexDirection: 'row', gap: theme.spacing.lg, marginTop: theme.spacing.xs }}>
                <View>
                  <Text variant="caption" color="muted">
                    Estimativa
                  </Text>
                  <Text variant="body">{prediction.estimatedDate}</Text>
                </View>
                <View>
                  <Text variant="caption" color="muted">
                    Confiança
                  </Text>
                  <Text variant="body">{Math.round(prediction.confidence * 100)}%</Text>
                </View>
              </View>
            ) : null}
            <View style={{ marginTop: theme.spacing.sm, gap: theme.spacing.sm }}>
              {features.has('oneTapScheduling') ? (
                <OneTapSchedulingButton />
              ) : (
                <Button
                  label="Agendar serviço"
                  iconLeft={<Icon name="calendar-outline" size={18} color="inverse" />}
                  onPress={() => router.push('/(tabs)/map')}
                  fullWidth
                />
              )}
            </View>
          </View>
        </Card>

        {features.has('smartRoute') ? <SmartRouteCard /> : null}

        <View style={{ gap: theme.spacing.sm }}>
          <View style={styles.sectionHeader}>
            <Text variant="h3">Telemetria em tempo real</Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/vehicle/[id]',
                  params: { id: profile?.vehicleModel ?? 'main' },
                })
              }
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Abrir veículo em 3D"
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 4,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Icon name="cube-outline" size={14} color="accent" />
              <Text variant="caption" color="accent" style={{ fontWeight: '600' }}>
                Ver em 3D
              </Text>
              <Icon name="chevron-forward" size={14} color="accent" />
            </Pressable>
          </View>
          {kpis.length === 0 ? (
            <GlassPanel padding="lg">
              <Text variant="body" color="muted">
                Aguardando primeira leitura do simulador OBD2…
              </Text>
            </GlassPanel>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: theme.spacing.md, paddingRight: theme.spacing.sm }}
            >
              {kpis.map((kpi) => (
                <TelemetryKpi
                  key={kpi.key}
                  icon={kpi.icon}
                  label={kpi.label}
                  value={kpi.value}
                  unit={kpi.unit}
                  hint={kpi.hint}
                  tone={kpi.tone}
                />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <View style={styles.sectionHeader}>
            <Text variant="h3">Alertas</Text>
            {alerts.length > 0 ? <Badge label={`${alerts.length} ativos`} tone="warn" /> : null}
          </View>
          {alerts.length === 0 ? (
            <GlassPanel padding="lg" style={{ gap: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                <Icon name="checkmark-circle-outline" size={20} color="success" />
                <Text variant="h3">Tudo certo por aqui</Text>
              </View>
              <Text variant="body" color="muted">
                Nenhum alerta crítico nas últimas leituras. Continue dirigindo com tranquilidade.
              </Text>
            </GlassPanel>
          ) : (
            <View style={{ gap: theme.spacing.md }}>
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onDismiss={dismiss} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      {features.has('voiceCommand') ? <VoiceCommandFab /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
