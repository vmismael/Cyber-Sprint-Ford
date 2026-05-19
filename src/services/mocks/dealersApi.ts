import { haversineKm } from '@/utils/distance';
import type { Dealer, LatLng, ServiceKind } from '@/types/scheduling';

export const DEFAULT_ORIGIN: LatLng = {
  latitude: -23.5613,
  longitude: -46.6565,
};

const DEALERS: Dealer[] = [
  {
    id: 'ford-vila-olimpia',
    name: 'Ford Vila Olímpia',
    address: 'Av. das Nações Unidas, 12500 — Vila Olímpia, São Paulo',
    coords: { latitude: -23.5953, longitude: -46.6862 },
    rating: 4.8,
    promotions: [
      { id: 'promo-revisao-15', label: '15% off em revisão', discountPct: 15 },
      { id: 'promo-pneus', label: 'Pneus a partir de R$ 499', discountPct: 10 },
    ],
    services: ['revision', 'oil-change', 'tires', 'diagnostics', 'other'],
  },
  {
    id: 'ford-anhanguera',
    name: 'Ford Anhanguera',
    address: 'Rod. Anhanguera, km 18 — Pirituba, São Paulo',
    coords: { latitude: -23.4795, longitude: -46.7406 },
    rating: 4.5,
    promotions: [{ id: 'promo-oleo', label: 'Troca de óleo grátis', discountPct: 100 }],
    services: ['revision', 'oil-change', 'diagnostics'],
  },
  {
    id: 'ford-tatuape',
    name: 'Ford Tatuapé',
    address: 'Av. Celso Garcia, 3450 — Tatuapé, São Paulo',
    coords: { latitude: -23.5409, longitude: -46.5732 },
    rating: 4.6,
    promotions: [],
    services: ['revision', 'oil-change', 'tires', 'other'],
  },
  {
    id: 'ford-morumbi',
    name: 'Ford Morumbi',
    address: 'Av. Giovanni Gronchi, 5930 — Vila Andrade, São Paulo',
    coords: { latitude: -23.6228, longitude: -46.7156 },
    rating: 4.7,
    promotions: [{ id: 'promo-diag', label: 'Diagnóstico OBD2 grátis', discountPct: 100 }],
    services: ['revision', 'diagnostics', 'tires'],
  },
  {
    id: 'ford-osasco',
    name: 'Ford Osasco',
    address: 'Av. dos Autonomistas, 4500 — Vila Yara, Osasco',
    coords: { latitude: -23.5328, longitude: -46.7916 },
    rating: 4.3,
    promotions: [],
    services: ['revision', 'oil-change', 'tires'],
  },
  {
    id: 'ford-santo-andre',
    name: 'Ford Santo André',
    address: 'Av. Industrial, 1200 — Centro, Santo André',
    coords: { latitude: -23.6644, longitude: -46.5295 },
    rating: 4.4,
    promotions: [{ id: 'promo-revisao-10', label: '10% off em revisão', discountPct: 10 }],
    services: ['revision', 'oil-change', 'diagnostics', 'other'],
  },
  {
    id: 'ford-campinas',
    name: 'Ford Campinas',
    address: 'Av. John Boyd Dunlop, 9000 — Campinas',
    coords: { latitude: -22.9568, longitude: -47.0626 },
    rating: 4.6,
    promotions: [],
    services: ['revision', 'oil-change', 'tires', 'diagnostics'],
  },
  {
    id: 'ford-sorocaba',
    name: 'Ford Sorocaba',
    address: 'Av. Itavuvu, 5800 — Jardim Paulista, Sorocaba',
    coords: { latitude: -23.4781, longitude: -47.4456 },
    rating: 4.2,
    promotions: [{ id: 'promo-tires', label: 'Pneu agro 20% off', discountPct: 20 }],
    services: ['revision', 'tires', 'other'],
  },
  {
    id: 'ford-ribeirao',
    name: 'Ford Ribeirão Preto',
    address: 'Av. Presidente Vargas, 2200 — Ribeirão Preto',
    coords: { latitude: -21.1956, longitude: -47.8063 },
    rating: 4.5,
    promotions: [],
    services: ['revision', 'oil-change', 'tires', 'diagnostics', 'other'],
  },
  {
    id: 'ford-rural-itu',
    name: 'Ford Itu Rural',
    address: 'Rod. Marechal Rondon, km 100 — Itu',
    coords: { latitude: -23.2641, longitude: -47.2997 },
    rating: 4.4,
    promotions: [
      { id: 'promo-agro', label: 'Pacote Agro -25%', discountPct: 25 },
    ],
    services: ['revision', 'tires', 'diagnostics', 'other'],
  },
];

const delay = (min = 200, max = 500) =>
  new Promise<void>((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min)) + min),
  );

function withDistance(dealers: Dealer[], origin: LatLng): Dealer[] {
  return dealers
    .map((d) => ({ ...d, distanceKm: haversineKm(origin, d.coords) }))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}

export async function fetchDealers(origin: LatLng = DEFAULT_ORIGIN): Promise<Dealer[]> {
  await delay(300, 500);
  return withDistance(DEALERS, origin);
}

export async function fetchDealerById(id: string): Promise<Dealer | null> {
  await delay(150, 300);
  const dealer = DEALERS.find((d) => d.id === id) ?? null;
  if (!dealer) return null;
  return { ...dealer, distanceKm: haversineKm(DEFAULT_ORIGIN, dealer.coords) };
}

const ADDRESS_DICT = [
  'Rua Augusta',
  'Av. Paulista',
  'Av. Brigadeiro Faria Lima',
  'Av. Rebouças',
  'Rua Oscar Freire',
  'Av. Ibirapuera',
  'Rua Haddock Lobo',
  'Av. Berrini',
];

export async function fetchAddressSuggestions(query: string): Promise<string[]> {
  await delay(200, 400);
  if (query.trim().length < 2) return [];
  const q = query.toLowerCase();
  const matches = ADDRESS_DICT.filter((a) => a.toLowerCase().includes(q));
  const base = matches.length > 0 ? matches : ADDRESS_DICT.slice(0, 4);
  return base.slice(0, 5).map((street, i) => `${street}, ${100 + i * 47} — São Paulo, SP`);
}

export function serviceLabelFor(s: ServiceKind): string {
  return s;
}
