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
import {
  serviceKinds,
  SERVICE_LABEL,
  SERVICE_DESCRIPTION,
  type ServiceKind,
} from '@/types/scheduling';
import { useTheme } from '@/theme/ThemeProvider';
import type { IconName } from '@/components';

const ICON_BY_SERVICE: Record<ServiceKind, IconName> = {
  revision: 'construct-outline',
  'oil-change': 'water-outline',
  tires: 'ellipse-outline',
  diagnostics: 'pulse-outline',
  other: 'ellipsis-horizontal-circle-outline',
};

const schema = z.object({
  service: z.enum(serviceKinds),
});

type FormValues = z.infer<typeof schema>;

export default function SchedulingServiceStep() {
  const theme = useTheme();
  const router = useRouter();
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
    defaultValues: { service: draft.service },
  });

  useEffect(() => {
    trigger();
  }, [trigger]);

  const value = watch('service');

  const onSubmit = handleSubmit((values) => {
    updateDraft({ service: values.service });
    router.push('/scheduling/mode');
  });

  return (
    <Screen scroll>
      <StepHeader
        total={5}
        current={1}
        title="Qual serviço você precisa?"
        subtitle="Escolha o que faremos no seu Ford."
      />

      <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.md }}>
        {serviceKinds.map((s) => (
          <OptionCard
            key={s}
            icon={ICON_BY_SERVICE[s]}
            title={SERVICE_LABEL[s]}
            description={SERVICE_DESCRIPTION[s]}
            selected={value === s}
            onPress={() => setValue('service', s, { shouldValidate: true })}
          />
        ))}
      </View>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Button label="Avançar" fullWidth disabled={!isValid} onPress={onSubmit} />
        <Button label="Voltar" variant="ghost" fullWidth onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
