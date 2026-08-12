import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";

function cssColor(name: string, fallback: string) {
  if (typeof window === "undefined") return new THREE.Color(fallback);
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  try {
    return new THREE.Color(value || fallback);
  } catch {
    return new THREE.Color(fallback);
  }
}

type ShapeDef = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  speed: number;
  kind: number;
};

function Shape({ def, color }: { def: ShapeDef; color: THREE.Color }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime * def.speed;
    mesh.rotation.x = def.rotation[0] + t * 0.25;
    mesh.rotation.y = def.rotation[1] + t * 0.35;
    mesh.position.y = def.position[1] + Math.sin(t + def.position[0]) * 0.35;
    mesh.position.x = def.position[0] + state.pointer.x * 0.4;
    mesh.position.z = def.position[2] + state.pointer.y * 0.2;
  });

  const geometry = useMemo(() => {
    switch (def.kind) {
      case 0:
        return new THREE.IcosahedronGeometry(1, 0);
      case 1:
        return new THREE.TorusGeometry(0.8, 0.28, 16, 48);
      case 2:
        return new THREE.OctahedronGeometry(1, 0);
      default:
        return new THREE.BoxGeometry(1.3, 1.3, 1.3);
    }
  }, [def.kind]);

  return (
    <mesh ref={ref} position={def.position} rotation={def.rotation} scale={def.scale} geometry={geometry}>
      <meshStandardMaterial
        color={color}
        roughness={0.35}
        metalness={0.25}
        transparent
        opacity={0.55}
        flatShading
      />
    </mesh>
  );
}

function Rig() {
  useFrame((state) => {
    state.camera.position.x += (state.pointer.x * 0.8 - state.camera.position.x) * 0.03;
    state.camera.position.y += (state.pointer.y * 0.5 - state.camera.position.y) * 0.03;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function Scene3D() {
  const [colors, setColors] = useState(() => ({
    primary: new THREE.Color("#2c6b63"),
    accent: new THREE.Color("#d59a52"),
  }));

  useEffect(() => {
    setColors({
      primary: cssColor("--primary", "#2c6b63"),
      accent: cssColor("--accent", "#d59a52"),
    });
  }, []);

  const shapes = useMemo<ShapeDef[]>(() => {
    const list: ShapeDef[] = [];
    for (let i = 0; i < 9; i++) {
      list.push({
        position: [(i % 3) * 5 - 5 + (i % 2) * 1.5, Math.sin(i * 2.1) * 3, -2 - (i % 4) * 2.5],
        rotation: [i * 0.6, i * 0.9, 0],
        scale: 0.6 + ((i * 7) % 5) * 0.18,
        speed: 0.15 + (i % 4) * 0.06,
        kind: i % 4,
      });
    }
    return list;
  }, []);

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 10], fov: 50 }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[6, 8, 6]} intensity={1.1} />
      <pointLight position={[-8, -4, 4]} intensity={30} color={colors.accent} distance={30} />
      {shapes.map((def, index) => (
        <Shape key={index} def={def} color={index % 3 === 0 ? colors.accent : colors.primary} />
      ))}
      <Rig />
    </Canvas>
  );
}
