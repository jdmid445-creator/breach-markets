"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { Fluke, Drips } from "./HeroTail";

export type PodiumRow = { address: string; name: string; value: number; sub: string };

/**
 * The top three as whales breaking the surface: the winner's fluke rises
 * highest and biggest, second and third lower. Each breaches on its own
 * clock, so the water is never still, and the name tag rides its tail.
 */
const SLOTS = [
  { place: 1, x: 0, z: 0, peak: 1.2, size: 1.65, phase: 2.6, seed: 3 },
  { place: 2, x: -3.1, z: 0.5, peak: 0.85, size: 1.35, phase: 1.7, seed: 7 },
  { place: 3, x: 3.1, z: 0.7, peak: 0.6, size: 1.15, phase: 3.5, seed: 12 },
];
const WATER_Y = -0.75; // world height of the surface
const CLIP = [new THREE.Plane(new THREE.Vector3(0, 1, 0), -WATER_Y + 0.02)];

const waterVert = /* glsl */ `
uniform float uTime; uniform vec3 uRip[3];
varying float vH; varying vec2 vP; varying float vR;
void main(){
  vec3 p = position; vec2 xz = vec2(p.x, -p.y);
  float h = sin(xz.x*1.1+uTime*0.9)*0.03 + sin(xz.y*1.6-uTime*0.7)*0.025 + sin((xz.x-xz.y)*2.7+uTime*1.4)*0.01;
  float r = 0.0;
  for (int i=0;i<3;i++){ float age=uTime-uRip[i].z; if(age>0.0&&age<4.0){ float d=distance(xz,uRip[i].xy); float ring=exp(-pow((d-age*1.2)*2.6,2.0))*(1.0-age/4.0); h+=ring*0.07*sin(d*9.0-age*12.0); r+=ring; } }
  p.z += h; vH = h; vP = xz; vR = r;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const waterFrag = /* glsl */ `
varying float vH; varying vec2 vP; varying float vR;
void main(){
  float a = smoothstep(6.4, 3.2, length(vP * vec2(0.72, 1.5)));
  vec3 col = mix(vec3(0.012,0.08,0.15), vec3(0.07,0.24,0.38), clamp(vH*9.0+0.5,0.0,1.0));
  col += vec3(0.6,0.78,0.92) * (smoothstep(0.035,0.06,vH)*0.16 + vR*0.65);
  gl_FragColor = vec4(col, a*0.92);
}`;

function Water({ rips }: { rips: THREE.Vector3[] }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uRip: { value: rips } }), [rips]);
  useFrame(({ clock }) => {
    if (mat.current) mat.current.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <planeGeometry args={[16, 9, 160, 90]} />
      <shaderMaterial ref={mat} vertexShader={waterVert} fragmentShader={waterFrag} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  );
}

type Rig = { tail: React.MutableRefObject<THREE.Group | null>; rip: React.MutableRefObject<number>; dripping: React.MutableRefObject<boolean> };

function Whale({
  slot,
  index,
  rig,
  rips,
  tags,
  onPick,
}: {
  slot: (typeof SLOTS)[number];
  index: number;
  rig: Rig;
  rips: THREE.Vector3[];
  tags?: React.MutableRefObject<(HTMLDivElement | null)[]>;
  onPick: () => void;
}) {
  const lastRip = useRef(-99);
  const [hover, setHover] = useState(false);
  const anchor = useMemo(() => new THREE.Vector3(), []);
  const lift = useRef<THREE.Group>(null);

  useFrame(({ camera, size }, dt) => {
    if (rig.rip.current !== lastRip.current) {
      lastRip.current = rig.rip.current;
      rips[index].set(slot.x, slot.z, rig.rip.current);
    }
    if (lift.current) lift.current.position.y += ((hover ? 0.18 : 0) - lift.current.position.y) * Math.min(1, dt * 6);
    const tag = tags?.current[index];
    const tail = rig.tail.current;
    if (tag && tail) {
      anchor.set(0, 0.62, 0);
      tail.localToWorld(anchor);
      const above = anchor.y - WATER_Y;
      anchor.project(camera);
      const x = (anchor.x * 0.5 + 0.5) * size.width;
      const y = (-anchor.y * 0.5 + 0.5) * size.height;
      tag.style.transform = `translate(${x - 95}px, ${y - 92}px)`;
      tag.style.opacity = String(Math.min(1, Math.max(0, (above - 0.5) * 1.6)));
    }
  });

  return (
    <group position={[slot.x, 0, slot.z]}>
      <group
        ref={lift}
        onPointerOver={(e) => (e.stopPropagation(), setHover(true), (document.body.style.cursor = "pointer"))}
        onPointerOut={() => (setHover(false), (document.body.style.cursor = ""))}
        onClick={onPick}
      >
        <Fluke rip={rig.rip} dripping={rig.dripping} groupRef={rig.tail} peak={slot.peak} size={slot.size} phase={slot.phase} clip={CLIP} seed={slot.seed} />
      </group>
    </group>
  );
}

/** The top three as breaching whales. Click a tail to open the trader. */
export default function Podium3D({ rows, tags }: { rows: PodiumRow[]; signed?: boolean; tags?: React.MutableRefObject<(HTMLDivElement | null)[]> }) {
  const router = useRouter();
  const root = useRef<THREE.Group>(null);
  const rips = useMemo(() => [0, 1, 2].map(() => new THREE.Vector3(0, 0, -99)), []);
  const rigs: Rig[] = useMemo(() => SLOTS.map(() => ({ tail: { current: null }, rip: { current: -99 }, dripping: { current: false } })), []);
  const labels = Boolean(tags);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  // three tails span about 7 units: shrink on narrow canvases so none clips the edge
  const fit = Math.min(labels ? 0.82 : 1, (labels ? 0.82 : 1) * (aspect / (labels ? 2.1 : 1.3)));

  useFrame(({ pointer }, dt) => {
    if (!root.current) return;
    root.current.rotation.y += (pointer.x * 0.22 - root.current.rotation.y) * Math.min(1, dt * 2);
  });

  return (
    <>
      <ambientLight intensity={0.35} color="#9db7cf" />
      <directionalLight position={[-3, 5, 4]} intensity={2.6} color="#e2eef8" />
      <directionalLight position={[4, 1, -3]} intensity={1.4} color="#639cc5" />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={3} color="#dbe9f5" position={[0, 5, 3]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#639cc5" position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[5, 3, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#0c3760" position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
      <group ref={root} position={[0, WATER_Y, 0]} scale={fit}>
        {SLOTS.map((slot, i) =>
          rows[slot.place - 1] ? (
            <Whale key={slot.place} slot={slot} index={i} rig={rigs[i]} rips={rips} tags={tags} onPick={() => router.push(`/trader/${rows[slot.place - 1].address}`)} />
          ) : null,
        )}
        <Water rips={rips} />
      </group>
      {/* drips are simulated in world space, so they sit at the scene root */}
      {rigs.map((r, i) => (
        <Drips key={i} tail={r.tail} active={r.dripping} floor={WATER_Y} count={40} />
      ))}
    </>
  );
}
