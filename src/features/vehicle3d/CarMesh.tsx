import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber/native';
import { useGLTF } from '@react-three/drei/native';
import * as THREE from 'three';
import { useTheme } from '@/theme/ThemeProvider';

const MODEL = require('../../../assets/models/f150_optimized.glb');

const TARGET_LENGTH = 4.5;

// Mesh names from the F150 Raptor GLB receive the plan accent material.
// Refined after inspecting scene.traverse output: rim/wheel + grille + window trims.
const ACCENT_MESH_PATTERNS = [/wheel|rim|aro|tire_rim/i, /grille|grade/i, /trim|friso|accent/i];

export function CarMesh() {
  const theme = useTheme();
  const planAccent = theme.plan.accent;
  const { invalidate } = useThree();
  const gltf = useGLTF(MODEL) as unknown as { scene: THREE.Group };
  const scene = gltf.scene;

  const accentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: planAccent,
        metalness: 0.5,
        roughness: 0.35,
        emissive: planAccent,
        emissiveIntensity: 0.35,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const originalMaterialsRef = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(
    new Map(),
  );

  useEffect(() => {
    // Rotação 180° em Y: o .glb foi exportado com a frente apontando para -Z;
    // nossa câmera frontal (preset "front") olha para +Z, então invertemos.
    scene.rotation.y = Math.PI;

    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z);
    const k = maxAxis > 0 ? TARGET_LENGTH / maxAxis : 1;
    scene.scale.setScalar(k);
    scene.position.set(-center.x * k, -box.min.y * k, -center.z * k);

    const originals = originalMaterialsRef.current;
    scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;

      // Sanitiza materiais PBR avançados que o expo-gl não suporta de forma
      // estável (clearcoat / transmission / iridescence dependem de render
      // targets extras). Sem isso o WebGLRenderer estoura no setRenderTarget.
      const sanitize = (m: THREE.Material) => {
        const phys = m as THREE.MeshPhysicalMaterial;
        if (phys.isMeshPhysicalMaterial || (m as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          if ('clearcoat' in phys) phys.clearcoat = 0;
          if ('transmission' in phys) phys.transmission = 0;
          if ('iridescence' in phys) phys.iridescence = 0;
          if ('sheen' in phys) (phys as unknown as { sheen: number }).sheen = 0;
          m.needsUpdate = true;
        }
      };
      const mat = mesh.material;
      if (Array.isArray(mat)) mat.forEach(sanitize);
      else if (mat) sanitize(mat);

      const isAccent = ACCENT_MESH_PATTERNS.some((re) => re.test(mesh.name));
      if (isAccent && !originals.has(mesh)) {
        originals.set(mesh, mesh.material);
        mesh.material = accentMaterial;
      }
    });
    invalidate();
  }, [scene, accentMaterial, invalidate]);

  useEffect(() => {
    accentMaterial.color.set(planAccent);
    accentMaterial.emissive.set(planAccent);
    invalidate();
  }, [planAccent, accentMaterial, invalidate]);

  useEffect(() => {
    const originals = originalMaterialsRef.current;
    return () => {
      // Restore originals so the cached GLB scene from drei stays pristine for
      // future mounts. We only dispose the material we instantiated here — the
      // GLB-owned geometries/materials live in THREE.Cache.
      originals.forEach((mat, mesh) => {
        mesh.material = mat;
      });
      originals.clear();
      accentMaterial.dispose();
    };
  }, [accentMaterial]);

  return <primitive object={scene} />;
}

useGLTF.preload(MODEL);
