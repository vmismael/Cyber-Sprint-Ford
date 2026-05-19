import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Screen, Text } from '@/components';
import { StepIndicator } from '@/features/onboarding/StepIndicator';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';

const schema = z.object({
  monthlyKm: z
    .string()
    .min(1, 'Informe a quilometragem')
    .regex(/^\d+$/, 'Use apenas números')
    .refine((v) => {
      const n = Number(v);
      return n >= 100 && n <= 20000;
    }, 'Informe um valor entre 100 e 20.000 km'),
});

type FormValues = z.infer<typeof schema>;

export default function OnboardingStep4() {
  const theme = useTheme();
  const router = useRouter();
  const draft = useUserStore((s) => s.draft);
  const updateDraft = useUserStore((s) => s.updateDraft);

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      monthlyKm: draft.monthlyKm ? String(draft.monthlyKm) : '',
    },
  });

  useEffect(() => {
    trigger();
  }, [trigger]);

  const onSubmit = handleSubmit((values) => {
    updateDraft({ monthlyKm: Number(values.monthlyKm) });
    router.push('/(auth)/onboarding/step-5');
  });

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, gap: theme.spacing.lg }}
      >
        <StepIndicator total={6} current={4} />

        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          <Text variant="h2">Quanto você roda por mês?</Text>
          <Text variant="body" color="muted">
            Estimativa em quilômetros — não precisa ser exato.
          </Text>
        </View>

        <Input
          control={control}
          name="monthlyKm"
          label="Quilometragem mensal"
          placeholder="Ex.: 1500"
          keyboardType="number-pad"
          error={errors.monthlyKm?.message}
          hint="Entre 100 e 20.000 km"
        />

        <View style={{ flex: 1 }} />

        <View style={{ gap: theme.spacing.sm }}>
          <Button label="Avançar" fullWidth disabled={!isValid} onPress={onSubmit} />
          <Button label="Voltar" variant="ghost" fullWidth onPress={() => router.back()} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
