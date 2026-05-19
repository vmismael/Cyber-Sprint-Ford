import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import * as THREE from 'three';
import { CarMesh } from './CarMesh';
import { Hotspot } from './Hotspot';
import {
  CAMERA_PRESETS,
  CAMERA_TARGET,
  DEFAULT_ORBIT,
  ORBIT_LIMITS,
  clampOrbit,
  orbitToPosition,
  type CameraPresetId,
  type OrbitState,
} from './cameraPresets';
import type { HotspotCategory, HotspotState } from './derive';

const PAN_SENSITIVITY = 0.005;
const PINCH_SENSITIVITY = 1.0;
const ANIMATION_LERP = 0.12;
const ANIMATION_EPSILON = 0.002;

type CameraRigProps = {
  orbitRef: React.MutableRefObject<OrbitState>;
  targetOrbitRef: React.MutableRefObject<OrbitState | null>;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  onAnimationEnd: () => void;
};

function CameraRig({ orbitRef, targetOrbitRef, cameraRef, onAnimationEnd }: CameraRigProps) {
  const { camera, invalidate } = useThree();
  const targetVec = useMemo(() => new THREE.Vector3(...CAMERA_TARGET), []);

  useEffect(() => {
    cameraRef.current = camera as THREE.PerspectiveCamera;
    const [x, y, z] = orbitToPosition(orbitRef.current);
    camera.position.set(x, y, z);
    camera.lookAt(targetVec);
    invalidate();
  }, [camera, cameraRef, orbitRef, targetVec, invalidate]);

  useFrame(() => {
    const target = targetOrbitRef.current;
    if (target) {
      const current = orbitRef.current;
      const dAz = target.azimuth - current.azimuth;
      const dPol = target.polar - current.polar;
      const dDist = target.distance - current.distance;

      if (
        Math.abs(dAz) < ANIMATION_EPSILON &&
        Math.abs(dPol) < ANIMATION_EPSILON &&
        Math.abs(dDist) < ANIMATION_EPSILON
      ) {
        orbitRef.current = { ...target };
        targetOrbitRef.current = null;
        onAnimationEnd();
      } else {
        orbitRef.current = clampOrbit({
          azimuth: current.azimuth + dAz * ANIMATION_LERP,
          polar: current.polar + dPol * ANIMATION_LERP,
          distance: current.distance + dDist * ANIMATION_LERP,
        });
      }
    }

    const [x, y, z] = orbitToPosition(orbitRef.current);
    camera.position.set(x, y, z);
    camera.lookAt(targetVec);
  });

  return null;
}

type SceneContentProps = {
  hotspots: HotspotState[];
  hotspotMeshesRef: React.MutableRefObject<THREE.Mesh[]>;
  orbitRef: React.MutableRefObject<OrbitState>;
  targetOrbitRef: React.MutableRefObject<OrbitState | null>;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  onAnimationEnd: () => void;
};

function SceneContent({
  hotspots,
  hotspotMeshesRef,
  orbitRef,
  targetOrbitRef,
  cameraRef,
  onAnimationEnd,
}: SceneContentProps) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#6FA3FF', '#0A0E14', 0.5]} />
      <directionalLight
        position={[6, 8, 4]}
        intensity={1.0}
        color="#FFFFFF"
      />
      <directionalLight position={[-5, 4, -3]} intensity={0.75} color="#1F6FEB" />
      <directionalLight position={[-3, 2, 5]} intensity={0.45} color="#FFFFFF" />
      <pointLight position={[0, 4, 6]} intensity={0.4} color="#6FA3FF" />

      <CarMesh />

      {hotspots.map((h) => (
        <Hotspot
          key={h.category}
          category={h.category}
          severity={h.severity}
          position={h.position}
          registry={hotspotMeshesRef}
        />
      ))}

      <CameraRig
        orbitRef={orbitRef}
        targetOrbitRef={targetOrbitRef}
        cameraRef={cameraRef}
        onAnimationEnd={onAnimationEnd}
      />
    </>
  );
}

export type SceneProps = {
  hotspots: HotspotState[];
  presetId: CameraPresetId | null;
  onHotspotPress: (category: HotspotCategory) => void;
  onPresetReached: () => void;
};

export function Scene({
  hotspots,
  presetId,
  onHotspotPress,
  onPresetReached,
}: SceneProps) {
  const orbitRef = useRef<OrbitState>({ ...DEFAULT_ORBIT });
  const targetOrbitRef = useRef<OrbitState | null>(null);
  const panStartRef = useRef<OrbitState>({ ...DEFAULT_ORBIT });
  const pinchStartRef = useRef<OrbitState>({ ...DEFAULT_ORBIT });
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const hotspotMeshesRef = useRef<THREE.Mesh[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  const [interacting, setInteracting] = useState(false);
  const [animating, setAnimating] = useState(false);

  const hasActiveHotspots = useMemo(
    () => hotspots.some((h) => h.severity !== 'idle'),
    [hotspots],
  );

  const frameloop: 'always' | 'demand' =
    interacting || animating || hasActiveHotspots ? 'always' : 'demand';

  useEffect(() => {
    if (!presetId) return;
    targetOrbitRef.current = { ...CAMERA_PRESETS[presetId] };
    setAnimating(true);
  }, [presetId]);

  const handleAnimationEnd = useCallback(() => {
    setAnimating(false);
    onPresetReached();
  }, [onPresetReached]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    sizeRef.current = { w: width, h: height };
  }, []);

  const cancelPresetAnimation = useCallback(() => {
    targetOrbitRef.current = null;
    setAnimating(false);
  }, []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .onStart(() => {
          panStartRef.current = { ...orbitRef.current };
          cancelPresetAnimation();
          setInteracting(true);
        })
        .onUpdate((e) => {
          const start = panStartRef.current;
          orbitRef.current = clampOrbit({
            azimuth: start.azimuth - e.translationX * PAN_SENSITIVITY,
            polar: start.polar - e.translationY * PAN_SENSITIVITY,
            distance: orbitRef.current.distance,
          });
        })
        .onFinalize(() => {
          setInteracting(false);
        }),
    [cancelPresetAnimation],
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .onStart(() => {
          pinchStartRef.current = { ...orbitRef.current };
          cancelPresetAnimation();
          setInteracting(true);
        })
        .onUpdate((e) => {
          const start = pinchStartRef.current;
          const scale = Math.max(0.4, Math.min(2.5, e.scale));
          const nextDistance = start.distance / (scale * PINCH_SENSITIVITY);
          orbitRef.current = clampOrbit({
            azimuth: orbitRef.current.azimuth,
            polar: orbitRef.current.polar,
            distance: nextDistance,
          });
        })
        .onFinalize(() => {
          setInteracting(false);
        }),
    [cancelPresetAnimation],
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(8)
        .maxDuration(280)
        .runOnJS(true)
        .onEnd((e, success) => {
          if (!success) return;
          const camera = cameraRef.current;
          const { w, h } = sizeRef.current;
          if (!camera || w === 0 || h === 0) return;
          const ndc = new THREE.Vector2(
            (e.x / w) * 2 - 1,
            -((e.y / h) * 2 - 1),
          );
          raycaster.setFromCamera(ndc, camera);
          const hits = raycaster.intersectObjects(hotspotMeshesRef.current, false);
          if (hits.length === 0) return;
          const cat = hits[0].object.userData.hotspotCategory as
            | HotspotCategory
            | undefined;
          if (cat) onHotspotPress(cat);
        }),
    [raycaster, onHotspotPress],
  );

  const composed = useMemo(
    () => Gesture.Race(tapGesture, Gesture.Simultaneous(panGesture, pinchGesture)),
    [panGesture, pinchGesture, tapGesture],
  );

  return (
    <GestureDetector gesture={composed}>
      <View style={styles.container} onLayout={onLayout}>
        <Canvas
          frameloop={frameloop}
          gl={{ antialias: true, alpha: true }}
          camera={{ fov: 35, near: 0.1, far: 100, position: orbitToPosition(DEFAULT_ORBIT) }}
          shadows={false}
        >
          <SceneContent
            hotspots={hotspots}
            hotspotMeshesRef={hotspotMeshesRef}
            orbitRef={orbitRef}
            targetOrbitRef={targetOrbitRef}
            cameraRef={cameraRef}
            onAnimationEnd={handleAnimationEnd}
          />
        </Canvas>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export { ORBIT_LIMITS };
