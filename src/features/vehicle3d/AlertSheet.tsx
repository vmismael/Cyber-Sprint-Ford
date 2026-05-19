import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Badge, Button, GlassPanel, Icon, Text, type IconName } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import type { HotspotCategory, HotspotSeverity, HotspotState } from './derive';

const ICON_BY_CATEGORY: Record<HotspotCategory, IconName> = {
  'tire-fl': 'ellipse-outline',
  'tire-fr': 'ellipse-outline',
  'tire-rl': 'ellipse-outline',
  'tire-rr': 'ellipse-outline',
  engine: 'thermometer-outline',
  battery: 'battery-half-outline',
};

const SEVERITY_LABEL: Record<HotspotSeverity, string> = {
  idle: 'Saudável',
  warn: 'Atenção',
  critical: 'Crítico',
};

const EXIT_DURATION_MS = 280;

export type AlertSheetProps = {
  hotspot: HotspotState | null;
  onClose: () => void;
  onSchedule: () => void;
};

export function AlertSheet({ hotspot, onClose, onSchedule }: AlertSheetProps) {
  const theme = useTheme();
  const [data, setData] = useState<HotspotState | null>(hotspot);
  const visible = hotspot !== null;

  useEffect(() => {
    if (hotspot) {
      setData(hotspot);
      return;
    }
    const t = setTimeout(() => setData(null), EXIT_DURATION_MS);
    return () => clearTimeout(t);
  }, [hotspot]);

  return (
    <Modal
      visible={data !== null}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {data ? (
        <View style={styles.fill}>
          {visible ? (
            <>
              <Animated.View
                entering={FadeIn.duration(180)}
                exiting={FadeOut.duration(EXIT_DURATION_MS - 80)}
                style={[styles.fill, styles.backdrop, { backgroundColor: theme.colors.overlay }]}
              >
                <Pressable
                  style={styles.fill}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar detalhes do alerta"
                />
              </Animated.View>

              <Animated.View
                entering={SlideInDown.duration(260)}
                exiting={SlideOutDown.duration(EXIT_DURATION_MS - 80)}
                style={[styles.sheetWrapper, { paddingHorizontal: theme.spacing.lg }]}
                pointerEvents="box-none"
              >
                <GlassPanel
                  padding="xl"
                  intensity={theme.blur.modal}
                  style={{ gap: theme.spacing.md }}
                >
                  <View style={styles.header}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: theme.radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          data.severity === 'critical'
                            ? `${theme.colors.alertCritical}26`
                            : data.severity === 'warn'
                              ? `${theme.colors.alertWarn}26`
                              : theme.colors.bgElevated,
                      }}
                    >
                      <Icon
                        name={ICON_BY_CATEGORY[data.category]}
                        size={22}
                        color={
                          data.severity === 'critical'
                            ? 'critical'
                            : data.severity === 'warn'
                              ? 'warn'
                              : 'muted'
                        }
                      />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        variant="caption"
                        color={
                          data.severity === 'critical'
                            ? 'critical'
                            : data.severity === 'warn'
                              ? 'warn'
                              : 'muted'
                        }
                        style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
                      >
                        {SEVERITY_LABEL[data.severity]}
                      </Text>
                      <Text variant="h2">{data.label}</Text>
                    </View>
                    <Pressable
                      onPress={onClose}
                      hitSlop={12}
                      accessibilityRole="button"
                      accessibilityLabel="Fechar"
                      style={{
                        width: theme.touchTarget.min,
                        height: theme.touchTarget.min,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="close" size={22} color="muted" />
                    </Pressable>
                  </View>

                  <Text variant="body" color="muted">
                    {data.description}
                  </Text>

                  {data.severity !== 'idle' ? (
                    <View style={styles.metaRow}>
                      <Badge
                        label={
                          data.severity === 'critical' ? 'Ação imediata' : 'Monitorar'
                        }
                        tone={data.severity === 'critical' ? 'critical' : 'warn'}
                      />
                      <Text variant="caption" color="muted">
                        Origem: telemetria OBD2
                      </Text>
                    </View>
                  ) : null}

                  <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
                    <Button
                      label="Agendar serviço"
                      iconLeft={<Icon name="calendar-outline" size={18} color="inverse" />}
                      onPress={onSchedule}
                      fullWidth
                    />
                    <Button label="Fechar" variant="ghost" onPress={onClose} fullWidth />
                  </View>
                </GlassPanel>
              </Animated.View>
            </>
          ) : null}
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});
