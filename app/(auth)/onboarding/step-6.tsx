import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Icon, Screen, Text } from '@/components';
import { StepIndicator } from '@/features/onboarding/StepIndicator';
import { PopIn } from '@/features/onboarding/AnimatedMount';
import { vehicleCatalog, usageCatalog, planCatalog } from '@/features/onboarding/catalog';
import { useUserStore, type UserProfile } from '@/stores/useUserStore';
import { submitProfile, type SubmitProfileResponse } from '@/services/mocks/profileApi';
import { useTheme } from '@/theme/ThemeProvider';

export default function OnboardingStep6() {
  const theme = useTheme();
  const router = useRouter();
  const draft = useUserStore((s) => s.draft);
  const commitProfile = useUserStore((s) => s.commitProfile);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const draftIsComplete =
    !!draft.vehicleModel && !!draft.usageStyle && !!draft.monthlyKm && !!draft.plan;

  const handleConfirm = async () => {
    if (!draftIsComplete) return;
    setSubmitting(true);
    setError(null);
    try {
      const profile: UserProfile = {
        vehicleModel: draft.vehicleModel!,
        usageStyle: draft.usageStyle!,
        monthlyKm: draft.monthlyKm!,
        plan: draft.plan!,
      };
      const response = await submitProfile(profile);
      setResult(response);
      await commitProfile({ ...profile, riskScore: response.riskScore });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao concluir.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.xl }}>
          <PopIn
            style={{
              alignSelf: 'center',
              width: 112,
              height: 112,
              borderRadius: theme.radius.full,
              backgroundColor: theme.plan.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="checkmark-circle" size={64} color="accent" />
          </PopIn>

          <View style={{ gap: theme.spacing.md, alignItems: 'center' }}>
            <Text variant="h1" style={{ textAlign: 'center' }}>
              Tudo pronto!
            </Text>
            <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
              A IA classificou seu perfil como risco{' '}
              <Text variant="bodyStrong" color="accent">
                {result.riskLabel}
              </Text>
              . Próxima revisão sugerida em {result.recommendedServiceInDays} dias.
            </Text>
          </View>
        </View>

        <Button
          label="Ir para o app"
          fullWidth
          onPress={() => router.replace('/(tabs)')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <StepIndicator total={6} current={6} />

      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <Text variant="h2">Confirme seu perfil</Text>
        <Text variant="body" color="muted">
          Você poderá ajustar tudo depois nas preferências.
        </Text>
      </View>

      <Card>
        <View style={{ gap: theme.spacing.md }}>
          <SummaryRow
            label="Veículo"
            value={draft.vehicleModel ? vehicleCatalog[draft.vehicleModel].label : '—'}
          />
          <SummaryRow
            label="Estilo de uso"
            value={draft.usageStyle ? usageCatalog[draft.usageStyle].label : '—'}
          />
          <SummaryRow
            label="Km/mês"
            value={draft.monthlyKm ? `${draft.monthlyKm.toLocaleString('pt-BR')} km` : '—'}
          />
          <SummaryRow
            label="Plano"
            value={draft.plan ? planCatalog[draft.plan].label : '—'}
            accent
          />
        </View>
      </Card>

      {error ? (
        <Text variant="caption" color="critical">
          {error}
        </Text>
      ) : null}

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Button
          label="Concluir"
          fullWidth
          loading={submitting}
          disabled={!draftIsComplete}
          onPress={handleConfirm}
        />
        <Button
          label="Voltar"
          variant="ghost"
          fullWidth
          disabled={submitting}
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View
      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
    >
      <Text variant="label" color="muted">
        {label}
      </Text>
      <Text variant="bodyStrong" color={accent ? 'accent' : 'primary'}>
        {value}
      </Text>
    </View>
  );
}
