import { router } from 'expo-router';
import { useSchedulingStore } from '@/stores/useSchedulingStore';
import { fetchDealers } from '@/services/mocks/dealersApi';
import { fetchAvailableSlots } from '@/services/mocks/schedulingApi';
import type { ServiceKind } from '@/types/scheduling';

export type OneTapReason = 'no-dealer' | 'no-slot' | 'network';

export type OneTapResult = { ok: true } | { ok: false; reason: OneTapReason };

const REASON_MESSAGE: Record<OneTapReason, string> = {
  'no-dealer': 'Nenhuma concessionária disponível no momento.',
  'no-slot': 'Sem horários livres para hoje. Abra o mapa para escolher outra data.',
  network: 'Falha de comunicação. Tente novamente em instantes.',
};

export function oneTapReasonMessage(reason: OneTapReason): string {
  return REASON_MESSAGE[reason];
}

export async function runOneTapScheduling(
  service: ServiceKind = 'revision',
): Promise<OneTapResult> {
  try {
    const dealers = await fetchDealers();
    const dealer = dealers[0];
    if (!dealer) return { ok: false, reason: 'no-dealer' };

    const date = new Date().toISOString().slice(0, 10);
    const slots = await fetchAvailableSlots(dealer.id, date);
    const slot = slots[0];
    if (!slot) return { ok: false, reason: 'no-slot' };

    useSchedulingStore.getState().startDraftWithSuggestion({
      dealerId: dealer.id,
      service,
      mode: 'in-person',
      date,
      slot,
    });
    router.replace('/scheduling/confirm');
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
