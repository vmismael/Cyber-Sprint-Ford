import { useEffect } from 'react';
import { useVehicleStore } from '@/stores/useVehicleStore';
import { telemetrySimulator, type TelemetryReading } from './simulator';

export function useTelemetry(): TelemetryReading | null {
  const reading = useVehicleStore((s) => s.reading);
  const setReading = useVehicleStore((s) => s.setReading);

  useEffect(() => {
    return telemetrySimulator.subscribe(setReading);
  }, [setReading]);

  return reading;
}

export function restartTelemetry(): void {
  telemetrySimulator.reset();
}
