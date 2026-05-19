import type { Coupon, FuelStation, Transaction, WalletData } from '@/features/cashback/types';

const delay = (min: number, max: number) =>
  new Promise<void>((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min)) + min),
  );

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_001',
    type: 'credit',
    amount: 18.50,
    description: 'Revisão dos 10.000 km',
    category: 'maintenance',
    date: '2026-04-28T10:30:00Z',
    dealerName: 'Ford Center SP Norte',
  },
  {
    id: 'tx_002',
    type: 'credit',
    amount: 12.00,
    description: 'Troca de óleo sintético',
    category: 'maintenance',
    date: '2026-04-15T14:00:00Z',
    dealerName: 'Ford Leste Veículos',
  },
  {
    id: 'tx_003',
    type: 'debit',
    amount: 30.00,
    description: 'Resgate em combustível',
    category: 'redemption',
    date: '2026-04-10T09:00:00Z',
  },
  {
    id: 'tx_004',
    type: 'credit',
    amount: 45.00,
    description: 'Troca de 4 pneus',
    category: 'tires',
    date: '2026-03-22T11:00:00Z',
    dealerName: 'Ford Center SP Norte',
  },
  {
    id: 'tx_005',
    type: 'credit',
    amount: 8.00,
    description: 'Alinhamento e balanceamento',
    category: 'other',
    date: '2026-03-10T15:30:00Z',
    dealerName: 'Ford Oeste Serviços',
  },
  {
    id: 'tx_006',
    type: 'debit',
    amount: 20.00,
    description: 'Resgate em manutenção',
    category: 'redemption',
    date: '2026-03-05T10:00:00Z',
  },
  {
    id: 'tx_007',
    type: 'credit',
    amount: 22.00,
    description: 'Revisão dos 20.000 km',
    category: 'maintenance',
    date: '2026-02-18T09:00:00Z',
    dealerName: 'Ford Leste Veículos',
  },
  {
    id: 'tx_008',
    type: 'credit',
    amount: 5.00,
    description: 'Diagnóstico elétrico',
    category: 'other',
    date: '2026-02-05T13:00:00Z',
    dealerName: 'Ford Center SP Norte',
  },
  {
    id: 'tx_009',
    type: 'debit',
    amount: 15.00,
    description: 'Resgate em combustível',
    category: 'redemption',
    date: '2026-01-20T10:00:00Z',
  },
  {
    id: 'tx_010',
    type: 'credit',
    amount: 35.00,
    description: 'Troca de pastilhas de freio',
    category: 'maintenance',
    date: '2026-01-08T11:30:00Z',
    dealerName: 'Ford Oeste Serviços',
  },
  {
    id: 'tx_011',
    type: 'credit',
    amount: 10.00,
    description: 'Lavagem completa premium',
    category: 'other',
    date: '2025-12-20T10:00:00Z',
    dealerName: 'Ford Center SP Norte',
  },
  {
    id: 'tx_012',
    type: 'credit',
    amount: 17.00,
    description: 'Troca de filtros (ar + combustível)',
    category: 'maintenance',
    date: '2025-12-05T14:00:00Z',
    dealerName: 'Ford Leste Veículos',
  },
];

const MOCK_COUPONS: Coupon[] = [
  {
    id: 'cp_001',
    title: 'R$ 20 em combustível',
    description: 'Desconto válido em qualquer abastecimento acima de R$ 80.',
    amount: 20.00,
    category: 'fuel',
    merchant: 'Posto Shell',
    expiresAt: '2026-06-30T23:59:59Z',
    distanceKm: 1.2,
    isNearby: true,
    plan: 'all',
    redeemed: false,
  },
  {
    id: 'cp_002',
    title: '15% na revisão',
    description: 'Desconto aplicado em revisões preventivas de 5.000 a 30.000 km.',
    amount: 15.00,
    category: 'maintenance',
    merchant: 'Ford Center SP Norte',
    expiresAt: '2026-05-31T23:59:59Z',
    distanceKm: 3.8,
    isNearby: true,
    plan: 'all',
    redeemed: false,
  },
  {
    id: 'cp_003',
    title: 'R$ 50 em 4 pneus',
    description: 'Desconto na compra de 4 pneus da linha Michelin ou Goodyear.',
    amount: 50.00,
    category: 'tires',
    merchant: 'Pneus Rápido',
    expiresAt: '2026-07-15T23:59:59Z',
    distanceKm: 6.5,
    isNearby: false,
    plan: 'urban',
    redeemed: false,
  },
  {
    id: 'cp_004',
    title: 'R$ 40 em combustível VIP',
    description: 'Benefício exclusivo Premium. Válido em postos conveniados Ford.',
    amount: 40.00,
    category: 'fuel',
    merchant: 'Ipiranga Conveniado',
    expiresAt: '2026-06-15T23:59:59Z',
    distanceKm: 8.2,
    isNearby: false,
    plan: 'premium',
    redeemed: false,
  },
  {
    id: 'cp_005',
    title: 'Alinhamento grátis',
    description: 'Alinhamento computadorizado gratuito na próxima revisão.',
    amount: 80.00,
    category: 'maintenance',
    merchant: 'Ford Leste Veículos',
    expiresAt: '2026-08-31T23:59:59Z',
    distanceKm: 12.4,
    isNearby: false,
    plan: 'agro',
    redeemed: false,
  },
  {
    id: 'cp_006',
    title: 'R$ 25 em combustível',
    description: 'Abastecimento com cashback imediato no app.',
    amount: 25.00,
    category: 'fuel',
    merchant: 'Posto BR',
    expiresAt: '2026-05-20T23:59:59Z',
    distanceKm: 18.7,
    isNearby: false,
    plan: 'all',
    redeemed: false,
  },
  {
    id: 'cp_007',
    title: '10% em pneus Agro',
    description: 'Desconto especial para pneus off-road e de alta tração.',
    amount: 10.00,
    category: 'tires',
    merchant: 'Borracharia do Campo',
    expiresAt: '2026-09-30T23:59:59Z',
    distanceKm: 22.0,
    isNearby: false,
    plan: 'agro',
    redeemed: false,
  },
  {
    id: 'cp_008',
    title: 'R$ 30 em revisão Urban',
    description: 'Revisão expressa 30 min. Desconto exclusivo plano Urban.',
    amount: 30.00,
    category: 'maintenance',
    merchant: 'Ford Oeste Serviços',
    expiresAt: '2026-07-01T23:59:59Z',
    distanceKm: 28.3,
    isNearby: false,
    plan: 'urban',
    redeemed: false,
  },
];

const MOCK_FUEL_STATIONS: FuelStation[] = [
  { id: 'fs_001', name: 'Shell Select', address: 'Av. Paulista, 1500 — Bela Vista', distanceKm: 0.8 },
  { id: 'fs_002', name: 'Ipiranga Conveniado', address: 'R. da Consolação, 300 — Consolação', distanceKm: 2.1 },
  { id: 'fs_003', name: 'Posto BR Centro', address: 'Av. 23 de Maio, 800 — Liberdade', distanceKm: 4.3 },
  { id: 'fs_004', name: 'Raízen Premium', address: 'Av. Rebouças, 1200 — Pinheiros', distanceKm: 6.7 },
];

export async function fetchWallet(): Promise<WalletData> {
  await delay(300, 500);
  return {
    balance: 127.50,
    transactions: MOCK_TRANSACTIONS,
  };
}

export async function fetchCoupons(planId: string): Promise<Coupon[]> {
  await delay(200, 400);
  return MOCK_COUPONS.filter((c) => c.plan === 'all' || c.plan === planId).sort(
    (a, b) => a.distanceKm - b.distanceKm,
  );
}

export async function fetchFuelStations(): Promise<FuelStation[]> {
  await delay(150, 250);
  return MOCK_FUEL_STATIONS;
}

export async function redeemCoupon(
  _couponId: string,
  _stationId: string,
): Promise<{ newBalance: number }> {
  await delay(600, 900);
  // Mock: subtract 20 from current balance as redemption cost
  return { newBalance: 107.50 };
}
