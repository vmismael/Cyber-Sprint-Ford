import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Screen, Text } from '@/components';
import { StepIndicator } from '@/features/onboarding/StepIndicator';
import { SelectableCard } from '@/features/onboarding/SelectableCard';
import { vehicleCatalog } from '@/features/onboarding/catalog';
import { useUserStore, vehicleModels, type VehicleModel } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';

const schema = z.object({
  vehicleModel: z.enum(vehicleModels),
});

type FormValues = z.infer<typeof schema>;

export default function OnboardingStep2() {
  const theme = useTheme();
  const router = useRouter();
  const draft = useUserStore((s) => s.draft);
  const updateDraft = useUserStore((s) => s.updateDraft);

  const {
    control,
    handleSubmit,
    trigger,
    formState: { isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      vehicleModel: draft.vehicleModel,
    },
  });

  useEffect(() => {
    trigger();
  }, [trigger]);

  const onSubmit = handleSubmit((values) => {
    updateDraft({ vehicleModel: values.vehicleModel });
    router.push('/(auth)/onboarding/step-3');
  });

  return (
    <Screen scroll>
      <StepIndicator total={6} current={2} />

      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <Text variant="h2">Qual é o seu Ford?</Text>
        <Text variant="body" color="muted">
          Selecione o modelo para calibrar a telemetria.
        </Text>
      </View>

      <Controller
        control={control}
        name="vehicleModel"
        render={({ field: { value, onChange } }) => (
          <View style={{ gap: theme.spacing.md }}>
            {vehicleModels.map((id: VehicleModel) => {
              const data = vehicleCatalog[id];
              return (
                <SelectableCard
                  key={id}
                  title={data.label}
                  description={data.tagline}
                  meta={data.segment}
                  selected={value === id}
                  onPress={() => onChange(id)}
                />
              );
            })}
          </View>
        )}
      />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Button label="Avançar" fullWidth disabled={!isValid} onPress={onSubmit} />
        <Button label="Voltar" variant="ghost" fullWidth onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
