import { Pressable, StyleSheet, View } from 'react-native';
import { Badge, Icon, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import type { Coupon, CouponCategory } from './types';

const CATEGORY_ICON: Record<CouponCategory, string> = {
  fuel: 'flash-outline',
  maintenance: 'construct-outline',
  tires: 'ellipse-outline',
};

const CATEGORY_LABEL: Record<CouponCategory, string> = {
  fuel: 'Combustível',
  maintenance: 'Manutenção',
  tires: 'Pneus',
};

function formatExpiry(isoDate: string): string {
  const d = new Date(isoDate);
  return `Válido até ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
}

type Props = {
  coupon: Coupon;
  onPress: (coupon: Coupon) => void;
};

const NOTCH_SIZE = 18;

export function CouponCard({ coupon, onPress }: Props) {
  const theme = useTheme();
  const expired = new Date(coupon.expiresAt) < new Date();
  const unavailable = coupon.redeemed || expired;

  const accentBg = unavailable
    ? theme.colors.textMuted
    : theme.plan.accent;

  return (
    <Pressable
      onPress={() => !unavailable && onPress(coupon)}
      accessibilityRole="button"
      accessibilityLabel={`Cupom ${coupon.title}`}
      style={({ pressed }) => [styles.wrapper, { opacity: unavailable ? 0.5 : pressed ? 0.82 : 1 }]}
    >
      <View
        style={[
          styles.card,
          {
            borderRadius: theme.radius.lg,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.bgElevated,
          },
        ]}
      >
        {/* Left strip */}
        <View
          style={[
            styles.leftStrip,
            {
              backgroundColor: accentBg,
              borderTopLeftRadius: theme.radius.lg,
              borderBottomLeftRadius: theme.radius.lg,
            },
          ]}
        >
          <Icon name={CATEGORY_ICON[coupon.category] as never} size={20} color="inverse" />
          <Text
            variant="h2"
            style={{ color: '#FFF', textAlign: 'center', lineHeight: 28 }}
          >
            {`R$\n${coupon.amount.toFixed(0)}`}
          </Text>
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>
            {CATEGORY_LABEL[coupon.category]}
          </Text>
        </View>

        {/* Divider with perforation notches */}
        <View style={styles.dividerContainer}>
          {/* Top notch */}
          <View
            style={[
              styles.notch,
              {
                top: -NOTCH_SIZE / 2,
                backgroundColor: theme.colors.bgBase,
                width: NOTCH_SIZE,
                height: NOTCH_SIZE,
                borderRadius: NOTCH_SIZE / 2,
              },
            ]}
          />
          <View
            style={[
              styles.dashedLine,
              { borderColor: theme.colors.borderStrong },
            ]}
          />
          {/* Bottom notch */}
          <View
            style={[
              styles.notch,
              {
                bottom: -NOTCH_SIZE / 2,
                backgroundColor: theme.colors.bgBase,
                width: NOTCH_SIZE,
                height: NOTCH_SIZE,
                borderRadius: NOTCH_SIZE / 2,
              },
            ]}
          />
        </View>

        {/* Right content */}
        <View style={[styles.rightContent, { gap: theme.spacing.xs }]}>
          {coupon.isNearby && !unavailable ? (
            <View style={{ alignSelf: 'flex-start' }}>
              <Badge label="Próximo a você" tone="success" />
            </View>
          ) : null}
          {coupon.redeemed ? (
            <View style={{ alignSelf: 'flex-start' }}>
              <Badge label="Utilizado" tone="neutral" />
            </View>
          ) : expired ? (
            <View style={{ alignSelf: 'flex-start' }}>
              <Badge label="Expirado" tone="warn" />
            </View>
          ) : null}
          <Text variant="bodyStrong" numberOfLines={2} style={{ flex: 0 }}>
            {coupon.title}
          </Text>
          <Text variant="caption" color="muted" numberOfLines={1}>
            {coupon.merchant}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Icon name="time-outline" size={12} color="muted" />
            <Text variant="caption" color="muted">
              {formatExpiry(coupon.expiresAt)}
            </Text>
          </View>
          {coupon.distanceKm > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="location-outline" size={12} color="muted" />
              <Text variant="caption" color="muted">
                {coupon.distanceKm < 1
                  ? `${(coupon.distanceKm * 1000).toFixed(0)} m`
                  : `${coupon.distanceKm.toFixed(1)} km`}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
  },
  leftStrip: {
    width: 88,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dividerContainer: {
    width: 1,
    alignItems: 'center',
    position: 'relative',
  },
  dashedLine: {
    flex: 1,
    width: 1,
    borderStyle: 'dashed',
    borderLeftWidth: 1,
  },
  notch: {
    position: 'absolute',
    zIndex: 1,
  },
  rightContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'center',
  },
});
