import type { Lead, RiskLabel, LeadStatus } from '@/services/mocks/analystApi';

export type BadgeTone = 'info' | 'warn' | 'success' | 'neutral' | 'critical' | 'accent';

export const VEHICLE_LABEL: Record<Lead['vehicleModel'], string> = {
  ranger: 'Ranger',
  maverick: 'Maverick',
  territory: 'Territory',
  mustang: 'Mustang',
  raptor: 'F-150 Raptor',
};

export const PLAN_LABEL: Record<Lead['plan'], string> = {
  agro: 'Agro',
  urban: 'Urban',
  premium: 'Premium',
};

export const STATUS_LABEL: Record<LeadStatus, string> = {
  novo: 'Novo',
  contactado: 'Contactado',
  convertido: 'Convertido',
  perdido: 'Perdido',
};

export const STATUS_TONE: Record<LeadStatus, BadgeTone> = {
  novo: 'accent',
  contactado: 'warn',
  convertido: 'success',
  perdido: 'neutral',
};

export const RISK_TONE: Record<RiskLabel, BadgeTone> = {
  alto: 'critical',
  moderado: 'warn',
  baixo: 'success',
};
