import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Badge, Button, GlassPanel, Icon, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDistanceKm } from '@/utils/distance';
import { SERVICE_LABEL, type Dealer } from '@/types/scheduling';

const EXIT_DURATION_MS = 280;

export type DealerSheetProps = {
  dealer: Dealer | null;
  onClose: () => void;
  onSchedule: (dealerId: string) => void;
};

export function DealerSheet({ dealer, onClose, onSchedule }: DealerSheetProps) {
  const theme = useTheme();
  const [data, setData] = useState<Dealer | null>(dealer);
  const visible = dealer !== null;

  useEffect(() => {
    if (dealer) {
      setData(dealer);
      return;
    }
    const t = setTimeout(() => setData(null), EXIT_DURATION_MS);
    return () => clearTimeout(t);
  }, [dealer]);

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
                  accessibilityLabel="Fechar detalhes da concessionária"
                />
              </Animated.View>

              <Animated.View
                entering={SlideInDown.duration(280)}
                exiting={SlideOutDown.duration(EXIT_DURATION_MS - 80)}
                style={[styles.sheetWrapper, { paddingHorizontal: theme.spacing.lg }]}
                pointerEvents="box-none"
              >
                <GlassPanel
                  padding="xl"
                  intensity={theme.blur.modal}
                  style={{ gap: theme.spacing.md }}
                >
                  <View
                    style={{
                      alignSelf: 'center',
                      width: 40,
                      height: 4,
                      borderRadius: theme.radius.full,
                      backgroundColor: theme.colors.borderStrong,
                      marginBottom: theme.spacing.xs,
                    }}
                  />

                  <View style={styles.header}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                        <Text variant="h2">{data.name}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <Icon name="star" size={14} color="warn" />
                          <Text variant="caption" color="muted">
                            {data.rating.toFixed(1)}
                          </Text>
                        </View>
                        {data.distanceKm !== undefined ? (
                          <>
                            <Text variant="caption" color="muted">·</Text>
                            <Text variant="caption" color="muted">
                              {formatDistanceKm(data.distanceKm)}
                            </Text>
                          </>
                        ) : null}
                      </View>
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

                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm }}>
                    <Icon name="location-outline" size={16} color="muted" />
                    <Text variant="body" color="muted" style={{ flex: 1 }}>
                      {data.address}
                    </Text>
                  </View>

                  {data.promotions.length > 0 ? (
                    <View style={{ gap: theme.spacing.xs }}>
                      <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
                        Promoções ativas
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: theme.spacing.sm }}
                      >
                        {data.promotions.map((p) => (
                          <Badge key={p.id} label={p.label} tone="accent" />
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}

                  <View style={{ gap: theme.spacing.xs }}>
                    <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
                      Serviços oferecidos
                    </Text>
                    <View style={styles.serviceRow}>
                      {data.services.map((s) => (
                        <Badge key={s} label={SERVICE_LABEL[s]} tone="neutral" />
                      ))}
                    </View>
                  </View>

                  <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
                    <Button
                      label="Agendar serviço"
                      iconLeft={<Icon name="calendar-outline" size={18} color="inverse" />}
                      onPress={() => onSchedule(data.id)}
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
  fill: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheetWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
