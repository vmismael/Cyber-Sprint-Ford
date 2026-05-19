import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Button, GlassPanel, Icon, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import { useWalletStore } from '@/stores/useWalletStore';
import { FuelStationModal } from '@/features/cashback/FuelStationModal';
import { MockQRCode } from '@/features/cashback/MockQRCode';
import type { CouponCategory } from '@/features/cashback/types';

const CATEGORY_LABEL: Record<CouponCategory, string> = {
  fuel: 'Combustível',
  maintenance: 'Manutenção',
  tires: 'Pneus',
};

const CATEGORY_ICON: Record<CouponCategory, string> = {
  fuel: 'flash-outline',
  maintenance: 'construct-outline',
  tires: 'ellipse-outline',
};

const TONE_MAP: Record<CouponCategory, 'info' | 'warn' | 'accent'> = {
  fuel: 'info',
  maintenance: 'accent',
  tires: 'warn',
};

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatFullDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function CouponDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const coupons = useWalletStore((s) => s.coupons);
  const coupon = coupons.find((c) => c.id === (Array.isArray(id) ? id[0] : id));

  const [fuelModalOpen, setFuelModalOpen] = useState(false);

  function handleRedeemed() {
    // Store already updates balance + celebrateVisible
    // Navigate back so user sees the celebration on wallet screen
    setTimeout(() => router.back(), 120);
  }

  if (!coupon) {
    return (
      <View style={[styles.notFound, { paddingTop: insets.top + 24 }]}>
        <Icon name="help-circle-outline" size={40} color="muted" />
        <Text variant="body" color="muted" style={{ marginTop: 16, textAlign: 'center' }}>
          Cupom não encontrado.
        </Text>
        <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  const expired = new Date(coupon.expiresAt) < new Date();
  const unavailable = coupon.redeemed || expired;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgBase }]}>
      {/* Custom back header */}
      <View
        style={[
          styles.backHeader,
          { paddingTop: insets.top + 8, paddingHorizontal: theme.spacing.lg },
        ]}
      >
        <Button
          variant="ghost"
          label="Voltar"
          iconLeft={<Icon name="chevron-back-outline" size={20} color="muted" />}
          onPress={() => router.back()}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.xxxl,
          gap: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Category + status badges */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
          <Badge
            label={CATEGORY_LABEL[coupon.category]}
            tone={TONE_MAP[coupon.category]}
          />
          {coupon.isNearby && !unavailable ? (
            <Badge label="Próximo a você" tone="success" />
          ) : null}
          {coupon.redeemed ? <Badge label="Utilizado" tone="neutral" /> : null}
          {expired && !coupon.redeemed ? <Badge label="Expirado" tone="warn" /> : null}
        </View>

        {/* Merchant + title */}
        <View style={{ gap: theme.spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <Icon name={CATEGORY_ICON[coupon.category] as never} size={20} color="accent" />
            <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {coupon.merchant}
            </Text>
          </View>
          <Text variant="h1">{coupon.title}</Text>
        </View>

        {/* Amount highlight */}
        <GlassPanel
          padding="xl"
          intensity={theme.blur.panel}
          style={{ alignItems: 'center', gap: theme.spacing.sm, borderColor: `${theme.plan.accent}40` }}
        >
          <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Valor do benefício
          </Text>
          <Text
            variant="h1"
            style={{ fontSize: 48, lineHeight: 56, color: theme.plan.accent, fontFamily: 'Inter_700Bold' }}
          >
            R$ {formatBRL(coupon.amount)}
          </Text>
        </GlassPanel>

        {/* Description */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="bodyStrong">Descrição</Text>
          <Text variant="body" color="muted">
            {coupon.description}
          </Text>
        </View>

        {/* Meta info */}
        <View style={[styles.metaRow, { borderColor: theme.colors.border }]}>
          <View style={styles.metaItem}>
            <Icon name="time-outline" size={16} color="muted" />
            <View>
              <Text variant="caption" color="muted">Validade</Text>
              <Text variant="label">{formatFullDate(coupon.expiresAt)}</Text>
            </View>
          </View>
          {coupon.distanceKm > 0 ? (
            <View style={[styles.metaItem, { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: theme.colors.border, paddingLeft: theme.spacing.lg }]}>
              <Icon name="location-outline" size={16} color="muted" />
              <View>
                <Text variant="caption" color="muted">Distância</Text>
                <Text variant="label">
                  {coupon.distanceKm < 1
                    ? `${(coupon.distanceKm * 1000).toFixed(0)} m`
                    : `${coupon.distanceKm.toFixed(1)} km`}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* QR Code mock */}
        <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
          <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Código de resgate
          </Text>
          <MockQRCode seed={coupon.id} size={140} />
          <Text variant="caption" color="muted">
            Apresente este código no estabelecimento
          </Text>
        </View>

        {/* Terms */}
        <View
          style={[
            styles.termsBox,
            { borderColor: theme.colors.border, borderRadius: theme.radius.md },
          ]}
        >
          <Text variant="caption" color="muted" style={{ fontFamily: 'Inter_600SemiBold' }}>
            Termos e condições
          </Text>
          <Text variant="caption" color="muted" style={{ marginTop: 4 }}>
            Cupom válido apenas uma vez por CPF. Não cumulativo com outras promoções. Sujeito a disponibilidade de estoque.
            Ford se reserva o direito de encerrar a promoção a qualquer momento.
          </Text>
        </View>

        {/* CTAs */}
        {!unavailable ? (
          <View style={{ gap: theme.spacing.sm }}>
            {coupon.category === 'fuel' ? (
              <Button
                label="Resgatar em combustível"
                iconLeft={<Icon name="flash-outline" size={18} color="inverse" />}
                onPress={() => setFuelModalOpen(true)}
                fullWidth
              />
            ) : null}
            {coupon.category === 'maintenance' || coupon.category === 'tires' ? (
              <Button
                label="Agendar serviço para usar"
                iconLeft={<Icon name="calendar-outline" size={18} color="inverse" />}
                onPress={() => router.push('/(tabs)/map' as never)}
                fullWidth
              />
            ) : null}
            <Button label="Voltar" variant="ghost" onPress={() => router.back()} fullWidth />
          </View>
        ) : (
          <Button label="Voltar" variant="ghost" onPress={() => router.back()} fullWidth />
        )}
      </ScrollView>

      <FuelStationModal
        couponId={coupon.category === 'fuel' && fuelModalOpen ? coupon.id : null}
        onClose={() => setFuelModalOpen(false)}
        onRedeemed={handleRedeemed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  backHeader: { paddingBottom: 8 },
  metaRow: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  termsBox: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
});
