import type { Alert } from '@/services/mocks/alertsApi';
import type { TelemetryReading } from '@/features/telemetry/simulator';

export type HotspotSeverity = 'idle' | 'warn' | 'critical';

export type HotspotCategory =
  | 'tire-fl'
  | 'tire-fr'
  | 'tire-rl'
  | 'tire-rr'
  | 'engine'
  | 'battery';

export type HotspotState = {
  category: HotspotCategory;
  label: string;
  description: string;
  severity: HotspotSeverity;
  position: [number, number, number];
};

const TIRE_LOW_PSI = 28;
const TIRE_HIGH_PSI = 36;
const ENGINE_TEMP_WARN = 100;
const ENGINE_TEMP_CRITICAL = 108;
const BATTERY_LOW_VOLTS = 11.8;

// TODO: Fine-tune decimal das coordenadas no emulador. Valores provisórios
// espalham os hotspots em torno do GLB F150 Raptor após normalização em CarMesh.
const TIRE_POSITIONS: Record<
  'tire-fl' | 'tire-fr' | 'tire-rl' | 'tire-rr',
  [number, number, number]
> = {
  'tire-fl': [-0.7, 0.5, 1.5],
  'tire-fr': [0.7, 0.5, 1.6],
  'tire-rl': [-0.7, 0.5, -1.2],
  'tire-rr': [0.7, 0.5, -1.25],
};

// TODO: Fine-tune motor (capô) no emulador.
const ENGINE_POSITION: [number, number, number] = [-0.1, 1, 1.9];
// TODO: Fine-tune bateria no emulador.
const BATTERY_POSITION: [number, number, number] = [0.45, 1.0, 1.8];

function tireSeverity(psi: number): HotspotSeverity {
  if (psi < TIRE_LOW_PSI - 2 || psi > TIRE_HIGH_PSI + 2) return 'critical';
  if (psi < TIRE_LOW_PSI || psi > TIRE_HIGH_PSI) return 'warn';
  return 'idle';
}

function tireLabel(category: keyof typeof TIRE_POSITIONS): string {
  switch (category) {
    case 'tire-fl':
      return 'Pneu dianteiro esquerdo';
    case 'tire-fr':
      return 'Pneu dianteiro direito';
    case 'tire-rl':
      return 'Pneu traseiro esquerdo';
    case 'tire-rr':
      return 'Pneu traseiro direito';
  }
}

function tireDescription(psi: number): string {
  if (psi < TIRE_LOW_PSI) {
    return `Pressão em ${psi.toFixed(1)} PSI (mínimo recomendado 28). Calibre na próxima parada.`;
  }
  if (psi > TIRE_HIGH_PSI) {
    return `Pressão em ${psi.toFixed(1)} PSI (máximo recomendado 36). Verifique calibragem.`;
  }
  return `Pressão em ${psi.toFixed(1)} PSI. Dentro da faixa ideal.`;
}

function engineSeverity(tempC: number): HotspotSeverity {
  if (tempC >= ENGINE_TEMP_CRITICAL) return 'critical';
  if (tempC >= ENGINE_TEMP_WARN) return 'warn';
  return 'idle';
}

function batterySeverity(volts: number): HotspotSeverity {
  if (volts < BATTERY_LOW_VOLTS - 0.3) return 'critical';
  if (volts < BATTERY_LOW_VOLTS) return 'warn';
  return 'idle';
}

export function deriveHotspots(reading: TelemetryReading | null): HotspotState[] {
  if (!reading) {
    return [];
  }

  const tireKeys = ['tire-fl', 'tire-fr', 'tire-rl', 'tire-rr'] as const;
  const psiByKey: Record<(typeof tireKeys)[number], number> = {
    'tire-fl': reading.tirePressurePsi.frontLeft,
    'tire-fr': reading.tirePressurePsi.frontRight,
    'tire-rl': reading.tirePressurePsi.rearLeft,
    'tire-rr': reading.tirePressurePsi.rearRight,
  };

  const tires: HotspotState[] = tireKeys.map((key) => ({
    category: key,
    label: tireLabel(key),
    description: tireDescription(psiByKey[key]),
    severity: tireSeverity(psiByKey[key]),
    position: TIRE_POSITIONS[key],
  }));

  const engine: HotspotState = {
    category: 'engine',
    label: 'Motor',
    description:
      reading.engineTempC >= ENGINE_TEMP_CRITICAL
        ? `Temperatura em ${reading.engineTempC.toFixed(1)}°C. Reduza o esforço e procure assistência imediatamente.`
        : reading.engineTempC >= ENGINE_TEMP_WARN
          ? `Temperatura em ${reading.engineTempC.toFixed(1)}°C. Monitore nas próximas leituras.`
          : `Temperatura em ${reading.engineTempC.toFixed(1)}°C. Faixa ideal entre 80–95°C.`,
    severity: engineSeverity(reading.engineTempC),
    position: ENGINE_POSITION,
  };

  const battery: HotspotState = {
    category: 'battery',
    label: 'Bateria',
    description:
      reading.batteryVolts < BATTERY_LOW_VOLTS
        ? `Tensão em ${reading.batteryVolts.toFixed(2)}V. Agende inspeção elétrica.`
        : `Tensão em ${reading.batteryVolts.toFixed(2)}V. Sistema elétrico estável.`,
    severity: batterySeverity(reading.batteryVolts),
    position: BATTERY_POSITION,
  };

  return [...tires, engine, battery];
}

export function activeHotspotsCount(hotspots: HotspotState[]): number {
  return hotspots.filter((h) => h.severity !== 'idle').length;
}

export function findRelatedAlert(
  hotspot: HotspotState,
  alerts: Alert[],
): Alert | undefined {
  switch (hotspot.category) {
    case 'tire-fl':
    case 'tire-fr':
    case 'tire-rl':
    case 'tire-rr':
      return alerts.find((a) => a.category === 'tire-low' || a.category === 'tire-high');
    case 'engine':
      return alerts.find((a) => a.category === 'engine');
    case 'battery':
      return alerts.find((a) => a.category === 'battery');
  }
}
