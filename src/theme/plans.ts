export const planAccents = {
  agro: {
    accent: '#D97706',
    accentSoft: 'rgba(217,119,6,0.18)',
    accentContrast: '#0A0E14',
    label: 'Agro',
    description: 'Robusto, terreno acidentado',
    tint: 'rgba(217,119,6,0.06)',
    glow: { color: '#D97706', opacity: 0.45, radius: 18 },
    pressFeedback: 'sharp',
  },
  urban: {
    accent: '#6FA3FF',
    accentSoft: 'rgba(111,163,255,0.18)',
    accentContrast: '#0A0E14',
    label: 'Urban',
    description: 'Limpo, minimalista',
    tint: 'rgba(111,163,255,0.05)',
    glow: { color: '#6FA3FF', opacity: 0.4, radius: 16 },
    pressFeedback: 'soft',
  },
  premium: {
    accent: '#D4AF37',
    accentSoft: 'rgba(212,175,55,0.18)',
    accentContrast: '#0A0E14',
    label: 'Premium',
    description: 'Luxuoso, sofisticado',
    tint: 'rgba(212,175,55,0.07)',
    glow: { color: '#D4AF37', opacity: 0.55, radius: 22 },
    pressFeedback: 'lift',
  },
} as const;

export type PlanId = keyof typeof planAccents;
export type PlanAccent = (typeof planAccents)[PlanId];
export type PressFeedback = PlanAccent['pressFeedback'];

export const planIds: readonly PlanId[] = ['agro', 'urban', 'premium'] as const;
