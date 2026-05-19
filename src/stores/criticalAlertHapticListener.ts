import { useAlertsStore } from './useAlertsStore';
import { haptic } from '@/utils/haptics';

/**
 * Subscribe singleton fora da arvore React: dispara haptic.warning() exatamente
 * uma vez por novo alerta critico, independente de quantas telas estao montadas
 * lendo `alerts`. Mantem o reducer puro (compativel com Strict Mode + concurrent
 * rendering) e centraliza o efeito sonoro/tatil em um unico lugar.
 *
 * Chamado uma vez em app/_layout.tsx; retorna o unsubscribe para o cleanup.
 */
export function startCriticalAlertHapticListener(): () => void {
  let prevCriticalIds = new Set<string>(
    useAlertsStore
      .getState()
      .alerts.filter((a) => a.severity === 'critical')
      .map((a) => a.id),
  );
  let bootstrapped = prevCriticalIds.size > 0;

  return useAlertsStore.subscribe((state) => {
    const next = new Set(
      state.alerts.filter((a) => a.severity === 'critical').map((a) => a.id),
    );

    let hasNew = false;
    for (const id of next) {
      if (!prevCriticalIds.has(id)) {
        hasNew = true;
        break;
      }
    }

    // Skip a primeira sync apos hidratacao para nao vibrar com criticos
    // pre-existentes recuperados do estado em memoria.
    if (hasNew && bootstrapped) {
      haptic.warning();
    }

    prevCriticalIds = next;
    bootstrapped = true;
  });
}
