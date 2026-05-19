import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Button, Card, GlassPanel, Icon, Text, type IconName } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import { fetchLeadById, type LeadDetail } from '@/services/mocks/analystApi';
import { VEHICLE_LABEL, PLAN_LABEL, STATUS_LABEL, STATUS_TONE, RISK_TONE } from '@/features/analyst-dashboard/leadDisplayMaps';
import { SkeletonBlock } from '@/features/analyst-dashboard/SkeletonBlock';
import { formatDate } from '@/utils/date';
import { haptic } from '@/utils/haptics';

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<LeadDetail['status'] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLeadById(id).then((data) => {
      if (cancelled) return;
      if (!data) {
        router.back();
        return;
      }
      setLead(data);
      setActionStatus(data.status);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const handleContact = () => {
    Alert.alert(
      'Marcar como Contactado',
      `Confirmar que ${lead?.clientName} foi contactado?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            haptic.light();
            setActionStatus('contactado');
          },
        },
      ],
    );
  };

  const handleConvert = () => {
    Alert.alert(
      'Converter Lead',
      `Confirmar conversão de ${lead?.clientName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Converter',
          onPress: () => {
            haptic.success();
            setActionStatus('convertido');
            Alert.alert('Lead convertido!', 'O agendamento foi registrado com sucesso.');
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgBase }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + theme.spacing.md,
          paddingBottom: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Icon name="arrow-back-outline" size={24} color="primary" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="h3" numberOfLines={1}>
            {loading ? 'Carregando...' : (lead?.clientName ?? 'Lead')}
          </Text>
          <Text variant="caption" color="muted">
            {id}
          </Text>
        </View>
        {actionStatus ? (
          <Badge label={STATUS_LABEL[actionStatus]} tone={STATUS_TONE[actionStatus]} />
        ) : null}
      </View>

      <FlatList
        data={loading ? [] : (lead?.timeline ?? [])}
        keyExtractor={(item) => item.date}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.xl,
          paddingBottom: insets.bottom + theme.spacing.xxxl + 80,
          gap: theme.spacing.lg,
        }}
        ListHeaderComponent={
          loading ? (
            <View style={{ gap: theme.spacing.lg }}>
              <SkeletonBlock height={160} />
              <SkeletonBlock height={100} />
              <SkeletonBlock height={24} />
            </View>
          ) : lead ? (
            <View style={{ gap: theme.spacing.lg }}>
              {/* AI Score card */}
              <Card padding="lg" elevated>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
                  {/* Score ring */}
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      borderWidth: 3,
                      borderColor: {
                        alto: theme.colors.alertCritical,
                        moderado: theme.colors.alertWarn,
                        baixo: theme.colors.success,
                      }[lead.riskLabel],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      variant="h2"
                      style={{ color: theme.colors.textPrimary, lineHeight: 28 }}
                    >
                      {lead.aiScore}
                    </Text>
                    <Text variant="caption" color="muted" style={{ fontSize: 9 }}>
                      IA SCORE
                    </Text>
                  </View>

                  <View style={{ flex: 1, gap: theme.spacing.sm }}>
                    <Badge label={lead.riskLabel.toUpperCase()} tone={RISK_TONE[lead.riskLabel]} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                      <Icon name="car-outline" size={14} color="muted" />
                      <Text variant="caption" color="muted">
                        {VEHICLE_LABEL[lead.vehicleModel]} · {lead.vehicleYear}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                      <Icon name="speedometer-outline" size={14} color="muted" />
                      <Text variant="caption" color="muted">
                        {lead.odometerKm.toLocaleString('pt-BR')} km
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                      <Icon name="card-outline" size={14} color="muted" />
                      <Text variant="caption" color="muted">
                        Plano {PLAN_LABEL[lead.plan]}
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={{
                    marginTop: theme.spacing.md,
                    paddingTop: theme.spacing.md,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <View>
                    <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Serviço
                    </Text>
                    <Text variant="bodyStrong">{lead.service}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Receita est.
                    </Text>
                    <Text variant="bodyStrong">
                      R$ {lead.estimatedRevenue.toLocaleString('pt-BR')}
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Contact info */}
              <GlassPanel padding="lg">
                <Text
                  variant="label"
                  color="muted"
                  style={{ textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: theme.spacing.md }}
                >
                  Contato
                </Text>
                <View style={{ gap: theme.spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                    <Icon name="call-outline" size={16} color="muted" />
                    <Text variant="body">{lead.phone}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                    <Icon name="mail-outline" size={16} color="muted" />
                    <Text variant="body">{lead.email}</Text>
                  </View>
                </View>
              </GlassPanel>

              {/* Timeline header */}
              <Text
                variant="label"
                color="muted"
                style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
              >
                Linha do Tempo
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: 'row',
              gap: theme.spacing.md,
              alignItems: 'flex-start',
            }}
          >
            {/* Icon circle */}
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(31,111,235,0.14)',
                borderWidth: 1,
                borderColor: 'rgba(31,111,235,0.30)',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name={item.icon as IconName} size={14} color="accent" />
            </View>

            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="body" style={{ lineHeight: 20 }}>{item.event}</Text>
              <Text variant="caption" color="muted">{formatDate(item.date)}</Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 1,
              backgroundColor: theme.colors.border,
              marginLeft: 48,
              marginVertical: theme.spacing.xs,
            }}
          />
        )}
      />

      {/* Footer actions */}
      {!loading && lead && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            paddingBottom: insets.bottom + theme.spacing.md,
            backgroundColor: theme.colors.bgBase,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            flexDirection: 'row',
            gap: theme.spacing.md,
          }}
        >
          <Button
            label="Contactado"
            variant="ghost"
            onPress={handleContact}
            disabled={actionStatus === 'convertido' || actionStatus === 'contactado'}
            fullWidth
          />
          <Button
            label="Converter Lead"
            variant="primary"
            onPress={handleConvert}
            disabled={actionStatus === 'convertido'}
            fullWidth
          />
        </View>
      )}
    </View>
  );
}
