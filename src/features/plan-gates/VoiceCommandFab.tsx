import { useEffect, useState } from 'react';
import { Alert, Keyboard, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  FadeIn,
  FadeOut,
  type SharedValue,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { GlassPanel, Icon, Text, Button, type IconName } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import { haptic } from '@/utils/haptics';
import { useTelemetry } from '@/features/telemetry/useTelemetry';
import { useUserStore } from '@/stores/useUserStore';
import { oneTapReasonMessage, runOneTapScheduling } from './oneTapScheduling';

type Mode = 'listening' | 'response-battery';

const BATTERY_LOW_VOLTS = 11.8;

type CommandKey = 'schedule' | 'battery' | 'map' | 'vehicle3d';

type CommandSpec = {
  key: CommandKey;
  label: string;
  icon: IconName;
};

const COMMANDS: CommandSpec[] = [
  { key: 'schedule', label: 'Agendar revisão', icon: 'flash-outline' },
  { key: 'battery', label: 'Como está minha bateria?', icon: 'battery-half-outline' },
  { key: 'map', label: 'Abrir mapa', icon: 'map-outline' },
  { key: 'vehicle3d', label: 'Ver veículo em 3D', icon: 'cube-outline' },
];

function notifyError(message: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message);
    return;
  }
  Alert.alert('Não foi possível agendar agora', message);
}

export function VoiceCommandFab() {
  const theme = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const reading = useTelemetry();
  const vehicleModel = useUserStore((s) => s.profile?.vehicleModel);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('listening');
  const [busy, setBusy] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const pulse = useSharedValue(1);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    const animating = open && mode === 'listening';
    if (animating) {
      pulse.value = withRepeat(
        withTiming(1.25, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = 1;
    }
    return () => cancelAnimation(pulse);
  }, [open, mode, pulse]);

  if (keyboardOpen) return null;

  const closeModal = () => {
    setOpen(false);
    setMode('listening');
    setBusy(false);
  };

  const handleFabPress = () => {
    haptic.medium();
    setMode('listening');
    setOpen(true);
  };

  const handleCommand = async (key: CommandKey) => {
    if (busy) return;
    haptic.medium();

    if (key === 'battery') {
      setMode('response-battery');
      haptic.success();
      return;
    }

    if (key === 'map') {
      closeModal();
      router.push('/(tabs)/map');
      return;
    }

    if (key === 'vehicle3d') {
      closeModal();
      router.push({
        pathname: '/vehicle/[id]',
        params: { id: vehicleModel ?? 'main' },
      });
      return;
    }

    if (key === 'schedule') {
      setBusy(true);
      const result = await runOneTapScheduling('revision');
      setBusy(false);
      if (result.ok) {
        closeModal();
      } else {
        haptic.warning();
        notifyError(oneTapReasonMessage(result.reason));
      }
    }
  };

  const fabBottom = tabBarHeight + theme.spacing.lg;

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[StyleSheet.absoluteFill, styles.layer]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Assistente Premium"
          onPress={handleFabPress}
          style={({ pressed }) => [
            styles.fab,
            {
              right: theme.spacing.lg,
              bottom: fabBottom,
              backgroundColor: theme.plan.accent,
              shadowColor: theme.plan.accent,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Icon name="sparkles" size={24} color="inverse" />
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(160)}
          style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={styles.sheetWrap}>
            <GlassPanel padding="lg" style={{ gap: theme.spacing.lg }}>
              {mode === 'listening' ? (
                <ListeningPanel
                  pulse={pulse}
                  busy={busy}
                  onCommand={handleCommand}
                  onClose={closeModal}
                />
              ) : (
                <BatteryResponsePanel
                  volts={reading?.batteryVolts ?? null}
                  onClose={closeModal}
                />
              )}
            </GlassPanel>
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}

type ListeningPanelProps = {
  pulse: SharedValue<number>;
  busy: boolean;
  onCommand: (key: CommandKey) => void;
  onClose: () => void;
};

function ListeningPanel({ pulse, busy, onCommand, onClose }: ListeningPanelProps) {
  const theme = useTheme();
  const waveformStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  return (
    <>
      <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
        <Animated.View
          style={[
            styles.waveform,
            waveformStyle,
            { backgroundColor: theme.plan.accentSoft, borderColor: theme.plan.accent },
          ]}
        >
          <Icon name="sparkles" size={42} color="accent" />
        </Animated.View>
        <View style={{ gap: theme.spacing.xs, alignItems: 'center' }}>
          <Text variant="h2">O que você precisa?</Text>
          <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
            Toque em um comando abaixo.
          </Text>
        </View>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        {COMMANDS.map((cmd) => (
          <CommandChip
            key={cmd.key}
            label={cmd.label}
            icon={cmd.icon}
            loading={busy && cmd.key === 'schedule'}
            disabled={busy && cmd.key !== 'schedule'}
            onPress={() => onCommand(cmd.key)}
          />
        ))}
      </View>

      <Button label="Encerrar" variant="ghost" onPress={onClose} fullWidth disabled={busy} />
    </>
  );
}

type CommandChipProps = {
  label: string;
  icon: IconName;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function CommandChip({ label, icon, loading, disabled, onPress }: CommandChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      hitSlop={6}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.plan.accent + '40',
        backgroundColor: theme.colors.bgElevated,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: theme.radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.plan.accentSoft,
        }}
      >
        <Icon name={icon} size={18} color="accent" />
      </View>
      <Text variant="bodyStrong" style={{ flex: 1 }}>
        {loading ? 'Preparando…' : label}
      </Text>
      <Icon name="chevron-forward" size={18} color="muted" />
    </Pressable>
  );
}

type BatteryResponsePanelProps = {
  volts: number | null;
  onClose: () => void;
};

function BatteryResponsePanel({ volts, onClose }: BatteryResponsePanelProps) {
  const theme = useTheme();
  const ready = volts !== null;
  const low = volts !== null && volts < BATTERY_LOW_VOLTS;
  const statusLabel = low ? 'Baixa' : 'Normal';
  const statusColor = low ? theme.colors.alertWarn : theme.colors.success;

  return (
    <>
      <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
        <View
          style={[
            styles.waveform,
            { backgroundColor: theme.plan.accentSoft, borderColor: theme.plan.accent },
          ]}
        >
          <Icon name="battery-half-outline" size={42} color="accent" />
        </View>
        <View style={{ gap: theme.spacing.xs, alignItems: 'center' }}>
          <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Bateria
          </Text>
          {ready ? (
            <>
              <Text variant="h1">{volts.toFixed(2)}V</Text>
              <Text variant="bodyStrong" style={{ color: statusColor }}>
                {statusLabel}
              </Text>
            </>
          ) : (
            <Text variant="body" color="muted">
              Lendo bateria…
            </Text>
          )}
          <Text variant="caption" color="muted" style={{ textAlign: 'center' }}>
            Faixa saudável: 12.4V–14.6V em repouso.
          </Text>
        </View>
      </View>

      <Button label="Fechar" variant="primary" onPress={onClose} fullWidth />
    </>
  );
}

const styles = StyleSheet.create({
  layer: {
    overflow: 'visible',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    padding: 16,
  },
  waveform: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
