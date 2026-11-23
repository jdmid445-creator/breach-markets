"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Float, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { tailGeometry } from "./common";

function Tail() {
  const geo = useMemo(() => tailGeometry({ depth: 5, bevel: 1.6, center: true }), []);
  const g = useRef<THREE.Group>(null);
  useFrame(({ pointer, clock }, dt) => {
    if (!g.current) return;
    // turn toward the cursor, and keep a slow idle sway
    const ty = pointer.x * 0.7 + Math.sin(clock.elapsedTime * 0.4) * 0.25;
    const tx = -pointer.y * 0.35;
    g.current.rotation.y += (ty - g.current.rotation.y) * Math.min(1, dt * 3);
    g.current.rotation.x += (tx - g.current.rotation.x) * Math.min(1, dt * 3);
  });
  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.8}>
      <group ref={g}>
        <mesh geometry={geo} scale={2.4}>
          <meshPhysicalMaterial color="#2f6fff" metalness={0.15} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} sheen={0.6} sheenColor="#8dbbe0" />
        </mesh>
      </group>
    </Float>
  );
}

/** The brand's whale tail as a block of water-glass that turns to follow the cursor. */
export default function HeroTail() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} color="#dbe9f5" />
      <pointLight position={[-4, -2, 2]} intensity={30} color="#eb2f33" distance={12} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={4} color="#dbe9f5" position={[0, 4, -3]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={2.5} color="#639cc5" position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="ring" intensity={3} color="#eb2f33" position={[4, -1, 2]} scale={2} />
        <Lightformer form="rect" intensity={1.5} color="#0c3760" position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
      <Tail />
      <ContactShadows position={[0, -1.6, 0]} opacity={0.45} scale={8} blur={2.6} far={3} color="#01121f" />
    </>
  );
}
