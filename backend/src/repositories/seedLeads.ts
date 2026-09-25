import type { Lead } from './types';

/** Dados fictícios de demonstração (mesmos clientes do mock do app). Nenhum dado real. */
export const SEED_LEADS: Lead[] = [
  { id: 'lead_001', clientName: 'Carlos Eduardo Mendes', email: 'carlos.mendes@exemplo.com', phone: '11987654321', vehicleModel: 'ranger', vehicleYear: 2023, odometerKm: 41200, plan: 'agro', service: 'Revisão Preventiva', aiScore: 92, riskLabel: 'alto', lastActivity: '2026-09-18T10:30:00Z', status: 'novo', estimatedRevenue: 1850 },
  { id: 'lead_002', clientName: 'Ana Paula Ferreira', email: 'ana.ferreira@exemplo.com', phone: '11976543210', vehicleModel: 'territory', vehicleYear: 2024, odometerKm: 18300, plan: 'urban', service: 'Troca de Pneus', aiScore: 78, riskLabel: 'moderado', lastActivity: '2026-09-17T14:15:00Z', status: 'contactado', estimatedRevenue: 920 },
  { id: 'lead_003', clientName: 'Roberto Alves Costa', email: 'roberto.costa@exemplo.com', phone: '19991234567', vehicleModel: 'ranger', vehicleYear: 2022, odometerKm: 67800, plan: 'agro', service: 'Diagnóstico', aiScore: 88, riskLabel: 'alto', lastActivity: '2026-09-16T09:00:00Z', status: 'novo', estimatedRevenue: 2400 },
  { id: 'lead_004', clientName: 'Fernanda Lima', email: 'fernanda.lima@exemplo.com', phone: '21998765432', vehicleModel: 'mustang', vehicleYear: 2024, odometerKm: 9800, plan: 'premium', service: 'Revisão Completa', aiScore: 95, riskLabel: 'alto', lastActivity: '2026-09-15T16:45:00Z', status: 'novo', estimatedRevenue: 3200 },
  { id: 'lead_005', clientName: 'Marcos Vinícius Rocha', email: 'marcos.rocha@exemplo.com', phone: '31987651234', vehicleModel: 'maverick', vehicleYear: 2023, odometerKm: 25400, plan: 'urban', service: 'Troca de Óleo', aiScore: 64, riskLabel: 'moderado', lastActivity: '2026-09-14T11:20:00Z', status: 'convertido', estimatedRevenue: 480 },
  { id: 'lead_006', clientName: 'Juliana Souza Prado', email: 'juliana.prado@exemplo.com', phone: '41996541230', vehicleModel: 'territory', vehicleYear: 2025, odometerKm: 6100, plan: 'urban', service: 'Revisão Preventiva', aiScore: 41, riskLabel: 'baixo', lastActivity: '2026-09-12T08:10:00Z', status: 'perdido', estimatedRevenue: 650 },
];
