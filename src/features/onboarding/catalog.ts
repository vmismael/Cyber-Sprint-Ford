import type { VehicleModel, UsageStyle } from '@/stores/useUserStore';
import type { PlanId } from '@/theme/plans';

export const vehicleCatalog: Record<
  VehicleModel,
  { label: string; tagline: string; segment: string }
> = {
  ranger: { label: 'Ranger', tagline: 'Picape robusta', segment: 'Off-road' },
  maverick: { label: 'Maverick', tagline: 'Picape compacta', segment: 'Versátil' },
  territory: { label: 'Territory', tagline: 'SUV familiar', segment: 'Urbano' },
  mustang: { label: 'Mustang', tagline: 'Esportivo icônico', segment: 'Performance' },
  raptor: { label: 'F-150 Raptor', tagline: 'Off-road extremo', segment: 'Performance' },
};

export const usageCatalog: Record<UsageStyle, { label: string; description: string }> = {
  urban: { label: 'Urbano', description: 'Trânsito de cidade, trajetos curtos' },
  rural: { label: 'Rural', description: 'Estradas de terra, terreno acidentado' },
  mixed: { label: 'Misto', description: 'Cidade durante a semana, viagens nos finais' },
  performance: { label: 'Performance', description: 'Condução esportiva e alta rotação' },
};

export const planCatalog: Record<
  PlanId,
  { label: string; price: string; pitch: string; perks: readonly string[] }
> = {
  agro: {
    label: 'Agro',
    price: 'R$ 89/mês',
    pitch: 'Para quem encara a estrada de terra',
    perks: ['Alertas de terreno', 'Revisão reforçada', 'Suporte 24h em rota'],
  },
  urban: {
    label: 'Urban',
    price: 'R$ 59/mês',
    pitch: 'Para o dia a dia da cidade',
    perks: ['Rotas inteligentes', 'Cashback em combustível', 'Leva-e-traz padrão'],
  },
  premium: {
    label: 'Premium',
    price: 'R$ 149/mês',
    pitch: 'A experiência Ford completa',
    perks: ['Comandos de voz', 'Agendamento 1-tap', 'Concierge dedicado'],
  },
};
