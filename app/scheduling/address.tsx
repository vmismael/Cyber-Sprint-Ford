import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, Icon, Input, Screen, Text } from '@/components';
import { StepHeader } from '@/features/scheduling/StepHeader';
import { useSchedulingStore } from '@/stores/useSchedulingStore';
import { fetchAddressSuggestions } from '@/services/mocks/dealersApi';
import { useTheme } from '@/theme/ThemeProvider';

const schema = z.object({
  pickupAddress: z.string().min(8, 'Informe um endereço com pelo menos 8 caracteres.'),
});

type FormValues = z.infer<typeof schema>;

export default function SchedulingAddressStep() {
  const theme = useTheme();
  const router = useRouter();
  const draft = useSchedulingStore((s) => s.draft);
  const updateDraft = useSchedulingStore((s) => s.updateDraft);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { isValid, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { pickupAddress: draft.pickupAddress ?? '' },
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const query = watch('pickupAddress');

  useEffect(() => {
    trigger();
  }, [trigger]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    debounceRef.current = setTimeout(() => {
      fetchAddressSuggestions(query).then((list) => {
        if (!cancelled) setSuggestions(list);
      });
    }, 300);

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const onSubmit = handleSubmit((values) => {
    updateDraft({ pickupAddress: values.pickupAddress });
    router.push('/scheduling/datetime');
  });

  return (
    <Screen scroll>
      <StepHeader
        total={5}
        current={3}
        title="Onde devemos buscar?"
        subtitle="Confirme o endereço de retirada do veículo."
      />

      <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.md }}>
        <Input
          control={control}
          name="pickupAddress"
          label="Endereço de retirada"
          placeholder="Ex.: Av. Paulista, 1500"
          error={errors.pickupAddress?.message}
          autoCapitalize="words"
        />

        {suggestions.length > 0 ? (
          <Card padding="sm">
            <View style={{ gap: 0 }}>
              {suggestions.map((s, idx) => (
                <Pressable
                  key={s}
                  onPress={() =>
                    setValue('pickupAddress', s, { shouldValidate: true })
                  }
                  hitSlop={4}
                  style={({ pressed }) => ({
                    paddingVertical: theme.spacing.md,
                    paddingHorizontal: theme.spacing.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: theme.colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Icon name="location-outline" size={16} color="muted" />
                  <Text variant="body" style={{ flex: 1 }}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : null}
      </View>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Button label="Avançar" fullWidth disabled={!isValid} onPress={onSubmit} />
        <Button label="Voltar" variant="ghost" fullWidth onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
