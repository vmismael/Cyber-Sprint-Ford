export type PeriodFilter = '7d' | '30d' | '90d';
export type PlanFilter = 'agro' | 'urban' | 'premium' | 'all';
export type ServiceFilter = 'revision' | 'oil-change' | 'tires' | 'diagnostics' | 'all';

export interface AnalystFilters {
  period: PeriodFilter;
  plan: PlanFilter;
  service: ServiceFilter;
}

export interface KPIs {
  vinShare: number;
  activeLeads: number;
  monthlyBookings: number;
  conversionRate: number;
}

export interface BarPoint {
  label: string;
  bookings: number;
  conversions: number;
}

export type VehicleModel = 'ranger' | 'maverick' | 'territory' | 'mustang' | 'raptor';
export type LeadPlan = 'agro' | 'urban' | 'premium';
export type RiskLabel = 'baixo' | 'moderado' | 'alto';
export type LeadStatus = 'novo' | 'contactado' | 'convertido' | 'perdido';

export interface Lead {
  id: string;
  clientName: string;
  vehicleModel: VehicleModel;
  plan: LeadPlan;
  service: string;
  aiScore: number;
  riskLabel: RiskLabel;
  lastActivity: string;
  status: LeadStatus;
  estimatedRevenue: number;
}

export interface LeadEvent {
  date: string;
  event: string;
  icon: string;
}

export interface LeadDetail extends Lead {
  phone: string;
  email: string;
  vehicleYear: number;
  odometerKm: number;
  timeline: LeadEvent[];
}

const delay = (min = 200, max = 400) =>
  new Promise<void>((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min)) + min),
  );

const jitter = (base: number, pct = 0.03) =>
  Math.round(base * (1 + (Math.random() * 2 - 1) * pct) * 10) / 10;

const BASE_KPIs: KPIs = {
  vinShare: 67.3,
  activeLeads: 38,
  monthlyBookings: 142,
  conversionRate: 34.7,
};

const SERIES_DATA: Record<PeriodFilter, BarPoint[]> = {
  '7d': [
    { label: 'Seg', bookings: 18, conversions: 6 },
    { label: 'Ter', bookings: 22, conversions: 8 },
    { label: 'Qua', bookings: 15, conversions: 5 },
    { label: 'Qui', bookings: 27, conversions: 10 },
    { label: 'Sex', bookings: 31, conversions: 12 },
    { label: 'Sáb', bookings: 14, conversions: 4 },
    { label: 'Dom', bookings: 9, conversions: 3 },
  ],
  '30d': [
    { label: 'S1', bookings: 98, conversions: 32 },
    { label: 'S2', bookings: 112, conversions: 40 },
    { label: 'S3', bookings: 87, conversions: 28 },
    { label: 'S4', bookings: 142, conversions: 51 },
  ],
  '90d': [
    { label: 'Jan', bookings: 138, conversions: 46 },
    { label: 'Fev', bookings: 124, conversions: 42 },
    { label: 'Mar', bookings: 156, conversions: 56 },
    { label: 'Abr', bookings: 142, conversions: 49 },
    { label: 'Mai', bookings: 168, conversions: 61 },
    { label: 'Jun', bookings: 151, conversions: 54 },
  ],
};

const ALL_LEADS: Lead[] = [
  {
    id: 'lead_001',
    clientName: 'Carlos Eduardo Mendes',
    vehicleModel: 'ranger',
    plan: 'agro',
    service: 'Revisão Preventiva',
    aiScore: 92,
    riskLabel: 'alto',
    lastActivity: '2026-05-08T10:30:00Z',
    status: 'novo',
    estimatedRevenue: 1850,
  },
  {
    id: 'lead_002',
    clientName: 'Ana Paula Ferreira',
    vehicleModel: 'territory',
    plan: 'urban',
    service: 'Troca de Pneus',
    aiScore: 78,
    riskLabel: 'moderado',
    lastActivity: '2026-05-07T14:15:00Z',
    status: 'contactado',
    estimatedRevenue: 920,
  },
  {
    id: 'lead_003',
    clientName: 'Roberto Alves Costa',
    vehicleModel: 'ranger',
    plan: 'agro',
    service: 'Diagnóstico',
    aiScore: 88,
    riskLabel: 'alto',
    lastActivity: '2026-05-06T09:00:00Z',
    status: 'novo',
    estimatedRevenue: 2400,
  },
  {
    id: 'lead_004',
    clientName: 'Fernanda Lima',
    vehicleModel: 'mustang',
    plan: 'premium',
    service: 'Revisão Completa',
    aiScore: 95,
    riskLabel: 'alto',
    lastActivity: '2026-05-08T08:00:00Z',
    status: 'novo',
    estimatedRevenue: 3200,
  },
  {
    id: 'lead_005',
    clientName: 'Marcos Vinicius Souza',
    vehicleModel: 'maverick',
    plan: 'urban',
    service: 'Troca de Óleo',
    aiScore: 61,
    riskLabel: 'moderado',
    lastActivity: '2026-05-05T16:20:00Z',
    status: 'contactado',
    estimatedRevenue: 340,
  },
  {
    id: 'lead_006',
    clientName: 'Juliana Torres Barros',
    vehicleModel: 'territory',
    plan: 'premium',
    service: 'Revisão Preventiva',
    aiScore: 83,
    riskLabel: 'moderado',
    lastActivity: '2026-05-04T11:45:00Z',
    status: 'convertido',
    estimatedRevenue: 1600,
  },
  {
    id: 'lead_007',
    clientName: 'Pedro Henrique Nunes',
    vehicleModel: 'ranger',
    plan: 'agro',
    service: 'Diagnóstico',
    aiScore: 69,
    riskLabel: 'moderado',
    lastActivity: '2026-05-03T13:30:00Z',
    status: 'contactado',
    estimatedRevenue: 780,
  },
  {
    id: 'lead_008',
    clientName: 'Camila Rocha Pereira',
    vehicleModel: 'maverick',
    plan: 'urban',
    service: 'Revisão Preventiva',
    aiScore: 55,
    riskLabel: 'baixo',
    lastActivity: '2026-05-02T10:00:00Z',
    status: 'perdido',
    estimatedRevenue: 890,
  },
  {
    id: 'lead_009',
    clientName: 'Ricardo Cavalcante',
    vehicleModel: 'mustang',
    plan: 'premium',
    service: 'Diagnóstico Premium',
    aiScore: 90,
    riskLabel: 'alto',
    lastActivity: '2026-05-07T17:00:00Z',
    status: 'novo',
    estimatedRevenue: 4100,
  },
  {
    id: 'lead_010',
    clientName: 'Beatriz Nascimento',
    vehicleModel: 'territory',
    plan: 'urban',
    service: 'Troca de Pneus',
    aiScore: 74,
    riskLabel: 'moderado',
    lastActivity: '2026-05-06T15:30:00Z',
    status: 'contactado',
    estimatedRevenue: 1100,
  },
  {
    id: 'lead_011',
    clientName: 'Thiago Oliveira',
    vehicleModel: 'ranger',
    plan: 'agro',
    service: 'Revisão Completa',
    aiScore: 86,
    riskLabel: 'alto',
    lastActivity: '2026-05-08T07:45:00Z',
    status: 'novo',
    estimatedRevenue: 2750,
  },
  {
    id: 'lead_012',
    clientName: 'Larissa Monteiro',
    vehicleModel: 'maverick',
    plan: 'premium',
    service: 'Revisão Preventiva',
    aiScore: 77,
    riskLabel: 'moderado',
    lastActivity: '2026-05-05T09:15:00Z',
    status: 'convertido',
    estimatedRevenue: 1350,
  },
];

const LEAD_DETAILS: Record<string, Omit<LeadDetail, keyof Lead>> = {
  lead_001: {
    phone: '(11) 98765-4321',
    email: 'carlos.mendes@email.com',
    vehicleYear: 2022,
    odometerKm: 9240,
    timeline: [
      { date: '2026-05-08T10:30:00Z', event: 'Alerta de revisão gerado pela IA (9.240 km)', icon: 'alert-circle-outline' },
      { date: '2026-05-08T10:31:00Z', event: 'Lead criado automaticamente e enviado ao analista', icon: 'person-add-outline' },
      { date: '2026-05-07T14:00:00Z', event: 'Telemetria: pressão do pneu traseiro esquerdo em 27 PSI', icon: 'warning-outline' },
      { date: '2026-05-01T08:00:00Z', event: 'Perfil de risco atualizado para Alto', icon: 'trending-up-outline' },
    ],
  },
  lead_002: {
    phone: '(21) 99234-5678',
    email: 'anapaula.ferreira@email.com',
    vehicleYear: 2023,
    odometerKm: 7800,
    timeline: [
      { date: '2026-05-07T14:15:00Z', event: 'Analista entrou em contato via app', icon: 'call-outline' },
      { date: '2026-05-06T09:00:00Z', event: 'Alerta de desgaste de pneus detectado', icon: 'alert-circle-outline' },
      { date: '2026-05-06T09:01:00Z', event: 'Lead criado e encaminhado', icon: 'person-add-outline' },
    ],
  },
  lead_004: {
    phone: '(11) 91234-0000',
    email: 'fernanda.lima@premiumauto.com',
    vehicleYear: 2024,
    odometerKm: 12100,
    timeline: [
      { date: '2026-05-08T08:00:00Z', event: 'Revisão programada detectada pela IA', icon: 'alert-circle-outline' },
      { date: '2026-05-08T08:01:00Z', event: 'Lead Premium criado com prioridade máxima', icon: 'star-outline' },
      { date: '2026-05-07T20:00:00Z', event: 'Telemetria: temperatura do motor 101°C', icon: 'thermometer-outline' },
      { date: '2026-05-01T00:00:00Z', event: 'Plano atualizado para Premium', icon: 'card-outline' },
    ],
  },
};

const SVC_MAP: Record<string, string[]> = {
  revision: ['Revisão Preventiva', 'Revisão Completa'],
  'oil-change': ['Troca de Óleo'],
  tires: ['Troca de Pneus'],
  diagnostics: ['Diagnóstico', 'Diagnóstico Premium'],
};

function applyFilters(leads: Lead[], filters: AnalystFilters): Lead[] {
  return leads.filter((l) => {
    if (filters.plan !== 'all' && l.plan !== filters.plan) return false;
    if (filters.service !== 'all') {
      const allowed = SVC_MAP[filters.service];
      if (allowed && !allowed.includes(l.service)) return false;
    }
    return true;
  });
}

export async function fetchKPIs(_filters: AnalystFilters): Promise<KPIs> {
  await delay(200, 400);
  return {
    vinShare: jitter(BASE_KPIs.vinShare),
    activeLeads: Math.round(jitter(BASE_KPIs.activeLeads)),
    monthlyBookings: Math.round(jitter(BASE_KPIs.monthlyBookings)),
    conversionRate: jitter(BASE_KPIs.conversionRate),
  };
}

// Peso de participação no volume total + multiplicador de conversão por plano.
// Urban domina volume; Premium converte mais; Agro fica no meio.
const PLAN_WEIGHTS: Record<PlanFilter, { bookings: number; conversionMult: number }> = {
  all: { bookings: 1, conversionMult: 1 },
  urban: { bookings: 0.5, conversionMult: 0.85 },
  agro: { bookings: 0.32, conversionMult: 1.05 },
  premium: { bookings: 0.18, conversionMult: 1.6 },
};

export async function fetchSeries(filters: AnalystFilters): Promise<BarPoint[]> {
  await delay(250, 450);
  const base = SERIES_DATA[filters.period];
  const w = PLAN_WEIGHTS[filters.plan];
  if (filters.plan === 'all') return [...base];
  return base.map((p) => {
    const bookings = Math.max(1, Math.round(p.bookings * w.bookings));
    const conversions = Math.min(
      bookings,
      Math.max(1, Math.round(p.conversions * w.bookings * w.conversionMult)),
    );
    return { label: p.label, bookings, conversions };
  });
}

export async function fetchLeads(filters: AnalystFilters): Promise<Lead[]> {
  await delay(300, 600);
  const filtered = applyFilters(ALL_LEADS, filters);
  return [...filtered].sort((a, b) => b.aiScore - a.aiScore);
}

export async function fetchLeadById(id: string): Promise<LeadDetail | null> {
  await delay(200, 350);
  const lead = ALL_LEADS.find((l) => l.id === id);
  if (!lead) return null;
  const extra = LEAD_DETAILS[id] ?? {
    phone: '(00) 00000-0000',
    email: 'cliente@ford.com.br',
    vehicleYear: 2022,
    odometerKm: 8000,
    timeline: [
      { date: new Date().toISOString(), event: 'Lead criado automaticamente pela IA', icon: 'person-add-outline' },
    ],
  };
  return { ...lead, ...extra };
}
