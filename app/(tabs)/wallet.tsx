import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { GlassPanel, Icon, Screen, Text } from '@/components';
import { EmptyState } from '@/components/state';
import { useTheme } from '@/theme/ThemeProvider';
import { useWalletStore } from '@/stores/useWalletStore';
import { usePlanStore } from '@/stores/usePlanStore';
import { CouponCard } from '@/features/cashback/CouponCard';
import type { Coupon, Transaction } from '@/features/cashback/types';

type ActiveTab = 'extrato' | 'cupons';

const CATEGORY_ICON: Record<string, string> = {
  fuel: 'flash-outline',
  maintenance: 'construct-outline',
  tires: 'ellipse-outline',
  other: 'options-outline',
  redemption: 'gift-outline',
};

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

function TransactionRow({ item }: { item: Transaction }) {
  const theme = useTheme();
  const isCredit = item.type === 'credit';
  return (
    <View
      style={[
        styles.txRow,
        {
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.txIcon,
          {
            backgroundColor: isCredit
              ? `${theme.colors.success}26`
              : `${theme.colors.alertWarn}26`,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <Icon
          name={(CATEGORY_ICON[item.category] ?? 'receipt-outline') as never}
          size={18}
          color={isCredit ? 'success' : 'warn'}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {item.description}
        </Text>
        {item.dealerName ? (
          <Text variant="caption" color="muted" numberOfLines={1}>
            {item.dealerName}
          </Text>
        ) : null}
        <Text variant="caption" color="muted">
          {formatDate(item.date)}
        </Text>
      </View>
      <Text
        variant="bodyStrong"
        style={{ color: isCredit ? theme.colors.success : theme.colors.alertWarn }}
      >
        {isCredit ? '+' : '-'} R$ {formatBRL(item.amount)}
      </Text>
    </View>
  );
}

const CELEBRATE_DOTS = [
  { x: -60, y: -40, color: '#30A46C' },
  { x: 60, y: -40, color: '#FFB020' },
  { x: -80, y: 10, color: '#1F6FEB' },
  { x: 80, y: 10, color: '#D4AF37' },
  { x: -50, y: 60, color: '#E5484D' },
  { x: 50, y: 60, color: '#30A46C' },
  { x: 0, y: -70, color: '#D97706' },
  { x: 0, y: 80, color: '#6FA3FF' },
];

export default function WalletScreen() {
  const theme = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const planId = usePlanStore((s) => s.plan);

  const balance = useWalletStore((s) => s.balance);
  const transactions = useWalletStore((s) => s.transactions);
  const coupons = useWalletStore((s) => s.coupons);
  const loading = useWalletStore((s) => s.loading);
  const error = useWalletStore((s) => s.error);
  const celebrateVisible = useWalletStore((s) => s.celebrateVisible);
  const fetchWalletFn = useWalletStore((s) => s.fetchWallet);
  const fetchCouponsFn = useWalletStore((s) => s.fetchCoupons);
  const dismissCelebrate = useWalletStore((s) => s.dismissCelebrate);

  const [activeTab, setActiveTab] = useState<ActiveTab>('extrato');
  const [displayBalance, setDisplayBalance] = useState(0);
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const tabIndicator = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const celebrateOpacity = useSharedValue(0);
  const celebrateScale = useSharedValue(0.5);
  const hasAnimatedBalance = useRef(false);

  useEffect(() => {
    fetchWalletFn();
    fetchCouponsFn(planId);
  }, [fetchWalletFn, fetchCouponsFn, planId]);

  // Animated balance counter
  useEffect(() => {
    if (balance <= 0) return;
    const target = balance;
    const STEPS = 50;
    const MS = 1000 / STEPS;
    let current = 0;
    const inc = target / STEPS;
    const timer = setInterval(() => {
      current = Math.min(current + inc, target);
      setDisplayBalance(current);
      if (current >= target) {
        clearInterval(timer);
        if (!hasAnimatedBalance.current) {
          hasAnimatedBalance.current = true;
          cardScale.value = withSequence(
            withTiming(1.025, { duration: 180 }),
            withTiming(1, { duration: 250 }),
          );
        }
      }
    }, MS);
    return () => clearInterval(timer);
  }, [balance, cardScale]);

  // Celebratory animation
  useEffect(() => {
    if (!celebrateVisible) return;
    celebrateOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(
        1200,
        withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }, (finished) => {
          if (finished) runOnJS(dismissCelebrate)();
        }),
      ),
    );
    celebrateScale.value = withSequence(
      withTiming(1.6, { duration: 600, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 300 }),
    );
  }, [celebrateVisible, celebrateOpacity, celebrateScale, dismissCelebrate]);

  useEffect(() => {
    return () => {
      cancelAnimation(cardScale);
      cancelAnimation(celebrateOpacity);
      cancelAnimation(celebrateScale);
      cancelAnimation(tabIndicator);
    };
  }, [cardScale, celebrateOpacity, celebrateScale, tabIndicator]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicator.value * (segmentWidth / 2) }],
  }));

  const celebrateStyle = useAnimatedStyle(() => ({
    opacity: celebrateOpacity.value,
    transform: [{ scale: celebrateScale.value }],
  }));

  function switchTab(tab: ActiveTab) {
    setActiveTab(tab);
    tabIndicator.value = withTiming(tab === 'extrato' ? 0 : 1, { duration: 220 });
  }

  function onSegmentLayout(e: LayoutChangeEvent) {
    setSegmentWidth(e.nativeEvent.layout.width);
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchWalletFn(), fetchCouponsFn(planId)]);
    setRefreshing(false);
  }, [fetchWalletFn, fetchCouponsFn, planId]);

  function handleCouponPress(coupon: Coupon) {
    router.push({ pathname: '/wallet/coupon/[id]', params: { id: coupon.id } });
  }

  const renderTransaction = useCallback(
    ({ item }: { item: Transaction }) => <TransactionRow item={item} />,
    [],
  );

  const renderCoupon = useCallback(
    ({ item }: { item: Coupon }) => (
      <CouponCard coupon={item} onPress={handleCouponPress} />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <Screen scroll={false} padded={false} style={{ flex: 1, gap: 0 }}>
      {/* Header + Balance Card */}
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg }}>
        <Text variant="h1">Carteira</Text>
        <Text variant="body" color="muted" style={{ marginTop: 2, marginBottom: theme.spacing.lg }}>
          Seus benefícios Ford Intelligence
        </Text>

        <Animated.View style={cardAnimStyle}>
          <GlassPanel
            intensity={theme.blur.panel}
            padding="xl"
            style={{
              gap: theme.spacing.xs,
              borderColor: `${theme.plan.accent}40`,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
              <Icon name="wallet-outline" size={16} color="muted" />
              <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Saldo disponível
              </Text>
            </View>
            <Text
              variant="h1"
              style={{ fontSize: 36, lineHeight: 44, color: theme.plan.accent, fontFamily: 'Inter_700Bold' }}
            >
              R$ {formatBRL(displayBalance)}
            </Text>
            {error && balance === 0 ? (
              <Text variant="caption" color="critical">
                {error} Puxe para baixo para tentar novamente.
              </Text>
            ) : loading && displayBalance === 0 ? (
              <Text variant="caption" color="muted">
                Carregando...
              </Text>
            ) : (
              <Text variant="caption" color="muted">
                Acumulado em revisões e serviços Ford
              </Text>
            )}
          </GlassPanel>
        </Animated.View>
      </View>

      {/* Segment Control */}
      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          marginTop: theme.spacing.lg,
          marginBottom: theme.spacing.md,
        }}
      >
        <View
          onLayout={onSegmentLayout}
          style={[
            styles.segmentContainer,
            {
              backgroundColor: theme.colors.bgElevated,
              borderRadius: theme.radius.lg,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Sliding indicator */}
          {segmentWidth > 0 ? (
            <Animated.View
              style={[
                styles.segmentIndicator,
                indicatorStyle,
                {
                  width: segmentWidth / 2,
                  backgroundColor: theme.plan.accent,
                  borderRadius: theme.radius.md,
                },
              ]}
            />
          ) : null}
          <Pressable
            style={styles.segmentTab}
            onPress={() => switchTab('extrato')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'extrato' }}
          >
            <Icon name="list-outline" size={16} color={activeTab === 'extrato' ? 'inverse' : 'muted'} />
            <Text
              variant="label"
              style={{
                color: activeTab === 'extrato' ? '#FFF' : theme.colors.textMuted,
              }}
            >
              Extrato
            </Text>
          </Pressable>
          <Pressable
            style={styles.segmentTab}
            onPress={() => switchTab('cupons')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'cupons' }}
          >
            <Icon name="pricetag-outline" size={16} color={activeTab === 'cupons' ? 'inverse' : 'muted'} />
            <Text
              variant="label"
              style={{
                color: activeTab === 'cupons' ? '#FFF' : theme.colors.textMuted,
              }}
            >
              Cupons
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'extrato' ? (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.plan.accent}
              colors={[theme.plan.accent]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="Nenhuma transação ainda"
              description="Agende um serviço para acumular cashback."
            />
          }
          contentContainerStyle={{ paddingBottom: tabBarHeight + theme.spacing.lg }}
        />
      ) : (
        <FlatList
          key="coupons-list"
          data={coupons}
          keyExtractor={(item) => item.id}
          renderItem={renderCoupon}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: tabBarHeight + theme.spacing.lg,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.plan.accent}
              colors={[theme.plan.accent]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="pricetag-outline"
              title="Nenhum cupom disponível"
              description="Para o seu plano no momento."
            />
          }
        />
      )}

      {/* Celebratory overlay */}
      {celebrateVisible ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.celebrateCenter}>
            <Animated.View style={[styles.celebrateWrapper, celebrateStyle]}>
              {CELEBRATE_DOTS.map((dot, i) => (
                <View
                  key={i}
                  style={[
                    styles.celebrateDot,
                    { backgroundColor: dot.color, left: dot.x + 60, top: dot.y + 60 },
                  ]}
                />
              ))}
              <View
                style={[
                  styles.celebrateIconBg,
                  { backgroundColor: `${theme.colors.success}26` },
                ]}
              >
                <Icon name="checkmark-circle" size={48} color="success" />
              </View>
            </Animated.View>
            <Text variant="h2" style={{ color: theme.colors.success, marginTop: 16 }}>
              Cashback resgatado!
            </Text>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentContainer: {
    flexDirection: 'row',
    height: 44,
    position: 'relative',
    borderWidth: 1,
    overflow: 'hidden',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    zIndex: 0,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  txIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrateCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  celebrateWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  celebrateDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  celebrateIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
