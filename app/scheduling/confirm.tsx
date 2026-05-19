import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Icon, Screen, Text } from '@/components';
import { StepHeader } from '@/features/scheduling/StepHeader';
import { useSchedulingStore } from '@/stores/useSchedulingStore';
import { fetchDealerById } from '@/services/mocks/dealersApi';
import { createBooking } from '@/services/mocks/schedulingApi';
import {
  MODE_LABEL,
  SERVICE_LABEL,
  type Dealer,
} from '@/types/scheduling';
import { useTheme } from '@/theme/ThemeProvider';

function formatDate(iso: string): string {
  try {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
  } catch {
    return iso;
  }
}

export default function SchedulingConfirmStep() {
  const theme = useTheme();
  const router = useRouter();
  const draft = useSchedulingStore((s) => s.draft);
  const commitBooking = useSchedulingStore((s) => s.commitBooking);

  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!draft.dealerId) return;
    let cancelled = false;
    fetchDealerById(draft.dealerId).then((d) => {
      if (!cancelled) setDealer(d);
    });
    return () => {
      cancelled = true;
    };
  }, [draft.dealerId]);

  const canSubmit =
    accepted &&
    !submitting &&
    !!draft.dealerId &&
    !!draft.service &&
    !!draft.mode &&
    !!draft.date &&
    !!draft.slot &&
    (draft.mode === 'in-person' || !!draft.pickupAddress);

  const onConfirm = async () => {
    if (!canSubmit || !draft.dealerId || !draft.service || !draft.mode || !draft.date || !draft.slot) {
      return;
    }
    setSubmitting(true);
    try {
      const booking = await createBooking({
        dealerId: draft.dealerId,
        service: draft.service,
        mode: draft.mode,
        date: draft.date,
        slot: draft.slot,
        pickupAddress: draft.pickupAddress,
        notes: draft.notes,
      });
      await commitBooking(booking);
      router.replace({ pathname: '/scheduling/success', params: { protocol: booking.protocol } });
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll>
      <StepHeader
        total={5}
        current={5}
        title="Confirme seu agendamento"
        subtitle="Revise os detalhes antes de finalizar."
      />

      <Card padding="lg" style={{ gap: theme.spacing.md, marginTop: theme.spacing.md }}>
        <SummaryRow label="Concessionária" value={dealer?.name ?? '—'} />
        <SummaryRow label="Endereço" value={dealer?.address ?? '—'} muted />
        <Divider />
        <SummaryRow
          label="Serviço"
          value={draft.service ? SERVICE_LABEL[draft.service] : '—'}
        />
        <SummaryRow
          label="Modalidade"
          value={draft.mode ? MODE_LABEL[draft.mode] : '—'}
        />
        {draft.mode === 'pickup-delivery' && draft.pickupAddress ? (
          <SummaryRow label="Retirada" value={draft.pickupAddress} muted />
        ) : null}
        <Divider />
        <SummaryRow label="Data" value={draft.date ? formatDate(draft.date) : '—'} />
        <SummaryRow label="Horário" value={draft.slot ?? '—'} />
      </Card>

      <Pressable
        onPress={() => setAccepted((v) => !v)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        hitSlop={6}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: theme.spacing.sm,
          paddingVertical: theme.spacing.sm,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: theme.radius.sm,
            borderWidth: 2,
            borderColor: accepted ? theme.plan.accent : theme.colors.borderStrong,
            backgroundColor: accepted ? theme.plan.accent : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
          }}
        >
          {accepted ? <Icon name="checkmark" size={14} color="inverse" /> : null}
        </View>
        <Text variant="caption" color="muted" style={{ flex: 1 }}>
          Aceito os termos do serviço Ford e autorizo o contato da concessionária.
        </Text>
      </Pressable>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Button
          label="Confirmar agendamento"
          fullWidth
          disabled={!canSubmit}
          loading={submitting}
          onPress={onConfirm}
        />
        <Button
          label="Voltar"
          variant="ghost"
          fullWidth
          disabled={submitting}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/map');
            }
          }}
        />
      </View>
    </Screen>
  );
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {label}
      </Text>
      <Text variant={muted ? 'body' : 'bodyStrong'} color={muted ? 'muted' : 'primary'}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginVertical: 4,
      }}
    />
  );
}
