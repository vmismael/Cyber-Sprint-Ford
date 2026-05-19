import { create } from 'zustand';
import type { TelemetryReading } from '@/features/telemetry/simulator';

type VehicleState = {
  reading: TelemetryReading | null;
  lastUpdatedAt: number | null;
  setReading: (reading: TelemetryReading) => void;
  clearReading: () => void;
};

export const useVehicleStore = create<VehicleState>((set) => ({
  reading: null,
  lastUpdatedAt: null,
  setReading: (reading) => set({ reading, lastUpdatedAt: reading.timestamp }),
  clearReading: () => set({ reading: null, lastUpdatedAt: null }),
}));
