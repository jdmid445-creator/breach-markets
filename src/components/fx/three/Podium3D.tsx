"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text, Html, Environment, Lightformer, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { usd } from "@/lib/format";
import { tailGeometry } from "./common";

export type PodiumRow = { address: string; name: string; value: number; sub: string };

const SLOTS = [
  { place: 1, x: 0, h: 2.3, color: "#8dbbe0" },
  { place: 2, x: -2.55, h: 1.6, color: "#639cc5" },
  { place: 3, x: 2.55, h: 1.15, color: "#4a82ad" },
];

function Pillar({ row, slot, delay, signed, onPick, labels }: { row: PodiumRow; slot: (typeof SLOTS)[number]; delay: number; signed: boolean; onPick: () => void; labels: boolean }) {
  const g = useRef<THREE.Group>(null);
  const coin = useRef<THREE.Group>(null);
  const born = useRef<number | null>(null);
  const [hover, setHover] = useState(false);
  const tail = useMemo(() => tailGeometry({ depth: 3, bevel: 1, center: true }), []);
  useFrame(({ clock }, dt) => {
    if (born.current === null) born.current = clock.elapsedTime;
    const t = clock.elapsedTime - born.current - delay;
    // rise out of the floor with a small overshoot
    const k = Math.min(1, Math.max(0, t / 1.1));
    const ease = 1 - Math.pow(1 - k, 3) + Math.sin(k * Math.PI) * 0.06;
    if (g.current) g.current.scale.y = Math.max(0.001, ease);
    if (coin.current) {
      const lift = hover ? 0.35 : 0;
      coin.current.position.y += (slot.h + 0.75 + lift + Math.sin(clock.elapsedTime * 1.6 + slot.x) * 0.06 - coin.current.position.y) * Math.min(1, dt * 6);
      coin.current.rotation.y += dt * (hover ? 2.4 : 0.8);
      coin.current.scale.setScalar(Math.min(1, Math.max(0, (t - 0.6) / 0.5)));
    }
  });
  const first = slot.place === 1;
  return (
    <group position={[slot.x, 0, 0]}>
      <group
        ref={g}
        onPointerOver={(e) => (e.stopPropagation(), setHover(true), (document.body.style.cursor = "pointer"))}
        onPointerOut={() => (setHover(false), (document.body.style.cursor = ""))}
        onClick={onPick}
      >
        <RoundedBox args={[2.1, slot.h, 2.1]} radius={0.12} smoothness={4} position={[0, slot.h / 2, 0]}>
          <meshStandardMaterial color={slot.color} roughness={0.35} metalness={0.25} emissive={slot.color} emissiveIntensity={hover ? 0.25 : 0.05} />
        </RoundedBox>
        <Text font="/fonts/hanken-700i.woff" position={[0, slot.h * 0.5, 1.06]} fontSize={first ? 1.1 : 0.85} color="#03203d" anchorX="center" anchorY="middle">
          {String(slot.place)}
        </Text>
      </group>
      <group ref={coin} position={[0, slot.h + 0.75, 0]}>
        {/* a coin with the brand's tail on both faces; the winner's is scarlet-edged */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.62, 0.62, 0.14, 48]} />
          <meshStandardMaterial color={first ? "#eb2f33" : "#eef3f8"} metalness={0.6} roughness={0.25} />
        </mesh>
        <mesh geometry={tail} scale={0.62} position={[0, 0, 0.09]}>
          <meshStandardMaterial color={first ? "#ffffff" : "#105bff"} metalness={0.3} roughness={0.3} />
        </mesh>
        <mesh geometry={tail} scale={0.62} position={[0, 0, -0.09]} rotation={[0, Math.PI, 0]}>
          <meshStandardMaterial color={first ? "#ffffff" : "#105bff"} metalness={0.3} roughness={0.3} />
        </mesh>
      </group>
      {labels && (
      <Html position={[0, slot.h + 1.75, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div className="w-[190px] text-center">
          <div className="truncate text-[15px] font-semibold text-fg">{row.name}</div>
          <div className={`fig text-[22px] font-semibold leading-tight ${signed ? (row.value >= 0 ? "text-stone-hi" : "text-mist") : "text-fg"}`}>{usd(row.value, { sign: signed })}</div>
          <div className="text-[12px] text-faint">{row.sub}</div>
        </div>
      </Html>
      )}
    </group>
  );
}

/** The top three on a podium you can look around: pillars rise, coins spin, click one to open the trader. */
export default function Podium3D({ rows, signed = false, labels = true }: { rows: PodiumRow[]; signed?: boolean; labels?: boolean }) {
  const router = useRouter();
  const g = useRef<THREE.Group>(null);
  useFrame(({ pointer }, dt) => {
    if (!g.current) return;
    g.current.rotation.y += (pointer.x * 0.35 - g.current.rotation.y) * Math.min(1, dt * 2.5);
    g.current.rotation.x += (pointer.y * 0.08 - g.current.rotation.x) * Math.min(1, dt * 2.5);
  });
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 8, 6]} intensity={2.2} color="#e6f0f8" />
      <pointLight position={[0, 2, 4]} intensity={18} color="#8dbbe0" distance={14} />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={3} color="#dbe9f5" position={[0, 5, 4]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#639cc5" position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
      </Environment>
      <group ref={g} position={[0, -2, 0]}>
        {SLOTS.map((slot, i) =>
          rows[slot.place - 1] ? (
            <Pillar
              key={`${rows[slot.place - 1].address}-${slot.place}`}
              row={rows[slot.place - 1]}
              slot={slot}
              delay={[0.15, 0, 0.3][i]}
              signed={signed}
              labels={labels}
              onPick={() => router.push(`/trader/${rows[slot.place - 1].address}`)}
            />
          ) : null,
        )}
        <ContactShadows position={[0, 0.001, 0]} opacity={0.55} scale={12} blur={2.4} far={4} color="#01121f" />
      </group>
    </>
  );
}
