export const serviceKinds = [
  'revision',
  'oil-change',
  'tires',
  'diagnostics',
  'other',
] as const;
export type ServiceKind = (typeof serviceKinds)[number];

export const deliveryModes = ['in-person', 'pickup-delivery'] as const;
export type DeliveryMode = (typeof deliveryModes)[number];

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type Promotion = {
  id: string;
  label: string;
  discountPct: number;
};

export type Dealer = {
  id: string;
  name: string;
  address: string;
  coords: LatLng;
  rating: number;
  distanceKm?: number;
  promotions: Promotion[];
  services: ServiceKind[];
};

export type SchedulingDraft = {
  dealerId?: string;
  service?: ServiceKind;
  mode?: DeliveryMode;
  pickupAddress?: string;
  date?: string;
  slot?: string;
  notes?: string;
};

export type Booking = {
  id: string;
  protocol: string;
  dealerId: string;
  service: ServiceKind;
  mode: DeliveryMode;
  date: string;
  slot: string;
  pickupAddress?: string;
  notes?: string;
  createdAt: string;
  status: 'confirmed' | 'cancelled';
};

export const SERVICE_LABEL: Record<ServiceKind, string> = {
  revision: 'Revisão',
  'oil-change': 'Troca de óleo',
  tires: 'Pneus',
  diagnostics: 'Diagnóstico',
  other: 'Outros',
};

export const SERVICE_DESCRIPTION: Record<ServiceKind, string> = {
  revision: 'Revisão programada conforme intervalo do fabricante.',
  'oil-change': 'Troca de óleo + filtros e checklist rápido.',
  tires: 'Inspeção, alinhamento, balanceamento ou troca.',
  diagnostics: 'Leitura OBD2 e diagnóstico completo.',
  other: 'Conte para a concessionária o que precisa.',
};

export const MODE_LABEL: Record<DeliveryMode, string> = {
  'in-person': 'Presencial',
  'pickup-delivery': 'Leva e Traz',
};
