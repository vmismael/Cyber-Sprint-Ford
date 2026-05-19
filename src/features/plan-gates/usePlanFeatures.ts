import { useMemo } from 'react';
import { usePlanStore } from '@/stores/usePlanStore';
import type { PlanId } from '@/theme/plans';

export type FeatureKey =
  | 'terrainAlerts'
  | 'smartRoute'
  | 'voiceCommand'
  | 'oneTapScheduling'
  | 'pickupBadge';

const planFeatures: Record<PlanId, ReadonlySet<FeatureKey>> = {
  agro: new Set<FeatureKey>(['terrainAlerts']),
  urban: new Set<FeatureKey>(['smartRoute']),
  premium: new Set<FeatureKey>([
    'voiceCommand',
    'oneTapScheduling',
    'pickupBadge',
    'smartRoute',
  ]),
};

export type PlanFeatureApi = {
  plan: PlanId;
  has: (key: FeatureKey) => boolean;
};

export function usePlanFeatures(): PlanFeatureApi {
  const plan = usePlanStore((s) => s.plan);
  return useMemo<PlanFeatureApi>(
    () => ({
      plan,
      has: (key) => planFeatures[plan].has(key),
    }),
    [plan],
  );
}
