import type { TelemetryReading } from '@/features/telemetry/simulator';
import type { PlanId } from '@/theme/plans';

export type AlertSeverity = 'warn' | 'critical';

export type AlertCategory =
  | 'maintenance'
  | 'tire-low'
  | 'tire-high'
  | 'engine'
  | 'fuel'
  | 'battery'
  | 'terrain';

export type Alert = {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  createdAt: number;
};

const REVISION_THRESHOLD_KM = 9000;
const TIRE_LOW_PSI = 28;
const TIRE_HIGH_PSI = 36;
const ENGINE_TEMP_WARN = 100;
const ENGINE_TEMP_CRITICAL = 108;
const FUEL_LOW_PCT = 15;
const BATTERY_LOW_VOLTS = 11.8;
const TERRAIN_TIRE_SPREAD_PSI = 2.5;

export function alertKey(category: AlertCategory, severity: AlertSeverity): string {
  return `${category}:${severity}`;
}

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function lowestTire(reading: TelemetryReading): { name: string; psi: number } {
  const entries: { name: string; psi: number }[] = [
    { name: 'dianteiro esquerdo', psi: reading.tirePressurePsi.frontLeft },
    { name: 'dianteiro direito', psi: reading.tirePressurePsi.frontRight },
    { name: 'traseiro esquerdo', psi: reading.tirePressurePsi.rearLeft },
    { name: 'traseiro direito', psi: reading.tirePressurePsi.rearRight },
  ];
  return entries.reduce((min, cur) => (cur.psi < min.psi ? cur : min), entries[0]);
}

function highestTire(reading: TelemetryReading): { name: string; psi: number } {
  const entries: { name: string; psi: number }[] = [
    { name: 'dianteiro esquerdo', psi: reading.tirePressurePsi.frontLeft },
    { name: 'dianteiro direito', psi: reading.tirePressurePsi.frontRight },
    { name: 'traseiro esquerdo', psi: reading.tirePressurePsi.rearLeft },
    { name: 'traseiro direito', psi: reading.tirePressurePsi.rearRight },
  ];
  return entries.reduce((max, cur) => (cur.psi > max.psi ? cur : max), entries[0]);
}

export function evaluateAlerts(reading: TelemetryReading, plan?: PlanId): Alert[] {
  const out: Alert[] = [];
  const ts = reading.timestamp;

  if (reading.odometerKm >= REVISION_THRESHOLD_KM) {
    out.push({
      id: alertKey('maintenance', 'warn'),
      category: 'maintenance',
      severity: 'warn',
      title: 'Revisão programada próxima',
      description: `Hodômetro em ${reading.odometerKm.toFixed(0)} km. Recomendamos antecipar a revisão dos 10.000 km.`,
      createdAt: ts,
    });
  }

  const minTire = lowestTire(reading);
  if (minTire.psi < TIRE_LOW_PSI) {
    out.push({
      id: alertKey('tire-low', 'warn'),
      category: 'tire-low',
      severity: 'warn',
      title: 'Pressão baixa nos pneus',
      description: `Pneu ${minTire.name} em ${minTire.psi.toFixed(1)} PSI. Calibre na próxima parada.`,
      createdAt: ts,
    });
  }

  const maxTire = highestTire(reading);
  if (maxTire.psi > TIRE_HIGH_PSI) {
    out.push({
      id: alertKey('tire-high', 'warn'),
      category: 'tire-high',
      severity: 'warn',
      title: 'Pressão acima do recomendado',
      description: `Pneu ${maxTire.name} em ${maxTire.psi.toFixed(1)} PSI. Verifique calibragem.`,
      createdAt: ts,
    });
  }

  if (reading.engineTempC >= ENGINE_TEMP_CRITICAL) {
    out.push({
      id: alertKey('engine', 'critical'),
      category: 'engine',
      severity: 'critical',
      title: 'Superaquecimento do motor',
      description: `Temperatura em ${reading.engineTempC.toFixed(1)}°C. Reduza o esforço e procure assistência.`,
      createdAt: ts,
    });
  } else if (reading.engineTempC >= ENGINE_TEMP_WARN) {
    out.push({
      id: alertKey('engine', 'warn'),
      category: 'engine',
      severity: 'warn',
      title: 'Motor aquecido',
      description: `Temperatura em ${reading.engineTempC.toFixed(1)}°C. Monitore nas próximas leituras.`,
      createdAt: ts,
    });
  }

  if (reading.fuelLevelPct < FUEL_LOW_PCT) {
    out.push({
      id: alertKey('fuel', 'warn'),
      category: 'fuel',
      severity: 'warn',
      title: 'Combustível baixo',
      description: `Nível em ${reading.fuelLevelPct.toFixed(0)}%. Próximos cupons de combustível disponíveis na carteira.`,
      createdAt: ts,
    });
  }

  if (reading.batteryVolts < BATTERY_LOW_VOLTS) {
    out.push({
      id: alertKey('battery', 'critical'),
      category: 'battery',
      severity: 'critical',
      title: 'Tensão de bateria baixa',
      description: `Tensão em ${reading.batteryVolts.toFixed(2)}V. Agende inspeção elétrica.`,
      createdAt: ts,
    });
  }

  if (plan === 'agro') {
    const tireSpread = maxTire.psi - minTire.psi;
    if (tireSpread >= TERRAIN_TIRE_SPREAD_PSI) {
      out.push({
        id: alertKey('terrain', 'warn'),
        category: 'terrain',
        severity: 'warn',
        title: 'Terreno irregular detectado',
        description: `Variação de ${tireSpread.toFixed(1)} PSI entre pneus. Reduza velocidade e monitore a suspensão.`,
        createdAt: ts,
      });
    }
  }

  return out;
}

export type PredictedMaintenance = {
  service: string;
  estimatedKm: number;
  estimatedDate: string;
  confidence: number;
};

export async function fetchPredictedMaintenance(
  reading: TelemetryReading,
): Promise<PredictedMaintenance> {
  const remainingKm = Math.max(0, 10000 - reading.odometerKm);
  const daysAhead = Math.round(remainingKm / 50) + 7;
  const date = new Date(reading.timestamp + daysAhead * 24 * 60 * 60 * 1000);
  const formatted = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return delay({
    service: remainingKm > 0 ? 'Revisão dos 10.000 km' : 'Revisão antecipada recomendada',
    estimatedKm: 10000,
    estimatedDate: formatted,
    confidence: 0.87,
  });
}

export async function fetchAlerts(reading: TelemetryReading): Promise<Alert[]> {
  return delay(evaluateAlerts(reading), 250);
}
