"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { tailGeometry } from "./common";
import { fbm } from "./sculpt";

/** A struck pewter blank: lathe profile with a raised rim and a sunken field for the enamel. */
function blankGeometry() {
  const prof: [number, number][] = [
    [0, -0.14], [1.18, -0.14], [1.3, -0.11], [1.34, -0.05], [1.34, 0.06], [1.3, 0.12], [1.22, 0.14],
    [1.12, 0.13], [1.06, 0.08], [1.0, 0.07], [0, 0.07],
  ];
  return new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 128).rotateX(Math.PI / 2);
}

/** Brushed-metal roughness, generated. */
function brushed() {
  const s = 256;
  const data = new Uint8Array(s * s * 4);
  for (let y = 0; y < s; y++)
    for (let x = 0; x < s; x++) {
      const v = 80 + fbm(x / 60, y / 1.6, 3) * 90 + fbm(x / 8, y / 8, 2) * 30;
      const o = (y * s + x) * 4;
      data[o] = data[o + 1] = data[o + 2] = Math.min(255, v);
      data[o + 3] = 255;
    }
  const t = new THREE.DataTexture(data, s, s);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

/** Engine-turned sunburst under translucent enamel, the way struck medals are finished. */
function guillocheMap() {
  const s = 512;
  const data = new Uint8Array(s * s * 4);
  for (let y = 0; y < s; y++)
    for (let x = 0; x < s; x++) {
      const u = x / s - 0.5, v = y / s - 0.5;
      const r = Math.hypot(u, v), a = Math.atan2(v, u);
      const wave = Math.sin(a * 36 + Math.sin(r * 60) * 0.9) * 0.5 + 0.5;
      const ring = Math.sin(r * 220) * 0.5 + 0.5;
      const k = 0.86 + wave * 0.07 + ring * 0.025 - r * 0.2;
      const o = (y * s + x) * 4;
      data[o] = data[o + 1] = data[o + 2] = Math.max(0, Math.min(255, k * 255));
      data[o + 3] = 255;
    }
  const t = new THREE.DataTexture(data, s, s);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/**
 * A trader's medal, struck in pewter: knurled edge, a sunken field filled with
 * enamel (scarlet for the top 10, deep blue otherwise), the rank raised in the
 * metal, and the Breach tail in relief on the reverse. It turns slowly, catches
 * light as it goes, and leans toward the cursor.
 */
export default function Medal({ rank, label }: { rank: number | null; label: string }) {
  const g = useRef<THREE.Group>(null);
  const blank = useMemo(() => blankGeometry(), []);
  const rough = useMemo(() => brushed(), []);
  const guilloche = useMemo(() => guillocheMap(), []);
  const tail = useMemo(() => tailGeometry({ depth: 1.2, bevel: 0.5, center: true }), []);
  const elite = rank !== null && rank <= 10;
  const enamel = elite ? "#a8141a" : rank === null ? "#17436d" : "#062a4e";
  const text = rank === null ? "—" : `#${rank.toLocaleString()}`;
  const knurl = useMemo(() => {
    const n = 140;
    const m = new THREE.Matrix4();
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return m.clone().compose(new THREE.Vector3(Math.cos(a) * 1.345, Math.sin(a) * 1.345, 0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a), new THREE.Vector3(0.02, 0.03, 0.18));
    });
  }, []);
  const born = useRef<number | null>(null);

  useFrame(({ pointer, clock }, dt) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    if (born.current === null) born.current = t;
    // struck in: drops in spinning, lands with a settle, then turns slowly
    const k = Math.min(1, (t - born.current) / 1.4);
    const spinIn = (1 - Math.pow(1 - k, 3)) * Math.PI * 2;
    const idle = Math.sin(t * 0.5) * 0.55;
    const ty = (k < 1 ? spinIn - Math.PI * 2 : 0) + idle + pointer.x * 0.45;
    g.current.rotation.y += (ty - g.current.rotation.y) * Math.min(1, dt * (k < 1 ? 20 : 3));
    g.current.rotation.x += (-pointer.y * 0.3 - g.current.rotation.x) * Math.min(1, dt * 3);
    g.current.position.y = (1 - k) * 1.2 + Math.sin(t * 1.2) * 0.04;
    g.current.scale.setScalar(0.6 + 0.4 * (1 - Math.pow(1 - k, 3)));
  });

  const pewter = <meshPhysicalMaterial color="#aebdcb" metalness={1} roughness={0.32} roughnessMap={rough} clearcoat={0.3} clearcoatRoughness={0.3} />;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={5} color="#ffffff" position={[0, 3, 4]} scale={[6, 1.5, 1]} />
        <Lightformer form="rect" intensity={2} color="#639cc5" position={[-4, -1, 2]} rotation-y={Math.PI / 3} scale={[4, 3, 1]} />
        <Lightformer form="ring" intensity={2.5} color="#eb2f33" position={[4, 1, 1]} scale={1.5} />
        <Lightformer form="rect" intensity={1} color="#0c3760" position={[0, -3, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
      <group ref={g}>
        <mesh geometry={blank}>{pewter}</mesh>
        <instancedMesh
          args={[undefined, undefined, knurl.length]}
          ref={(m) => {
            if (m) knurl.forEach((mat, i) => m.setMatrixAt(i, mat));
          }}
        >
          <boxGeometry />
          {pewter}
        </instancedMesh>
        {/* enamel field, front and back */}
        <mesh position={[0, 0, 0.075]}>
          <circleGeometry args={[1.02, 96]} />
          <meshPhysicalMaterial color={enamel} map={guilloche} roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} />
        </mesh>
        <mesh position={[0, 0, -0.145]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[1.18, 96]} />
          <meshPhysicalMaterial color="#062a4e" roughness={0.18} clearcoat={1} clearcoatRoughness={0.06} />
        </mesh>
        {/* rank, raised in the metal */}
        <Text font="/fonts/hanken-700i.woff" position={[0, 0.12, 0.09]} fontSize={text.length > 5 ? 0.46 : 0.66} anchorX="center" anchorY="middle" outlineWidth={0.014} outlineColor="#7a1013">
          {text}
          <meshStandardMaterial color="#eef3f8" metalness={0.35} roughness={0.28} />
        </Text>
        <Text font="/fonts/hanken-600.woff" position={[0, -0.42, 0.09]} fontSize={0.15} anchorX="center" anchorY="middle" maxWidth={1.7} textAlign="center">
          {label}
          <meshStandardMaterial color="#dfe8f0" metalness={0.3} roughness={0.4} />
        </Text>
        {/* reverse: the tail in relief */}
        <mesh geometry={tail} scale={1.05} position={[0, 0.05, -0.17]} rotation={[0, Math.PI, 0]}>
          {pewter}
        </mesh>
      </group>
    </>
  );
}
