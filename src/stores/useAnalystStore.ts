import { create } from 'zustand';
import {
  fetchKPIs,
  fetchLeads,
  fetchSeries,
  type AnalystFilters,
  type BarPoint,
  type KPIs,
  type Lead,
} from '@/services/mocks/analystApi';

type AnalystState = {
  kpis: KPIs | null;
  series: BarPoint[];
  leads: Lead[];
  filters: AnalystFilters;
  loading: boolean;
  error: string | null;
  fetchDashboard: () => Promise<void>;
  setFilter: (patch: Partial<AnalystFilters>) => void;
};

// External counter — not in state to avoid triggering re-renders.
// Incremented on each fetchDashboard call; responses from stale calls are discarded.
let _seq = 0;

export const useAnalystStore = create<AnalystState>((set, get) => ({
  kpis: null,
  series: [],
  leads: [],
  filters: { period: '30d', plan: 'all', service: 'all' },
  loading: false,
  error: null,

  fetchDashboard: async () => {
    const mySeq = ++_seq;
    const { filters } = get();
    set({ loading: true, error: null });
    try {
      const [kpis, series, leads] = await Promise.all([
        fetchKPIs(filters),
        fetchSeries(filters),
        fetchLeads(filters),
      ]);
      if (mySeq !== _seq) return; // stale response — a newer request is in flight
      set({ kpis, series, leads, loading: false });
    } catch {
      if (mySeq !== _seq) return;
      set({ loading: false, error: 'Falha ao carregar dados do painel.' });
    }
  },

  setFilter: (patch) => {
    set((s) => ({ filters: { ...s.filters, ...patch } }));
    get().fetchDashboard();
  },
}));
