import { create } from 'zustand';
import type { Alert } from '@/services/mocks/alertsApi';

type AlertsState = {
  alerts: Alert[];
  dismissedKeys: string[];
  syncFromEvaluation: (incoming: Alert[]) => void;
  dismiss: (id: string) => void;
  clearDismissed: () => void;
};

function shallowEqualAlerts(a: Alert[], b: Alert[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.id !== y.id || x.description !== y.description || x.severity !== y.severity) {
      return false;
    }
  }
  return true;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  dismissedKeys: [],

  syncFromEvaluation: (incoming) => {
    const state = get();
    const incomingIds = new Set(incoming.map((a) => a.id));

    const dismissedKeys = state.dismissedKeys.filter((id) => incomingIds.has(id));
    const visible = incoming.filter((a) => !dismissedKeys.includes(a.id));

    const byId = new Map(state.alerts.map((a) => [a.id, a]));
    const merged = visible.map((a) => {
      const prev = byId.get(a.id);
      if (prev && prev.severity === a.severity) {
        return prev.description === a.description
          ? prev
          : { ...a, createdAt: prev.createdAt };
      }
      return a;
    });

    const alertsChanged = !shallowEqualAlerts(merged, state.alerts);
    const dismissedChanged = dismissedKeys.length !== state.dismissedKeys.length;
    if (!alertsChanged && !dismissedChanged) return;

    set({
      alerts: alertsChanged ? merged : state.alerts,
      dismissedKeys: dismissedChanged ? dismissedKeys : state.dismissedKeys,
    });
  },

  dismiss: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== id),
      dismissedKeys: state.dismissedKeys.includes(id)
        ? state.dismissedKeys
        : [...state.dismissedKeys, id],
    })),

  clearDismissed: () => set({ dismissedKeys: [] }),
}));
