import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function Orbit() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    group.current.rotation.x = Math.sin(time * 0.24) * 0.08;
    group.current.rotation.y = time * 0.16;
    group.current.position.x = state.pointer.x * 0.18;
    group.current.position.y = state.pointer.y * 0.12;
  });

  return (
    <group ref={group}>
      <mesh rotation={[0.2, 0.2, 0]}>
        <icosahedronGeometry args={[1.3, 1]} />
        <meshStandardMaterial
          color="#e85d3a"
          emissive="#7d2415"
          emissiveIntensity={0.45}
          metalness={0.55}
          roughness={0.2}
          flatShading
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.05, 0.035, 12, 96]} />
        <meshBasicMaterial color="#f6c7a8" transparent opacity={0.75} />
      </mesh>
      <mesh rotation={[0.7, 0, 0]}>
        <torusGeometry args={[1.7, 0.018, 10, 96]} />
        <meshBasicMaterial color="#e85d3a" transparent opacity={0.65} />
      </mesh>
      <mesh position={[-2.1, 1.3, -0.4]} scale={0.18}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#f6c7a8" emissive="#e85d3a" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[2.1, -1.2, 0.2]} scale={0.13}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#f6c7a8" emissive="#e85d3a" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

export function AuthScene() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <Canvas
        flat
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 7], fov: 42 }}
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[3, 4, 5]} intensity={18} color="#e85d3a" distance={14} />
        <directionalLight position={[-4, 3, 4]} intensity={2} color="#ffe2cf" />
        <Orbit />
      </Canvas>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_78%)]" />
    </div>
  );
}
