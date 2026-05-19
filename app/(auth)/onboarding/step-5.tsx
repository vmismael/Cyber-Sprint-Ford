import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Screen, Text } from '@/components';
import { StepIndicator } from '@/features/onboarding/StepIndicator';
import { planCatalog } from '@/features/onboarding/catalog';
import { useUserStore } from '@/stores/useUserStore';
import { usePlanStore } from '@/stores/usePlanStore';
import { useTheme } from '@/theme/ThemeProvider';
import { planAccents, planIds, type PlanId } from '@/theme/plans';

const schema = z.object({
  plan: z.enum(planIds as readonly [PlanId, ...PlanId[]]),
});

type FormValues = z.infer<typeof schema>;

export default function OnboardingStep5() {
  const theme = useTheme();
  const router = useRouter();
  const draft = useUserStore((s) => s.draft);
  const updateDraft = useUserStore((s) => s.updateDraft);
  const setPlan = usePlanStore((s) => s.setPlan);

  const {
    control,
    handleSubmit,
    trigger,
    formState: { isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      plan: draft.plan,
    },
  });

  useEffect(() => {
    trigger();
  }, [trigger]);

  const onSubmit = handleSubmit((values) => {
    updateDraft({ plan: values.plan });
    setPlan(values.plan);
    router.push('/(auth)/onboarding/step-6');
  });

  return (
    <Screen scroll>
      <StepIndicator total={6} current={5} />

      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <Text variant="h2">Escolha o seu plano</Text>
        <Text variant="body" color="muted">
          O tema do app se adapta automaticamente.
        </Text>
      </View>

      <Controller
        control={control}
        name="plan"
        render={({ field: { value, onChange } }) => (
          <View style={{ gap: theme.spacing.md }}>
            {planIds.map((id) => {
              const accent = planAccents[id];
              const data = planCatalog[id];
              const selected = value === id;

              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Plano ${data.label}`}
                  onPress={() => {
                    onChange(id);
                    setPlan(id);
                  }}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    minHeight: theme.touchTarget.comfortable + 24,
                    backgroundColor: selected
                      ? accent.accentSoft
                      : theme.colors.bgElevated,
                    borderColor: selected ? accent.accent : theme.colors.border,
                    borderWidth: selected ? 2 : 1,
                    borderRadius: theme.radius.lg,
                    padding: theme.spacing.lg,
                    opacity: pressed ? 0.9 : 1,
                    gap: theme.spacing.sm,
                  })}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      variant="h3"
                      style={{ color: selected ? accent.accent : theme.colors.textPrimary }}
                    >
                      {data.label}
                    </Text>
                    <Text
                      variant="bodyStrong"
                      style={{ color: selected ? accent.accent : theme.colors.textMuted }}
                    >
                      {data.price}
                    </Text>
                  </View>
                  <Text variant="body" color="muted">
                    {data.pitch}
                  </Text>
                  <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
                    {data.perks.map((perk) => (
                      <View
                        key={perk}
                        style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: accent.accent,
                          }}
                        />
                        <Text variant="caption" color="muted">
                          {perk}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Pressable>
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
