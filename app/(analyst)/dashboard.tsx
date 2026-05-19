import { Suspense, lazy, useEffect } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Button, Card, Text } from '@/components';
import { EmptyState, ErrorState } from '@/components/state';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAnalystStore } from '@/stores/useAnalystStore';
import { KPICard } from '@/features/analyst-dashboard/KPICard';
import { LeadCard } from '@/features/analyst-dashboard/LeadCard';
import { FilterChipRow } from '@/features/analyst-dashboard/FilterChipRow';
import { SkeletonBlock } from '@/features/analyst-dashboard/SkeletonBlock';
import type { PeriodFilter, PlanFilter } from '@/services/mocks/analystApi';

const BarChart = lazy(() => import('@/features/analyst-dashboard/BarChartLazyEntry'));

const PERIOD_OPTIONS = [
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: '90d', label: '90 dias' },
];

const PLAN_OPTIONS = [
  { key: 'all', label: 'Todos' },
  { key: 'agro', label: 'Agro' },
  { key: 'urban', label: 'Urban' },
  { key: 'premium', label: 'Premium' },
];

export default function AnalystDashboard() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const kpis          = useAnalystStore((s) => s.kpis);
  const series        = useAnalystStore((s) => s.series);
  const leads         = useAnalystStore((s) => s.leads);
  const filters       = useAnalystStore((s) => s.filters);
  const loading       = useAnalystStore((s) => s.loading);
  const error         = useAnalystStore((s) => s.error);
  const fetchDashboard = useAnalystStore((s) => s.fetchDashboard);
  const setFilter     = useAnalystStore((s) => s.setFilter);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = fetchDashboard;

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja encerrar a sessão de analista?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bgBase }}
      contentContainerStyle={{
        paddingTop: insets.top + theme.spacing.lg,
        paddingBottom: insets.bottom + theme.spacing.xxxl,
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.xl,
      }}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          tintColor={theme.colors.textMuted}
        />
      }
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="h2">Ford Intelligence</Text>
          <Text variant="caption" color="muted">
            {user?.name ?? 'Analista'}
          </Text>
        </View>
        <Badge label="ANALISTA" tone="info" />
        <Button
          label="Sair"
          variant="ghost"
          onPress={handleLogout}
          iconLeft={null}
        />
      </View>

      {/* Filters */}
      <View style={{ gap: theme.spacing.md }}>
        <FilterChipRow
          label="Período"
          options={PERIOD_OPTIONS}
          selected={filters.period}
          onSelect={(k) => setFilter({ period: k as PeriodFilter })}
        />
        <FilterChipRow
          label="Plano"
          options={PLAN_OPTIONS}
          selected={filters.plan}
          onSelect={(k) => setFilter({ plan: k as PlanFilter })}
        />
      </View>

      {/* Error inicial (sem dados ainda) */}
      {error && !kpis ? (
        <Card padding="lg">
          <ErrorState
            title="Não foi possível carregar o painel"
            description={error}
            onRetry={fetchDashboard}
            compact
          />
        </Card>
      ) : null}

      {/* KPI Grid */}
      {loading && !kpis ? (
        <View style={{ gap: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <SkeletonBlock height={110} width={'48%'} />
            <SkeletonBlock height={110} width={'48%'} />
          </View>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <SkeletonBlock height={110} width={'48%'} />
            <SkeletonBlock height={110} width={'48%'} />
          </View>
        </View>
      ) : kpis ? (
        <View style={{ gap: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <KPICard
              label="VIN Share"
              value={`${kpis.vinShare.toFixed(1)}%`}
              icon="car-outline"
              delta="+1.2%"
              deltaPositive
            />
            <KPICard
              label="Leads Ativos"
              value={String(kpis.activeLeads)}
              icon="people-outline"
              delta="+3"
              deltaPositive
            />
          </View>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <KPICard
              label="Agend. / Mês"
              value={String(kpis.monthlyBookings)}
              icon="calendar-outline"
              delta="-8"
              deltaPositive={false}
            />
            <KPICard
              label="Conversão"
              value={`${kpis.conversionRate.toFixed(1)}%`}
              icon="trending-up-outline"
              delta="+0.9%"
              deltaPositive
            />
          </View>
        </View>
      ) : null}

      {/* Bar Chart */}
      <Card padding="lg" elevated>
        <Text
          variant="label"
          style={{ textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: theme.spacing.md }}
          color="muted"
        >
          Agendamentos × Conversões
        </Text>
        {loading && series.length === 0 ? (
          <SkeletonBlock height={140} />
        ) : series.length > 0 ? (
          <Suspense fallback={<SkeletonBlock height={140} />}>
            <BarChart data={series} />
          </Suspense>
        ) : null}
      </Card>

      {/* Leads */}
      <View style={{ gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Text
            variant="label"
            style={{ flex: 1, textTransform: 'uppercase', letterSpacing: 0.6 }}
            color="muted"
          >
            Leads Qualificados pela IA
          </Text>
          <Badge label={String(leads.length)} tone="neutral" />
        </View>

        {loading && leads.length === 0 ? (
          <View style={{ gap: theme.spacing.sm }}>
            {[0, 1, 2].map((i) => (
              <SkeletonBlock key={i} height={90} />
            ))}
          </View>
        ) : leads.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              icon="people-outline"
              title="Nenhum lead encontrado"
              description="Nenhum lead corresponde aos filtros selecionados."
              compact
            />
          </Card>
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
