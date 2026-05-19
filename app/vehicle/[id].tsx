import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Badge, GlassPanel, Icon, Text } from '@/components';
import { Vehicle3DSkeleton } from '@/components/Vehicle3DSkeleton';
import { useTheme } from '@/theme/ThemeProvider';
import { haptic } from '@/utils/haptics';
import { useUserStore, type VehicleModel } from '@/stores/useUserStore';
import { useAlertsStore } from '@/stores/useAlertsStore';
import { useTelemetry } from '@/features/telemetry/useTelemetry';
import { evaluateAlerts } from '@/services/mocks/alertsApi';
import { AlertSheet } from '@/features/vehicle3d/AlertSheet';

const Scene = lazy(() => import('@/features/vehicle3d/SceneLazyEntry'));
import {
  activeHotspotsCount,
  deriveHotspots,
  type HotspotCategory,
  type HotspotState,
} from '@/features/vehicle3d/derive';
import type { CameraPresetId } from '@/features/vehicle3d/cameraPresets';

const VEHICLE_LABELS: Record<VehicleModel, string> = {
  ranger: 'Ford Ranger',
  maverick: 'Ford Maverick',
  territory: 'Ford Territory',
  mustang: 'Ford Mustang',
  raptor: 'Ford F-150 Raptor',
};

const PRESETS: { id: CameraPresetId; label: string; icon: 'car-sport-outline' | 'car-outline' | 'navigate-outline' }[] = [
  { id: 'front', label: 'Frontal', icon: 'car-sport-outline' },
  { id: 'side', label: 'Lateral', icon: 'car-outline' },
  { id: 'top', label: 'Superior', icon: 'navigate-outline' },
];

export default function VehicleDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const profile = useUserStore((s) => s.profile);

  const reading = useTelemetry();
  const syncAlerts = useAlertsStore((s) => s.syncFromEvaluation);

  const [presetId, setPresetId] = useState<CameraPresetId | null>(null);
  const [activePreset, setActivePreset] = useState<CameraPresetId | null>(null);
  const [selected, setSelected] = useState<HotspotState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 320);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!reading) return;
    syncAlerts(evaluateAlerts(reading));
  }, [reading, syncAlerts]);

  const hotspots = useMemo(() => deriveHotspots(reading), [reading]);
  const activeCount = activeHotspotsCount(hotspots);

  const idParam = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const profileLabel = profile ? VEHICLE_LABELS[profile.vehicleModel] : null;
  const fallbackLabel =
    idParam && idParam in VEHICLE_LABELS
      ? VEHICLE_LABELS[idParam as VehicleModel]
      : 'Veículo';
  const vehicleLabel = profileLabel ?? fallbackLabel;

  const handleHotspotPress = useCallback(
    (category: HotspotCategory) => {
      const match = hotspots.find((h) => h.category === category);
      if (match) {
        haptic.selection();
        setSelected(match);
      }
    },
    [hotspots],
  );

  useEffect(() => {
    if (!selected) return;
    const updated = hotspots.find((h) => h.category === selected.category);
    if (updated && updated !== selected) setSelected(updated);
  }, [hotspots, selected]);

  const handlePreset = useCallback((id: CameraPresetId) => {
    setPresetId(id);
    setActivePreset(id);
  }, []);

  const handlePresetReached = useCallback(() => {
    setPresetId(null);
  }, []);

  const handleSchedule = useCallback(() => {
    setSelected(null);
    router.push('/(tabs)/map');
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgBase }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.canvasLayer}>
        {ready ? (
          <Suspense fallback={<Vehicle3DSkeleton />}>
            <Animated.View entering={FadeIn.duration(260)} style={styles.fill}>
              <Scene
                hotspots={hotspots}
                presetId={presetId}
                onHotspotPress={handleHotspotPress}
                onPresetReached={handlePresetReached}
              />
            </Animated.View>
          </Suspense>
        ) : (
          <Vehicle3DSkeleton />
        )}
      </View>

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.topOverlay} pointerEvents="box-none">
        <View style={[styles.topRow, { padding: theme.spacing.lg, gap: theme.spacing.sm }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={[
              styles.iconButton,
              {
                backgroundColor: theme.colors.bgElevated,
                borderColor: theme.colors.border,
                width: theme.touchTarget.comfortable,
                height: theme.touchTarget.comfortable,
                borderRadius: theme.radius.full,
              },
            ]}
          >
            <Icon name="chevron-back" size={22} color="primary" />
          </Pressable>

          <View style={{ flex: 1, gap: 2 }}>
            <Text
              variant="caption"
              color="muted"
              style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
            >
              Modelo 3D
            </Text>
            <Text variant="h2">{vehicleLabel}</Text>
          </View>

          {activeCount > 0 ? (
            <Badge
              label={`${activeCount} ${activeCount === 1 ? 'alerta' : 'alertas'}`}
              tone="warn"
            />
          ) : (
            <Badge label="Sem alertas" tone="success" />
          )}
        </View>
      </SafeAreaView>

      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.bottomOverlay} pointerEvents="box-none">
        <View style={[styles.bottomStack, { padding: theme.spacing.lg, gap: theme.spacing.md }]}>
          <GlassPanel padding="md" style={{ gap: theme.spacing.xs }}>
            <Text
              variant="caption"
              color="muted"
              style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}
            >
              Vistas
            </Text>
            <View style={styles.presetRow}>
              {PRESETS.map((p) => {
                const isActive = activePreset === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => handlePreset(p.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Vista ${p.label}`}
                    style={({ pressed }) => [
                      styles.presetButton,
                      {
                        minHeight: theme.touchTarget.min,
                        borderRadius: theme.radius.md,
                        borderColor: isActive ? theme.plan.accent : theme.colors.border,
                        backgroundColor: isActive
                          ? theme.plan.accentSoft
                          : theme.colors.bgElevated,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Icon name={p.icon} size={18} color={isActive ? 'accent' : 'primary'} />
                    <Text
                      variant="caption"
                      color={isActive ? 'accent' : 'primary'}
                      style={{ fontWeight: '600' }}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassPanel>

          <GlassPanel padding="md" style={{ gap: theme.spacing.xs }}>
            <View style={styles.hintRow}>
              <Icon name="information-circle-outline" size={16} color="muted" />
              <Text variant="caption" color="muted">
                Arraste para girar · pinça para zoom · toque nos hotspots
              </Text>
            </View>
          </GlassPanel>
        </View>
      </SafeAreaView>

      <AlertSheet
        hotspot={selected}
        onClose={() => setSelected(null)}
        onSchedule={handleSchedule}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  canvasLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomStack: {
    width: '100%',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
