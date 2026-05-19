import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Screen } from '@/components';
import { StepHeader } from '@/features/scheduling/StepHeader';
import { OptionCard } from '@/features/scheduling/OptionCard';
import { useSchedulingStore } from '@/stores/useSchedulingStore';
import { usePlanStore } from '@/stores/usePlanStore';
import { deliveryModes } from '@/types/scheduling';
import { useTheme } from '@/theme/ThemeProvider';

const schema = z.object({
  mode: z.enum(deliveryModes),
});

type FormValues = z.infer<typeof schema>;

export default function SchedulingModeStep() {
  const theme = useTheme();
  const router = useRouter();
  const plan = usePlanStore((s) => s.plan);
  const draft = useSchedulingStore((s) => s.draft);
  const updateDraft = useSchedulingStore((s) => s.updateDraft);

  const {
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { mode: draft.mode },
  });

  useEffect(() => {
    trigger();
  }, [trigger]);

  const value = watch('mode');

  const onSubmit = handleSubmit((values) => {
    updateDraft({ mode: values.mode, pickupAddress: values.mode === 'in-person' ? undefined : draft.pickupAddress });
    if (values.mode === 'pickup-delivery') {
      router.push('/scheduling/address');
    } else {
      router.push('/scheduling/datetime');
    }
  });

  return (
    <Screen scroll>
      <StepHeader
        total={5}
        current={2}
        title="Como vamos atender?"
        subtitle="Você pode levar o veículo ou nós buscamos para você."
      />

      <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.md }}>
        <OptionCard
          icon="business-outline"
          title="Presencial"
          description="Você leva o carro até a concessionária no horário combinado."
          selected={value === 'in-person'}
          onPress={() => setValue('mode', 'in-person', { shouldValidate: true })}
        />
        <OptionCard
          icon="car-outline"
          title="Leva e Traz"
          description="Buscamos seu veículo no endereço que você indicar e devolvemos pronto."
          selected={value === 'pickup-delivery'}
          badge={plan === 'premium' ? 'Premium' : 'Disponível'}
          badgeTone={plan === 'premium' ? 'accent' : 'info'}
          onPress={() => setValue('mode', 'pickup-delivery', { shouldValidate: true })}
        />
      </View>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Button label="Avançar" fullWidth disabled={!isValid} onPress={onSubmit} />
        <Button label="Voltar" variant="ghost" fullWidth onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
