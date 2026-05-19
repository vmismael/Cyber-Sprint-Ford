import type { UserProfile, UsageStyle } from '@/stores/useUserStore';

export type SubmitProfileResponse = {
  riskScore: number;
  riskLabel: 'baixo' | 'moderado' | 'alto';
  recommendedServiceInDays: number;
};

const delay = (min = 300, max = 600) =>
  new Promise<void>((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min)) + min),
  );

const usageWeight: Record<UsageStyle, number> = {
  urban: 0.8,
  mixed: 1.0,
  rural: 1.3,
  performance: 1.5,
};

export async function submitProfile(profile: UserProfile): Promise<SubmitProfileResponse> {
  await delay();

  const kmFactor = Math.min(profile.monthlyKm / 1500, 2);
  const raw = kmFactor * usageWeight[profile.usageStyle];
  const riskScore = Math.min(Math.round(raw * 50), 100);

  const riskLabel: SubmitProfileResponse['riskLabel'] =
    riskScore < 35 ? 'baixo' : riskScore < 70 ? 'moderado' : 'alto';

  const recommendedServiceInDays = riskScore < 35 ? 90 : riskScore < 70 ? 60 : 30;

  return { riskScore, riskLabel, recommendedServiceInDays };
}
