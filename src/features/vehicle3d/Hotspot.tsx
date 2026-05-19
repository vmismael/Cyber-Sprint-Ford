import { useEffect, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import type { HotspotCategory, HotspotSeverity } from './derive';

const COLORS: Record<HotspotSeverity, string> = {
  idle: '#8A93A6',
  warn: '#FFB020',
  critical: '#E5484D',
};

const PULSE_SPEED: Record<HotspotSeverity, number> = {
  idle: 1.6,
  warn: 3.4,
  critical: 5.6,
};

const BASE_RADIUS = 0.18;

export type HotspotProps = {
  category: HotspotCategory;
  severity: HotspotSeverity;
  position: [number, number, number];
  registry: MutableRefObject<THREE.Mesh[]>;
};

export function Hotspot({ category, severity, position, registry }: HotspotProps) {
  const hitboxRef = useRef<THREE.Mesh | null>(null);
  const haloRef = useRef<THREE.Mesh | null>(null);
  const isActive = severity !== 'idle';

  useEffect(() => {
    const mesh = hitboxRef.current;
    if (!mesh) return;
    mesh.userData.hotspotCategory = category;
    registry.current.push(mesh);
    return () => {
      registry.current = registry.current.filter((m) => m !== mesh);
    };
  }, [category, registry]);

  useFrame((state) => {
    if (!isActive) return;
    const halo = haloRef.current;
    if (!halo) return;
    const t = state.clock.elapsedTime;
    const speed = PULSE_SPEED[severity];
    const wave = Math.sin(t * speed);
    const haloScale = 1.2 + (wave + 1) * 0.6;
    halo.scale.setScalar(haloScale);
    const mat = halo.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.45 - (wave + 1) * 0.15;
  });

  const haloColor = COLORS[severity];

  return (
    <group position={position}>
      {/* Hitbox invisível: raycaster do three.js continua intersectando mesh
          com visible={false}. Mantém a área de toque sem poluir o modelo. */}
      <mesh ref={hitboxRef} visible={false}>
        <sphereGeometry args={[BASE_RADIUS, 12, 12]} />
        <meshBasicMaterial />
      </mesh>

      {isActive && (
        <mesh ref={haloRef}>
          <sphereGeometry args={[BASE_RADIUS * 1.6, 16, 16]} />
          <meshBasicMaterial
            color={haloColor}
            transparent
            opacity={0.3}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
