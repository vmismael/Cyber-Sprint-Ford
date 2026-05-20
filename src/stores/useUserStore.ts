import { create } from 'zustand';
import { z } from 'zod';
import { secureStorage } from '@/services/secureStorage';
import { useAuditStore } from './useAuditStore';
import type { PlanId } from '@/theme/plans';

const PROFILE_KEY = 'ford.user.profile';
const ONBOARDING_FLAG = 'ford.onboarding.complete';

export const vehicleModels = ['ranger', 'maverick', 'territory', 'mustang', 'raptor'] as const;
export type VehicleModel = (typeof vehicleModels)[number];

export const usageStyles = ['urban', 'rural', 'mixed', 'performance'] as const;
export type UsageStyle = (typeof usageStyles)[number];

export type UserProfile = {
  vehicleModel: VehicleModel;
  usageStyle: UsageStyle;
  monthlyKm: number;
  plan: PlanId;
  riskScore?: number;
};

export type DraftProfile = Partial<UserProfile>;

const userProfileSchema = z.object({
  vehicleModel: z.enum(['ranger', 'maverick', 'territory', 'mustang', 'raptor']),
  usageStyle: z.enum(['urban', 'rural', 'mixed', 'performance']),
  monthlyKm: z.number().min(0).max(50000),
  plan: z.enum(['agro', 'urban', 'premium']),
  riskScore: z.number().optional(),
});

type UserState = {
  hydrated: boolean;
  onboardingComplete: boolean;
  profile: UserProfile | null;
  draft: DraftProfile;
  hydrate: () => Promise<void>;
  updateDraft: (patch: DraftProfile) => void;
  resetDraft: () => void;
  commitProfile: (profile: UserProfile) => Promise<void>;
  updatePlan: (plan: PlanId) => Promise<void>;
  clearProfile: () => Promise<void>;
};

export const useUserStore = create<UserState>((set, get) => ({
  hydrated: false,
  onboardingComplete: false,
  profile: null,
  draft: {},

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const [rawProfile, flag] = await Promise.all([
        secureStorage.getItem(PROFILE_KEY),
        secureStorage.getItem(ONBOARDING_FLAG),
      ]);
      let profile: UserProfile | null = null;
      if (rawProfile) {
        const parsed = userProfileSchema.safeParse(JSON.parse(rawProfile));
        if (parsed.success) {
          profile = parsed.data;
        } else {
          // Dado corrompido ou schema desatualizado — descarta silenciosamente
          await secureStorage.removeItem(PROFILE_KEY);
        }
      }
      set({ hydrated: true, onboardingComplete: flag === '1', profile });
    } catch {
      set({ hydrated: true, onboardingComplete: false, profile: null });
    }
  },

  updateDraft: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),

  resetDraft: () => set({ draft: {} }),

  commitProfile: async (profile) => {
    await Promise.all([
      secureStorage.setItem(PROFILE_KEY, JSON.stringify(profile)),
      secureStorage.setItem(ONBOARDING_FLAG, '1'),
    ]);
    useAuditStore.getState().log('profile_updated', undefined, {
      vehicleModel: profile.vehicleModel,
      plan: profile.plan,
    });
    set({ profile, onboardingComplete: true, draft: {} });
  },

  updatePlan: async (plan) => {
    const cur = get().profile;
    if (!cur || cur.plan === plan) return;
    const next = { ...cur, plan };
    try {
      await secureStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      useAuditStore.getState().log('profile_updated', undefined, { plan });
      set({ profile: next });
    } catch {
      // mantém estado anterior em caso de falha de IO
    }
  },

  clearProfile: async () => {
    await Promise.all([
      secureStorage.removeItem(PROFILE_KEY),
      secureStorage.removeItem(ONBOARDING_FLAG),
    ]);
    set({ profile: null, onboardingComplete: false, draft: {} });
  },
}));
