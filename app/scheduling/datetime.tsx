import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Screen, Text } from '@/components';
import { StepHeader } from '@/features/scheduling/StepHeader';
import { useSchedulingStore } from '@/stores/useSchedulingStore';
import { fetchAvailableSlots } from '@/services/mocks/schedulingApi';
import { useTheme } from '@/theme/ThemeProvider';

const schema = z.object({
  date: z.string().min(1, 'Selecione uma data.'),
  slot: z.string().min(1, 'Selecione um horário.'),
});

type FormValues = z.infer<typeof schema>;

function buildUpcomingDates(count: number): { iso: string; label: string; weekday: string; day: string }[] {
  const out: { iso: string; label: string; weekday: string; day: string }[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    out.push({ iso, label: `${day} ${month}`, weekday, day });
  }
  return out;
}

export default function SchedulingDateTimeStep() {
  const theme = useTheme();
  const router = useRouter();
  const draft = useSchedulingStore((s) => s.draft);
  const updateDraft = useSchedulingStore((s) => s.updateDraft);

  const dates = useMemo(() => buildUpcomingDates(10), []);

  const {
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      date: draft.date ?? dates[0]?.iso ?? '',
      slot: draft.slot ?? '',
    },
  });

  const selectedDate = watch('date');
  const selectedSlot = watch('slot');

  const [slots, setSlots] = useState<string[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    trigger();
  }, [trigger]);

  useEffect(() => {
    if (!selectedDate || !draft.dealerId) return;
    let cancelled = false;
    setLoadingSlots(true);
    fetchAvailableSlots(draft.dealerId, selectedDate).then((list) => {
      if (!cancelled) {
        setSlots(list);
        setLoadingSlots(false);
        if (selectedSlot && !list.includes(selectedSlot)) {
          setValue('slot', '', { shouldValidate: true });
        }
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, draft.dealerId]);

  const onSubmit = handleSubmit((values) => {
    updateDraft({ date: values.date, slot: values.slot });
    router.push('/scheduling/confirm');
  });

  return (
    <Screen scroll>
      <StepHeader
        total={5}
        current={4}
        title="Quando podemos agendar?"
        subtitle="Escolha o melhor dia e horário."
      />

      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
          Data
        </Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={dates}
          keyExtractor={(item) => item.iso}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingVertical: theme.spacing.xs }}
          renderItem={({ item }) => {
            const isActive = selectedDate === item.iso;
            return (
              <Pressable
                onPress={() => setValue('date', item.iso, { shouldValidate: true })}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                style={({ pressed }) => ({
                  width: 64,
                  paddingVertical: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  backgroundColor: isActive ? theme.plan.accentSoft : theme.colors.bgElevated,
                  borderWidth: 1,
                  borderColor: isActive ? theme.plan.accent : theme.colors.border,
                  alignItems: 'center',
                  gap: 4,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text
                  variant="caption"
                  style={{
                    color: isActive ? theme.plan.accent : theme.colors.textMuted,
                    textTransform: 'uppercase',
                  }}
                >
                  {item.weekday}
                </Text>
                <Text
                  variant="h3"
                  style={{ color: isActive ? theme.plan.accent : theme.colors.textPrimary }}
                >
                  {item.day}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
          Horários disponíveis
        </Text>

        {loadingSlots || slots === null ? (
          <View style={{ paddingVertical: theme.spacing.lg, alignItems: 'center' }}>
            <ActivityIndicator color={theme.plan.accent} />
          </View>
        ) : slots.length === 0 ? (
          <Text variant="body" color="muted">
            Sem horários disponíveis para esta data.
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {slots.map((slot) => {
              const isActive = selectedSlot === slot;
              return (
                <Pressable
                  key={slot}
                  onPress={() => setValue('slot', slot, { shouldValidate: true })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }) => ({
                    paddingHorizontal: theme.spacing.lg,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.radius.full,
                    backgroundColor: isActive ? theme.plan.accentSoft : theme.colors.bgElevated,
                    borderWidth: 1,
                    borderColor: isActive ? theme.plan.accent : theme.colors.border,
                    minHeight: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text
                    variant="bodyStrong"
                    style={{ color: isActive ? theme.plan.accent : theme.colors.textPrimary }}
                  >
                    {slot}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Button label="Avançar" fullWidth disabled={!isValid} onPress={onSubmit} />
        <Button label="Voltar" variant="ghost" fullWidth onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
