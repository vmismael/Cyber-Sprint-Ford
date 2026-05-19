import { create } from 'zustand';
import type { PlanId } from '@/theme/plans';

type PlanStore = {
  plan: PlanId;
  setPlan: (plan: PlanId) => void;
};

export const usePlanStore = create<PlanStore>((set) => ({
  plan: 'urban',
  setPlan: (plan) => set({ plan }),
}));
