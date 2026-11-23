"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import type { Trade } from "@/lib/pm";
import { usd, cents, ago } from "@/lib/format";
import { isSport } from "@/lib/sports";

/* The Breach logo's whale tail, extruded. Same path as the logo tile. */
const TAIL =
  "M28.6 50 C29 45 29.4 41.5 29.6 38.6 C23.5 38.2 15.6 34.8 10.5 24.2 C10.2 23.4 10.9 22.8 11.6 23.3 C17.8 27.4 25 28.8 30.4 30.2 C31.1 30.4 31.6 31 32 31.8 C32.4 31 32.9 30.4 33.6 30.2 C39 28.8 46.2 27.4 52.4 23.3 C53.1 22.8 53.8 23.4 53.5 24.2 C48.4 34.8 40.5 38.2 34.4 38.6 C34.6 41.5 35 45 35.4 50 Z";

function tailGeometry() {
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="${TAIL}"/></svg>`);
  const shapes = data.paths.flatMap((p) => p.toShapes());
  const g = new THREE.ExtrudeGeometry(shapes, { depth: 3.2, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 0.9, bevelSegments: 3, curveSegments: 18 });
  // SVG y points down: flip, center on the stock's base, scale to ~1 unit tall
  g.scale(1 / 36, -1 / 36, 1 / 36);
  g.computeBoundingBox();
  const b = g.boundingBox!;
  g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
  g.computeVertexNormals();
  return g;
}

const SECTORS = [
  { id: "sports", label: "Sports" },
  { id: "politics", label: "Politics" },
  { id: "crypto", label: "Crypto" },
  { id: "other", label: "Everything else" },
] as const;
const sectorOf = (t: Trade) => (isSport(t.bucket) ? 0 : t.bucket === "politics" ? 1 : t.bucket === "crypto" ? 2 : 3);
const R_MIN = 1.6;
const R_MAX = 8.6;

type Placed = { t: Trade; x: number; z: number; s: number; phase: number };

/* ---------------- water ---------------- */

const waterVert = /* glsl */ `
uniform float uTime;
uniform vec3 uRip[8];
varying float vH;
varying vec2 vXZ;
varying float vRip;
float wave(vec2 p){
  return sin(p.x*0.55+uTime*0.7)*0.07 + sin(p.y*0.75-uTime*0.55)*0.06 + sin((p.x+p.y)*1.4+uTime*1.05)*0.035 + sin(length(p)*1.1-uTime*0.9)*0.03;
}
void main(){
  vec3 pos = position;
  vec2 xz = vec2(pos.x, -pos.y);
  float h = wave(xz);
  float r = 0.0;
  for(int i=0;i<8;i++){
    float age = uTime - uRip[i].z;
    if(age > 0.0 && age < 4.5){
      float d = distance(xz, uRip[i].xy);
      float front = age * 2.4;
      float ring = exp(-pow((d - front) * 2.2, 2.0)) * (1.0 - age / 4.5);
      h += ring * 0.28 * sin(d * 5.5 - age * 9.0);
      r += ring;
    }
  }
  pos.z += h;
  vH = h; vXZ = xz; vRip = r;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

const waterFrag = /* glsl */ `
uniform float uTime;
varying float vH;
varying vec2 vXZ;
varying float vRip;
void main(){
  float d = length(vXZ);
  float edge = smoothstep(10.4, 7.6, d);
  vec3 deep = vec3(0.010, 0.075, 0.145);
  vec3 shallow = vec3(0.060, 0.215, 0.345);
  vec3 col = mix(deep, shallow, clamp(vH * 3.2 + 0.45, 0.0, 1.0));
  // depth rings every 1.75 units, and the four market spokes
  float f = fract(d / 1.75);
  float ringLine = 1.0 - smoothstep(0.0, 0.035, min(f, 1.0 - f));
  float a = atan(vXZ.y, vXZ.x);
  float q = 1.5707963;
  float s = abs(fract(a / q) - 0.5) ;
  float spoke = 1.0 - smoothstep(0.0, 0.022, (0.5 - s) * q * d);
  float inner = smoothstep(${R_MIN.toFixed(1)} - 0.4, ${R_MIN.toFixed(1)}, d);
  col += vec3(0.39, 0.61, 0.77) * ringLine * 0.22 * edge * inner;
  // moonlight glints on wave crests
  float glint = smoothstep(0.1, 0.16, vH) * 0.35;
  col += vec3(0.55, 0.73, 0.88) * (glint + vRip * 0.7);
  gl_FragColor = vec4(col, edge * 0.96);
}`;

function Water({ ripples }: { ripples: React.MutableRefObject<THREE.Vector3[]> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uRip: { value: Array.from({ length: 8 }, () => new THREE.Vector3(0, 0, -99)) } }), []);
  useFrame(({ clock }) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value = clock.elapsedTime;
    mat.current.uniforms.uRip.value = ripples.current;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <planeGeometry args={[22, 22, 220, 220]} />
      <shaderMaterial ref={mat} vertexShader={waterVert} fragmentShader={waterFrag} uniforms={uniforms} transparent depthWrite />
    </mesh>
  );
}

/* ---------------- tails ---------------- */

function Tail({
  p,
  geo,
  hovered,
  dimmed,
  onHover,
  onOut,
  onClick,
  born,
}: {
  p: Placed;
  geo: THREE.ExtrudeGeometry;
  hovered: boolean;
  dimmed: boolean;
  onHover: () => void;
  onOut: () => void;
  onClick: () => void;
  born: React.MutableRefObject<Map<string, number>>;
}) {
  const g = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const rank = p.t.rank;
  const elite = rank !== null && rank <= 10;
  const color = elite ? "#eb2f33" : rank !== null ? "#eef3f8" : "#639cc5";
  const scaleTarget = useRef(p.s);

  useFrame(({ clock }, dt) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    // breach: rises out of the water with an overshoot, then settles and bobs
    const age = t - (born.current.get(p.t.id) ?? -10);
    let rise = 1;
    if (age < 1.6) {
      const k = Math.max(0, age) / 1.6;
      rise = 1 + Math.sin(k * Math.PI) * 0.55 - (1 - k) * (1 - k) * 1.4;
    }
    const bob = Math.sin(t * 1.2 + p.phase) * 0.05;
    g.current.position.y = -0.38 * p.s + bob + (rise - 1) * 1.6 * p.s;
    g.current.rotation.z = Math.sin(t * 0.8 + p.phase) * 0.06;
    scaleTarget.current = p.s * (hovered ? 1.18 : 1);
    const cur = g.current.scale.x;
    const next = cur + (scaleTarget.current - cur) * Math.min(1, dt * 10);
    g.current.scale.setScalar(next);
    if (mat.current) {
      const o = dimmed ? 0.28 : 1;
      mat.current.opacity += (o - mat.current.opacity) * Math.min(1, dt * 8);
      mat.current.emissiveIntensity = hovered ? 0.55 : elite ? 0.28 : 0.06;
    }
  });

  return (
    <group ref={g} position={[p.x, 0, p.z]} rotation={[0, Math.atan2(p.x, p.z), 0]}>
      <mesh
        geometry={geo}
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          onOut();
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <meshStandardMaterial ref={mat} color={color} emissive={color} emissiveIntensity={elite ? 0.28 : 0.06} roughness={0.35} metalness={0.15} transparent />
      </mesh>
    </group>
  );
}

/**
 * Fit the whole sea to the panel, then dolly in as the panel scrolls up the
 * screen: the sea starts far and small and swells to fill the frame.
 */
function Rig() {
  const { camera, size, controls, gl } = useThree();
  const fit = useRef(14);
  const target = useMemo(() => new THREE.Vector3(0, 0.4, 0), []);
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const v = THREE.MathUtils.degToRad(cam.fov / 2);
    const h = Math.atan(Math.tan(v) * aspect);
    // phones crop the outer ring a little so the whales stay big enough to read
    fit.current = Math.max((aspect < 1 ? 8.2 : 10.6) / Math.tan(h), 5.4 / Math.tan(v), aspect < 1 ? 8 : 10);
    const el = aspect < 1.35 ? 0.92 : 0.62;
    cam.position.set(0, Math.sin(el) * fit.current * 1.5, Math.cos(el) * fit.current * 1.5);
    cam.lookAt(target);
    (controls as unknown as { update?: () => void } | null)?.update?.();
  }, [camera, size, controls, target]);
  // scroll progress is measured on scroll, never inside the frame loop (reading layout every frame stutters on phones)
  const prog = useRef(0);
  useEffect(() => {
    const el = gl.domElement;
    const read = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      prog.current = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.95)));
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [gl]);
  const dir = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const want = fit.current * (1.55 - 0.55 * prog.current);
    dir.copy(camera.position).sub(target);
    const cur = dir.length();
    if (Math.abs(want - cur) < 0.001) return;
    camera.position.copy(target).add(dir.setLength(cur + (want - cur) * Math.min(1, dt * 4)));
  });
  return null;
}

type Sector = { id: string; label: string; a0: number; a1: number };

/**
 * Spread the tails out: each market gets a slice of the sea sized by how many
 * bets it has, newest bets sit nearest the middle, and a few rounds of
 * relaxation push apart any tails that would touch.
 */
function layout(list: Trade[]): { placed: Placed[]; sectors: Sector[] } {
  const counts = [0, 0, 0, 0];
  list.forEach((t) => counts[sectorOf(t)]++);
  const weights = counts.map((c) => 0.35 + Math.sqrt(c));
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = -Math.PI / 2 - (weights[0] / total) * Math.PI; // first slice faces the camera
  const sectors: Sector[] = SECTORS.map((sct, i) => {
    const w = (weights[i] / total) * Math.PI * 2;
    const out = { ...sct, a0: acc, a1: acc + w };
    acc += w;
    return out;
  });
  if (!list.length) return { placed: [], sectors };
  const max = Math.max(...list.map((t) => t.usd));
  const placed: (Placed & { sec: number })[] = [];
  for (let k = 0; k < 4; k++) {
    const items = list.filter((t) => sectorOf(t) === k).sort((a, b) => b.ts - a.ts);
    const { a0, a1 } = sectors[k];
    const pad = Math.min(0.12, (a1 - a0) * 0.15);
    items.forEach((t, j) => {
      let h = 0;
      for (const c of t.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      const r = R_MIN + (items.length > 1 ? j / (items.length - 1) : 0.3) * (R_MAX - R_MIN);
      const f = (j * 0.618034 + (h % 97) / 970) % 1;
      const ang = a0 + pad + f * (a1 - a0 - pad * 2);
      placed.push({ t, x: Math.cos(ang) * r, z: Math.sin(ang) * r, s: 0.55 + 0.95 * Math.sqrt(t.usd / max), phase: (h % 628) / 100, sec: k });
    });
  }
  // relax: no two tails closer than their combined half-widths
  for (let it = 0; it < 90; it++) {
    for (let i = 0; i < placed.length; i++)
      for (let j = i + 1; j < placed.length; j++) {
        const A = placed[i], B = placed[j];
        const dx = B.x - A.x, dz = B.z - A.z;
        const d = Math.hypot(dx, dz) || 0.001;
        const min = (A.s + B.s) * 0.62;
        if (d < min) {
          const push = (min - d) / 2;
          const ux = dx / d, uz = dz / d;
          A.x -= ux * push; A.z -= uz * push;
          B.x += ux * push; B.z += uz * push;
        }
      }
    for (const P of placed) {
      // keep each tail inside its market's slice and inside the sea
      let r = Math.hypot(P.x, P.z);
      let ang = Math.atan2(P.z, P.x);
      const { a0, a1 } = sectors[P.sec];
      while (ang < a0) ang += Math.PI * 2;
      while (ang > a0 + Math.PI * 2) ang -= Math.PI * 2;
      const inset = Math.min(0.5 / Math.max(r, 1), (a1 - a0) / 2 - 0.001);
      if (ang > a1 - inset) ang = ang - (a1 - inset) < (a0 + Math.PI * 2 - ang) ? a1 - inset : a0 + inset;
      if (ang < a0 + inset) ang = a0 + inset;
      r = Math.min(R_MAX + 0.6, Math.max(R_MIN, r));
      P.x = Math.cos(ang) * r;
      P.z = Math.sin(ang) * r;
    }
  }
  return { placed, sectors };
}

function Scene({ trades, fresh, onPick, hover, setHover, now }: { trades: Trade[]; fresh?: Set<string>; onPick: (t: Trade) => void; hover: string | null; setHover: (id: string | null) => void; now: number }) {
  const geo = useMemo(() => tailGeometry(), []);
  const ripples = useRef<THREE.Vector3[]>(Array.from({ length: 8 }, () => new THREE.Vector3(0, 0, -99)));
  const born = useRef(new Map<string, number>());
  const { clock } = useThree();

  const { placed, sectors } = useMemo(() => layout(trades.slice(0, 60)), [trades]);

  // new bets: start their breach now and drop a ripple where they land
  useEffect(() => {
    const t = clock.elapsedTime;
    let i = 0;
    for (const p of placed) {
      if (!born.current.has(p.t.id)) {
        const isFresh = fresh?.has(p.t.id) ?? false;
        born.current.set(p.t.id, isFresh ? t + i * 0.12 : -10);
        if (isFresh) {
          ripples.current = [new THREE.Vector3(p.x, p.z, t + i * 0.12), ...ripples.current].slice(0, 8);
          i++;
        }
      }
    }
  }, [placed, fresh, clock]);

  // first time the sea appears: every tail breaches in a wave from the center out
  const introAt = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (introAt.current === null) {
      introAt.current = clock.elapsedTime;
      placed.forEach((p) => {
        const d = Math.hypot(p.x, p.z);
        born.current.set(p.t.id, introAt.current! + 0.25 + d * 0.09);
      });
      ripples.current = [new THREE.Vector3(0, 0, introAt.current + 0.1), ...ripples.current].slice(0, 8);
    }
  });

  const labels = sectors.map((sc) => {
    const a = (sc.a0 + sc.a1) / 2;
    const r = 9.75;
    return { ...sc, x: Math.cos(a) * r, z: Math.sin(a) * r, rot: -a + Math.PI / 2 };
  });

  const hovered = placed.find((p) => p.t.id === hover);

  return (
    <>
      <ambientLight intensity={0.45} color="#9db7cf" />
      <directionalLight position={[-6, 9, 4]} intensity={1.9} color="#dbe9f5" />
      <pointLight position={[0, 3, 0]} intensity={8} distance={14} color="#639cc5" />
      <Water ripples={ripples} />
      {placed.map((p) => (
        <Tail
          key={p.t.id}
          p={p}
          geo={geo}
          born={born}
          hovered={hover === p.t.id}
          dimmed={hover !== null && hover !== p.t.id}
          onHover={() => setHover(p.t.id)}
          onOut={() => setHover(null)}
          onClick={() => onPick(p.t)}
        />
      ))}
      {/* the biggest bets carry their size, printed on the tail and sized to fit it */}
      {[...placed]
        .sort((a, b) => b.t.usd - a.t.usd)
        .slice(0, 14)
        .map((p) => {
          const label = usd(p.t.usd);
          const fluke = (43 / 36) * p.s; // tail width in world units
          const fs = Math.min(0.42, (fluke * 0.82) / (label.length * 0.56));
          return (
            <Billboard key={`l-${p.t.id}`} position={[p.x, p.s * 0.62, p.z]}>
              <Text
                font="/fonts/hanken-700i.woff"
                position={[0, 0, Math.max(0.3, p.s * 0.35)]}
                fontSize={fs}
                color={p.t.rank !== null && p.t.rank <= 10 ? "#ffffff" : "#03203d"}
                anchorX="center"
                anchorY="middle"
                outlineWidth={fs * 0.12}
                outlineColor={p.t.rank !== null && p.t.rank <= 10 ? "#8f1418" : "#eef3f8"}
                renderOrder={5}
              >
                {label}
              </Text>
            </Billboard>
          );
        })}
      {labels.map((l) => (
        <Text key={l.id} font="/fonts/hanken-600.woff" position={[l.x, 0.05, l.z]} rotation={[-Math.PI / 2, 0, l.rot]} fontSize={0.5} color="#8dbbe0" anchorX="center" anchorY="middle" fillOpacity={0.9}>
          {l.label}
        </Text>
      ))}
      {/* market boundaries */}
      {sectors.map((sc) => (
        <mesh key={`b-${sc.id}`} position={[Math.cos(sc.a0) * ((R_MIN + 10) / 2), 0.03, Math.sin(sc.a0) * ((R_MIN + 10) / 2)]} rotation={[-Math.PI / 2, 0, -sc.a0]}>
          <planeGeometry args={[10 - R_MIN + 0.6, 0.035]} />
          <meshBasicMaterial color="#639cc5" transparent opacity={0.45} />
        </mesh>
      ))}
      {hovered && (
        <Html position={[hovered.x, hovered.s * 1.05 + 0.4, hovered.z]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
          <div className="tip-in w-[260px] -translate-y-full rounded-lg border border-hair-2 bg-sea/95 px-3.5 py-3 text-left shadow-[0_10px_30px_rgba(0,8,20,.5)]">
            <div className="flex items-center gap-2">
              {hovered.t.rank !== null && (
                <span className={`fig rounded-[5px] px-1.5 py-0.5 text-[12px] font-bold ${hovered.t.rank <= 10 ? "bg-scarlet-deep text-white" : "border border-hair-2 text-stone-hi"}`}>
                  #{hovered.t.rank}
                </span>
              )}
              <span className={`truncate text-[14px] ${hovered.t.rank !== null ? "font-bold text-fg" : "text-mist"}`}>{hovered.t.name}</span>
              <span className="fig ml-auto text-[15px] font-semibold text-fg">{usd(hovered.t.usd)}</span>
            </div>
            <div className="mt-1.5 text-[13px] text-mist">
              {hovered.t.side === "BUY" ? "Bought" : "Sold"} {hovered.t.outcome} at <span className="fig text-fg">{cents(hovered.t.price)}</span>
              <span className="text-faint"> · {ago(hovered.t.ts, now)} ago</span>
            </div>
            <div className="mt-1 line-clamp-2 text-[13px] leading-snug text-fg/90">{hovered.t.title}</div>
          </div>
        </Html>
      )}
      <Rig />
    </>
  );
}

/**
 * The sea: every whale bet is a tail breaking the surface. Height = size,
 * red = a top-10 trader, white = any ranked trader. Markets are the four
 * quarters, newest bets nearest the middle. Drag to turn it.
 */
export default function WhaleSea({ trades, fresh, height = 520 }: { trades: Trade[]; fresh?: Set<string>; height?: number }) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const [touch, setTouch] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [now, setNow] = useState(() => Date.now() / 1000);
  const box = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      setVisible(e.isIntersecting);
      if (e.isIntersecting) setMounted(true);
    }, { rootMargin: "120px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    setTouch(window.matchMedia("(hover: none)").matches);
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const id = setInterval(() => setNow(Date.now() / 1000), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div ref={box} className="relative w-full" style={{ height: `min(${height}px, 120vw)` }}>
      {mounted && (
      <Canvas
        frameloop={visible ? "always" : "never"}
        camera={{ position: [0, 6.2, 12.5], fov: 38 }}
        dpr={touch ? [1, 1.25] : [1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onPointerMissed={() => setHover(null)}
        style={{ touchAction: "pan-y" }}
      >
        <Scene trades={trades} fresh={fresh} onPick={(t) => router.push(`/trader/${t.wallet}`)} hover={hover} setHover={setHover} now={now} />
        <OrbitControls
          makeDefault
          enabled={!touch}
          enableZoom={false}
          enablePan={false}
          autoRotate={!reduce && hover === null}
          autoRotateSpeed={0.35}
          minPolarAngle={0.6}
          maxPolarAngle={1.2}
          target={[0, 0.4, 0]}
          enableDamping
        />
      </Canvas>
      )}
      <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px] text-faint">
        <span>Each tail is a whale bet; taller is bigger</span>
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full bg-scarlet" /> Top-10 trader
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full bg-fg" /> Ranked
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full bg-stone" /> Unranked
        </span>
        <span className="ml-auto max-sm:hidden">{touch ? "Tap a tail" : "Drag to turn · click a tail"}</span>
      </div>
    </div>
  );
}
