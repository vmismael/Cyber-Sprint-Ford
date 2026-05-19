export type OrbitState = {
  azimuth: number;
  polar: number;
  distance: number;
};

export type CameraPresetId = 'front' | 'side' | 'top';

export const CAMERA_TARGET: [number, number, number] = [0, 0.7, 0];

export const ORBIT_LIMITS = {
  minPolar: 0.15,
  maxPolar: Math.PI / 2 - 0.05,
  minDistance: 4.5,
  maxDistance: 12,
};

export const DEFAULT_ORBIT: OrbitState = {
  azimuth: Math.PI / 5,
  polar: Math.PI / 3.2,
  distance: 7.5,
};

export const CAMERA_PRESETS: Record<CameraPresetId, OrbitState> = {
  front: { azimuth: 0, polar: Math.PI / 2.4, distance: 7 },
  side: { azimuth: Math.PI / 2, polar: Math.PI / 2.5, distance: 7.5 },
  top: { azimuth: 0, polar: 0.2, distance: 8.5 },
};

export function clampOrbit(state: OrbitState): OrbitState {
  return {
    azimuth: state.azimuth,
    polar: Math.min(ORBIT_LIMITS.maxPolar, Math.max(ORBIT_LIMITS.minPolar, state.polar)),
    distance: Math.min(
      ORBIT_LIMITS.maxDistance,
      Math.max(ORBIT_LIMITS.minDistance, state.distance),
    ),
  };
}

export function orbitToPosition(state: OrbitState): [number, number, number] {
  const { azimuth, polar, distance } = state;
  const x = distance * Math.sin(polar) * Math.sin(azimuth);
  const y = distance * Math.cos(polar) + CAMERA_TARGET[1];
  const z = distance * Math.sin(polar) * Math.cos(azimuth);
  return [x, y, z];
}
