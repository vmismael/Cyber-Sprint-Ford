import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Screen, Text } from '@/components';
import { StepIndicator } from '@/features/onboarding/StepIndicator';
import { SelectableCard } from '@/features/onboarding/SelectableCard';
import { usageCatalog } from '@/features/onboarding/catalog';
import { useUserStore, usageStyles, type UsageStyle } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';

const schema = z.object({
  usageStyle: z.enum(usageStyles),
});

type FormValues = z.infer<typeof schema>;

export default function OnboardingStep3() {
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
      usageStyle: draft.usageStyle,
    },
  });

  useEffect(() => {
    trigger();
  }, [trigger]);

  const onSubmit = handleSubmit((values) => {
    updateDraft({ usageStyle: values.usageStyle });
    router.push('/(auth)/onboarding/step-4');
  });

  return (
    <Screen scroll>
      <StepIndicator total={6} current={3} />

      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <Text variant="h2">Como você dirige?</Text>
        <Text variant="body" color="muted">
          Esta resposta ajuda a IA a antecipar desgaste de componentes.
        </Text>
      </View>

      <Controller
        control={control}
        name="usageStyle"
        render={({ field: { value, onChange } }) => (
          <View style={{ gap: theme.spacing.md }}>
            {usageStyles.map((id: UsageStyle) => {
              const data = usageCatalog[id];
              return (
                <SelectableCard
                  key={id}
                  title={data.label}
                  description={data.description}
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
