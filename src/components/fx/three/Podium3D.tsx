"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFrame, useThree } from "@react-three/fiber";
import { Text, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { buoyHullGeometry } from "./sculpt";

export type PodiumRow = { address: string; name: string; value: number; sub: string };

/** Top three as numbered channel buoys: the winner rides tallest and flashes red. */
const SLOTS = [
  { place: 1, x: 0, z: 0, h: 1.9, phase: 0 },
  { place: 2, x: -2.7, z: 0.35, h: 1.45, phase: 1.7 },
  { place: 3, x: 2.7, z: 0.5, h: 1.1, phase: 3.1 },
];

const waterVert = /* glsl */ `
uniform float uTime; uniform vec3 uRip[3];
varying float vH; varying vec2 vP; varying float vR;
void main(){
  vec3 p = position; vec2 xz = vec2(p.x, -p.y);
  float h = sin(xz.x*1.1+uTime*0.9)*0.035 + sin(xz.y*1.6-uTime*0.7)*0.03 + sin((xz.x-xz.y)*2.7+uTime*1.4)*0.012;
  float r = 0.0;
  for (int i=0;i<3;i++){ float age=uTime-uRip[i].z; if(age>0.0&&age<4.0){ float d=distance(xz,uRip[i].xy); float ring=exp(-pow((d-age*1.3)*2.6,2.0))*(1.0-age/4.0); h+=ring*0.08*sin(d*9.0-age*12.0); r+=ring; } }
  p.z += h; vH = h; vP = xz; vR = r;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const waterFrag = /* glsl */ `
varying float vH; varying vec2 vP; varying float vR;
void main(){
  float a = smoothstep(6.8, 3.6, length(vP * vec2(0.7, 1.4)));
  vec3 col = mix(vec3(0.012,0.08,0.15), vec3(0.06,0.22,0.36), clamp(vH*8.0+0.5,0.0,1.0));
  col += vec3(0.6,0.78,0.92) * (smoothstep(0.04,0.065,vH)*0.16 + vR*0.6);
  gl_FragColor = vec4(col, a*0.94);
}`;

function Water({ rips }: { rips: React.MutableRefObject<THREE.Vector3[]> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uRip: { value: rips.current } }), [rips]);
  useFrame(({ clock }) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value = clock.elapsedTime;
    mat.current.uniforms.uRip.value = rips.current;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <planeGeometry args={[16, 9, 200, 110]} />
      <shaderMaterial ref={mat} vertexShader={waterVert} fragmentShader={waterFrag} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  );
}

function Buoy({
  row,
  slot,
  index,
  tags,
  onPick,
  rips,
}: {
  row: PodiumRow;
  slot: (typeof SLOTS)[number];
  index: number;
  tags?: React.MutableRefObject<(HTMLDivElement | null)[]>;
  onPick: () => void;
  rips: React.MutableRefObject<THREE.Vector3[]>;
}) {
  const g = useRef<THREE.Group>(null);
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const born = useRef<number | null>(null);
  const [hover, setHover] = useState(false);
  const hull = useMemo(() => buoyHullGeometry(slot.h), [slot.h]);
  const first = slot.place === 1;
  const lampColor = first ? "#ff3a3e" : "#eef3f8";
  const top = slot.h * 1.07;
  // keep the same buoy (and its HTML label) mounted across tab switches; just surface it again
  useEffect(() => {
    born.current = null;
  }, [row.address]);
  const legs = useMemo(() => [0, 1, 2].map((i) => (i / 3) * Math.PI * 2 + Math.PI / 6), []);

  const anchor = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock, camera, size }, dt) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    // pin the DOM name tag above the lantern
    const tag = tags?.current[index];
    if (tag) {
      anchor.set(0, top + 1.55, 0);
      g.current.localToWorld(anchor);
      anchor.project(camera);
      const x = (anchor.x * 0.5 + 0.5) * size.width;
      const y = (-anchor.y * 0.5 + 0.5) * size.height;
      tag.style.transform = `translate(${x - 95}px, ${y - 78}px)`;
      tag.style.opacity = String(Math.min(1, Math.max(0, (t - (born.current ?? t) - 0.6) * 2)));
    }
    if (born.current === null) {
      born.current = t + index * 0.25;
      rips.current[index] = new THREE.Vector3(slot.x, slot.z, born.current + 0.55);
    }
    // surfaces from under the water with an overshoot, then rides the swell
    const k = Math.min(1, Math.max(0, (t - born.current) / 1.3));
    const pop = k < 1 ? -3 * Math.pow(1 - k, 3) + Math.sin(k * Math.PI) * 0.25 : 0;
    const bob = Math.sin(t * 1.1 + slot.phase) * 0.07 + (hover ? 0.22 : 0);
    g.current.position.y += (pop + bob - g.current.position.y) * Math.min(1, dt * (k < 1 ? 30 : 5));
    g.current.rotation.z = Math.sin(t * 0.9 + slot.phase) * 0.07;
    g.current.rotation.x = Math.sin(t * 0.7 + slot.phase * 2) * 0.05;
    // lamp: the winner flashes two short reds, the others a slow white occulting light
    const ph = (t + slot.phase) % (first ? 3 : 4.5);
    const on = first ? ph < 0.18 || (ph > 0.45 && ph < 0.63) : ph < 3.4;
    const target = on ? (hover ? 3.5 : 2.2) : 0.08;
    if (lamp.current) lamp.current.emissiveIntensity += (target - lamp.current.emissiveIntensity) * Math.min(1, dt * 18);
    if (light.current) light.current.intensity = (lamp.current?.emissiveIntensity ?? 0) * 3;
  });

  return (
    <group position={[slot.x, 0, slot.z]}>
      <group
        ref={g}
        position={[0, -3, 0]}
        onPointerOver={(e) => (e.stopPropagation(), setHover(true), (document.body.style.cursor = "pointer"))}
        onPointerOut={() => (setHover(false), (document.body.style.cursor = ""))}
        onClick={onPick}
      >
        <mesh geometry={hull}>
          <meshPhysicalMaterial vertexColors roughness={0.55} metalness={0.15} clearcoat={0.35} clearcoatRoughness={0.4} />
        </mesh>
        {/* lifting eye and a rubbing strake band */}
        <mesh position={[0, slot.h * 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.665, 0.035, 10, 72]} />
          <meshStandardMaterial color="#17436d" roughness={0.7} />
        </mesh>
        {/* lattice tower: three legs and two hoops */}
        {legs.map((a, i) => {
          const r = 0.34;
          const from = new THREE.Vector3(Math.cos(a) * r, top, Math.sin(a) * r);
          const to = new THREE.Vector3(Math.cos(a) * 0.12, top + 1.0, Math.sin(a) * 0.12);
          const mid = from.clone().add(to).multiplyScalar(0.5);
          const len = from.distanceTo(to);
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
          return (
            <mesh key={i} position={mid} quaternion={q}>
              <cylinderGeometry args={[0.03, 0.03, len, 8]} />
              <meshStandardMaterial color="#cdd8e2" metalness={0.6} roughness={0.35} />
            </mesh>
          );
        })}
        {[0.35, 0.75].map((f) => (
          <mesh key={f} position={[0, top + f, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.34 - f * 0.22, 0.022, 8, 40]} />
            <meshStandardMaterial color="#cdd8e2" metalness={0.6} roughness={0.35} />
          </mesh>
        ))}
        {/* numbered daymark */}
        <mesh position={[0, top + 0.55, 0]}>
          <boxGeometry args={[0.62, 0.5, 0.04]} />
          <meshStandardMaterial color={first ? "#eb2f33" : "#eef3f8"} roughness={0.6} />
        </mesh>
        <Text font="/fonts/hanken-700i.woff" position={[0, top + 0.55, 0.025]} fontSize={0.36} color={first ? "#ffffff" : "#03203d"} anchorX="center" anchorY="middle">
          {String(slot.place)}
        </Text>
        <Text font="/fonts/hanken-700i.woff" position={[0, top + 0.55, -0.025]} rotation={[0, Math.PI, 0]} fontSize={0.36} color={first ? "#ffffff" : "#03203d"} anchorX="center" anchorY="middle">
          {String(slot.place)}
        </Text>
        {/* lantern */}
        <mesh position={[0, top + 1.08, 0]}>
          <cylinderGeometry args={[0.09, 0.11, 0.16, 16]} />
          <meshStandardMaterial ref={lamp} color={lampColor} emissive={lampColor} emissiveIntensity={0.5} roughness={0.2} />
        </mesh>
        <mesh position={[0, top + 1.2, 0]}>
          <coneGeometry args={[0.13, 0.1, 16]} />
          <meshStandardMaterial color="#17436d" roughness={0.5} />
        </mesh>
        <pointLight ref={light} position={[0, top + 1.1, 0.2]} color={lampColor} distance={4} intensity={0} />
      </group>
    </group>
  );
}

/** The top three as numbered buoys riding the swell. Click one to open the trader. */
export default function Podium3D({ rows, tags }: { rows: PodiumRow[]; signed?: boolean; tags?: React.MutableRefObject<(HTMLDivElement | null)[]> }) {
  const labels = Boolean(tags);
  const router = useRouter();
  const g = useRef<THREE.Group>(null);
  const rips = useRef<THREE.Vector3[]>([0, 1, 2].map(() => new THREE.Vector3(0, 0, -99)));
  // three buoys span about 7 units: shrink on narrow canvases so none clips the edge
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const fit = Math.min(labels ? 0.82 : 1, (labels ? 0.82 : 1) * (aspect / (labels ? 2.1 : 1.3)));
  useFrame(({ pointer }, dt) => {
    if (!g.current) return;
    g.current.rotation.y += (pointer.x * 0.25 - g.current.rotation.y) * Math.min(1, dt * 2);
  });
  return (
    <>
      <ambientLight intensity={0.4} color="#9db7cf" />
      <directionalLight position={[-4, 7, 5]} intensity={2.4} color="#e6f0f8" />
      <directionalLight position={[5, 2, -4]} intensity={1} color="#639cc5" />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.5} color="#dbe9f5" position={[0, 5, 4]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#639cc5" position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
      </Environment>
      <group ref={g} position={[0, -1.3, 0]} scale={fit}>
        {SLOTS.map((slot, i) =>
          rows[slot.place - 1] ? (
            <Buoy
              key={slot.place}
              row={rows[slot.place - 1]}
              slot={slot}
              index={i}
              tags={tags}
              rips={rips}
              onPick={() => router.push(`/trader/${rows[slot.place - 1].address}`)}
            />
          ) : null,
        )}
        <Water rips={rips} />
      </group>
    </>
  );
}
