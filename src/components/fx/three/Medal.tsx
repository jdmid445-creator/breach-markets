"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Environment, Lightformer, Float } from "@react-three/drei";
import * as THREE from "three";
import { tailGeometry } from "./common";

/**
 * A trader's medal: their best leaderboard rank on one face, the Breach tail
 * on the other. It spins on its own and follows the cursor; top 10 is scarlet.
 */
export default function Medal({ rank, label }: { rank: number | null; label: string }) {
  const g = useRef<THREE.Group>(null);
  const tail = useMemo(() => tailGeometry({ depth: 3, bevel: 1, center: true }), []);
  const elite = rank !== null && rank <= 10;
  const face = rank === null ? "#4a82ad" : elite ? "#eb2f33" : "#8dbbe0";
  const text = rank === null ? "—" : `#${rank.toLocaleString()}`;
  useFrame(({ pointer, clock }, dt) => {
    if (!g.current) return;
    const spin = clock.elapsedTime * 0.6;
    const ty = Math.sin(spin) * 0.45 + pointer.x * 0.5;
    g.current.rotation.y += (ty - g.current.rotation.y) * Math.min(1, dt * 3);
    g.current.rotation.x += (-pointer.y * 0.3 - g.current.rotation.x) * Math.min(1, dt * 3);
  });
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={2.4} />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={4} color="#ffffff" position={[0, 3, 4]} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={2} color="#639cc5" position={[-3, 0, 2]} scale={2} />
      </Environment>
      <Float speed={1.6} floatIntensity={0.6} rotationIntensity={0.15}>
        <group ref={g}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.3, 1.3, 0.26, 64]} />
            <meshStandardMaterial color={face} metalness={0.75} roughness={0.22} />
          </mesh>
          <mesh>
            <torusGeometry args={[1.3, 0.07, 16, 64]} />
            <meshStandardMaterial color="#eef3f8" metalness={0.9} roughness={0.15} />
          </mesh>
          <Text font="/fonts/hanken-700i.woff" position={[0, 0.12, 0.16]} fontSize={text.length > 5 ? 0.42 : 0.6} color={elite ? "#ffffff" : "#03203d"} anchorX="center" anchorY="middle">
            {text}
          </Text>
          <Text font="/fonts/hanken-600.woff" position={[0, -0.42, 0.16]} fontSize={0.16} color={elite ? "#ffd9da" : "#062a4e"} anchorX="center" anchorY="middle" maxWidth={1.8} textAlign="center">
            {label}
          </Text>
          <mesh geometry={tail} scale={1.2} position={[0, 0, -0.15]} rotation={[0, Math.PI, 0]}>
            <meshStandardMaterial color="#105bff" metalness={0.4} roughness={0.25} />
          </mesh>
        </group>
      </Float>
    </>
  );
}
