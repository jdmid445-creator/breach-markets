"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { flukeGeometry, pedunclGeometry, barnacleSpots, trailingEdgePoints, fbm } from "./sculpt";

/** Nothing under the surface (world y -0.57) is drawn, so the stock never shows below the disc edge. */
const WATERLINE = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.6)];

const CYCLE = 11; // seconds per breach
const ease = (k: number) => 1 - Math.pow(1 - k, 3);

/** Where the tail is in its breach cycle: height out of the water, pitch, and whether it's wet-dripping. */
function cycle(t: number, peak = 1.05) {
  const k = t % CYCLE;
  if (k < 2.6) return { y: -2.6 + (2.6 + peak) * ease(k / 2.6), pitch: 0.35 * (1 - ease(k / 2.6)), drip: k > 0.8 };
  if (k < 7.2) return { y: peak + Math.sin((k - 2.6) * 0.9) * 0.04, pitch: Math.sin((k - 2.6) * 0.7) * 0.05, drip: true };
  if (k < 9.6) {
    const s = (k - 7.2) / 2.4;
    return { y: peak - (2.8 + peak) * s * s, pitch: -0.45 * s, drip: s < 0.5 };
  }
  return { y: -2.8, pitch: -0.45, drip: false };
}

const waterVert = /* glsl */ `
uniform float uTime; uniform float uRip;
varying float vH; varying vec2 vP; varying float vR;
void main(){
  vec3 p = position; vec2 xz = vec2(p.x, -p.y);
  float h = sin(xz.x*1.6+uTime*1.1)*0.025 + sin(xz.y*2.1-uTime*0.8)*0.02 + sin((xz.x+xz.y)*3.3+uTime*1.7)*0.01;
  float age = uTime - uRip; float r = 0.0;
  if (age > 0.0 && age < 4.0) { float d = length(xz); float ring = exp(-pow((d - age*1.1)*3.0, 2.0))*(1.0-age/4.0); h += ring*0.09*sin(d*12.0-age*14.0); r = ring; }
  float d0 = length(xz); h += 0.05*exp(-d0*d0*6.0)*step(0.0, -uRip+uTime) ;
  p.z += h; vH = h; vP = xz; vR = r;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const waterFrag = /* glsl */ `
varying float vH; varying vec2 vP; varying float vR;
void main(){
  float d = length(vP);
  float a = smoothstep(1.85, 0.45, d); // gone well before the canvas edge
  vec3 col = mix(vec3(0.012,0.08,0.15), vec3(0.07,0.24,0.38), clamp(vH*9.0+0.5,0.0,1.0));
  col += vec3(0.6,0.78,0.92) * (smoothstep(0.035,0.06,vH)*0.18 + vR*0.7);
  gl_FragColor = vec4(col, a*0.92);
}`;

function Water({ rip }: { rip: React.MutableRefObject<number> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uRip: { value: -99 } }), []);
  useFrame(({ clock }) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value = clock.elapsedTime;
    mat.current.uniforms.uRip.value = rip.current;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} renderOrder={2}>
      <planeGeometry args={[6, 6, 160, 160]} />
      <shaderMaterial ref={mat} vertexShader={waterVert} fragmentShader={waterFrag} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  );
}

/** Water sheeting off the trailing edge: drops fall under gravity and vanish at the surface. */
export function Drips({ tail, active, floor = -0.55, count = 90 }: { tail: React.MutableRefObject<THREE.Group | null>; active: React.MutableRefObject<boolean>; floor?: number; count?: number }) {
  const N = count;
  const edge = useMemo(() => trailingEdgePoints(40), []);
  const pts = useRef<THREE.Points>(null);
  const state = useMemo(() => Array.from({ length: N }, () => ({ p: new THREE.Vector3(0, -9, 0), v: new THREE.Vector3(), life: 0 })), [N]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3));
    return g;
  }, [N]);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const arr = geo.attributes.position.array as Float32Array;
    state.forEach((d, i) => {
      if (d.life <= 0 && active.current && tail.current && Math.random() < dt * 3.2) {
        tmp.copy(edge[Math.floor(Math.random() * edge.length)]);
        tail.current.localToWorld(tmp);
        d.p.copy(tmp);
        d.v.set((Math.random() - 0.5) * 0.15, -0.1 - Math.random() * 0.2, 0.05 + Math.random() * 0.1);
        d.life = 2;
      }
      if (d.life > 0) {
        d.v.y -= 4.2 * dt;
        d.p.addScaledVector(d.v, dt);
        d.life -= dt;
        if (d.p.y < floor) d.life = 0;
      }
      const vis = d.life > 0;
      arr[i * 3] = vis ? d.p.x : 0;
      arr[i * 3 + 1] = vis ? d.p.y : -9;
      arr[i * 3 + 2] = vis ? d.p.z : 0;
    });
    geo.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={pts} geometry={geo} frustumCulled={false}>
      <pointsMaterial size={0.028} color="#cfe3f3" transparent opacity={0.85} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export function Fluke({
  rip,
  dripping,
  groupRef,
  freeze,
  yaw,
  peak = 1.05,
  phase = 1.2,
  size = 1.35,
  clip = WATERLINE,
  seed = 3,
}: {
  rip: React.MutableRefObject<number>;
  dripping: React.MutableRefObject<boolean>;
  groupRef: React.MutableRefObject<THREE.Group | null>;
  freeze?: number;
  yaw?: number;
  peak?: number;
  phase?: number;
  size?: number;
  clip?: THREE.Plane[];
  seed?: number;
}) {
  const fluke = useMemo(() => flukeGeometry(seed), [seed]);
  const stock = useMemo(() => pedunclGeometry(), []);
  const barnacles = useMemo(() => barnacleSpots(seed, 46), [seed]);
  const g = groupRef;
  const inst = useRef<THREE.InstancedMesh>(null);
  const lastK = useRef(99);
  // wet skin roughness varies across the surface
  const roughMap = useMemo(() => {
    const s = 128;
    const data = new Uint8Array(s * s * 4);
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        const n = fbm(x / 14, y / 14, 4);
        const v = 70 + n * 120;
        const o = (y * s + x) * 4;
        data[o] = data[o + 1] = data[o + 2] = v;
        data[o + 3] = 255;
      }
    const t = new THREE.DataTexture(data, s, s);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.needsUpdate = true;
    return t;
  }, []);

  useFrame(({ clock, pointer }, dt) => {
    if (!g.current) return;
    const t = freeze ?? clock.elapsedTime + phase;
    const c = cycle(t, peak);
    const k = t % CYCLE;
    if (k < lastK.current) rip.current = clock.elapsedTime + 0.9; // breaking the surface
    lastK.current = k;
    dripping.current = c.drip;
    g.current.position.y = c.y;
    g.current.rotation.x = c.pitch;
    if (yaw !== undefined) {
      g.current.rotation.y = yaw;
      return;
    }
    const ty = pointer.x * 0.5 + Math.sin(t * 0.35) * 0.15;
    g.current.rotation.y += (ty - g.current.rotation.y) * Math.min(1, dt * 2.5);
  });

  const bm = useMemo(() => {
    const m = new THREE.Matrix4();
    return barnacles.map((b) => m.clone().compose(b.p, new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, b.r)), new THREE.Vector3(b.s, b.s * 0.7, b.s)));
  }, [barnacles]);

  return (
    <group ref={g} scale={size}>
      <mesh geometry={stock}>
        <meshPhysicalMaterial vertexColors roughness={0.42} roughnessMap={roughMap} clearcoat={0.85} clearcoatRoughness={0.12} sheen={0.4} sheenColor="#8dbbe0" clippingPlanes={clip} />
      </mesh>
      <mesh geometry={fluke}>
        <meshPhysicalMaterial vertexColors roughness={0.4} roughnessMap={roughMap} clearcoat={0.9} clearcoatRoughness={0.1} side={THREE.DoubleSide} sheen={0.35} sheenColor="#8dbbe0" clippingPlanes={clip} />
      </mesh>
      <instancedMesh
        ref={(m) => {
          inst.current = m;
          if (m) bm.forEach((mat, i) => m.setMatrixAt(i, mat));
        }}
        args={[undefined, undefined, bm.length]}
      >
        <coneGeometry args={[1, 1.2, 7]} />
        <meshStandardMaterial color="#c9cfd2" roughness={0.9} clippingPlanes={clip} />
      </instancedMesh>
    </group>
  );
}

/**
 * Hero: a humpback fluke, built in code, breaching on a loop: it rises out of
 * the water, water sheets off the trailing edge, it slides back under and the
 * surface rings. It turns a little toward the cursor.
 */
export default function HeroTail({ freeze, yaw }: { freeze?: number; yaw?: number } = {}) {
  const rip = useRef(-99);
  const dripping = useRef(false);
  const tailRef = useRef<THREE.Group | null>(null);
  return (
    <>
      <ambientLight intensity={0.35} color="#9db7cf" />
      <directionalLight position={[-3, 5, 4]} intensity={2.6} color="#e2eef8" />
      <directionalLight position={[4, 1, -3]} intensity={1.4} color="#639cc5" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} color="#dbe9f5" position={[0, 5, 3]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#639cc5" position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[5, 3, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#0c3760" position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
      <group position={[0, -0.55, 0]}>
        <Fluke rip={rip} dripping={dripping} groupRef={tailRef} freeze={freeze} yaw={yaw} />
        <Water rip={rip} />
      </group>
      <Drips tail={tailRef} active={dripping} />
    </>
  );
}
