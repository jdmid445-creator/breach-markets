"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { flukeGeometry, fbm } from "../three/sculpt";

/* ------------------------------------------------------------------ */
/* Model: a small humpback, all code. Body runs along +x (snout at +1, */
/* tail root at -1), back faces +z (toward the camera).                */
/* ------------------------------------------------------------------ */

const BACK = new THREE.Color("#2e5576");
const BELLY = new THREE.Color("#dfe8ef");
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Half-width and half-height of the body at t (0 = tail root, 1 = snout). */
function girth(t: number) {
  const s = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.8);
  const w = 0.045 + 0.27 * s;
  const h = (0.035 + 0.2 * s) * (t > 0.7 ? 1 - (0.3 * (t - 0.7)) / 0.3 : 1);
  return { w, h };
}

function bodyGeometry() {
  const SEG = 64;
  const RAD = 28;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const c = new THREE.Color();
  for (let i = 0; i <= SEG; i++) {
    const t = i / SEG;
    const x = -1 + 2 * t;
    const { w, h } = girth(t);
    for (let j = 0; j <= RAD; j++) {
      const a = (j / RAD) * Math.PI * 2;
      const sa = Math.sin(a);
      pos.push(x, w * Math.cos(a), h * sa - (t > 0.6 ? 0.03 * (t - 0.6) : 0));
      // dark back, pale belly, a few pale flank blotches the way humpbacks have
      const belly = smooth(0.2, -0.55, sa);
      const blotch = fbm(t * 9 + 3, j * 0.45, 3) > 0.64 ? 0.55 * (1 - Math.abs(sa)) : 0;
      c.copy(BACK).lerp(BELLY, Math.max(belly, blotch));
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < SEG; i++)
    for (let j = 0; j < RAD; j++) {
      const a = i * (RAD + 1) + j;
      const b = a + RAD + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  // close the tail end behind the fluke stock
  const center = pos.length / 3;
  pos.push(-1, 0, 0);
  col.push(BACK.r, BACK.g, BACK.b);
  for (let j = 0; j < RAD; j++) idx.push(center, j + 1, j);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Long humpback flipper, root at the origin, reaching along +x. */
function flipperGeometry() {
  const g = new THREE.SphereGeometry(1, 24, 10);
  g.translate(1, 0, 0);
  g.scale(0.34, 0.07, 0.018);
  return g;
}

/** Soft dark ellipse under the whale so it reads as swimming above the floor. */
function shadowTexture() {
  const s = 64;
  const data = new Uint8Array(s * s * 4);
  for (let y = 0; y < s; y++)
    for (let x = 0; x < s; x++) {
      const d = Math.hypot(x / s - 0.5, y / s - 0.5) * 2;
      const o = (y * s + x) * 4;
      data[o] = 1;
      data[o + 1] = 10;
      data[o + 2] = 22;
      data[o + 3] = Math.round(255 * Math.max(0, 1 - d) ** 1.8);
    }
  const t = new THREE.DataTexture(data, s, s);
  t.needsUpdate = true;
  return t;
}

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* ------------------------------------------------------------------ */

const n1 = (x: number) => 0.55 * Math.sin(x * 1.31 + 1.7) + 0.3 * Math.sin(x * 2.73 + 0.4) + 0.15 * Math.sin(x * 5.17 + 2.9);
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

type Mode = "hidden" | "leap" | "swim";

export type WhaleControl = {
  /** scroll speed in px/s, signed (down is positive) */
  vel: React.MutableRefObject<number>;
  /** where the intro's water ends on screen, in px from the top; null on pages without the intro */
  introBottom: React.MutableRefObject<number | null>;
  /** a calm spot on screen (px) to hang around when the reader stops scrolling */
  spot: React.MutableRefObject<{ x: number; y: number } | null>;
  /** front (over the page, for the leap) or behind the content */
  layer: (front: boolean) => void;
};

export function WhaleScene({ ctl, small }: { ctl: WhaleControl; small: boolean }) {
  const { size, camera } = useThree();
  const zoom = small ? 48 : 74;
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    cam.zoom = zoom;
    cam.position.set(0, -3.4, 10);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, zoom]);

  const body = useMemo(() => bodyGeometry(), []);
  const flipper = useMemo(() => flipperGeometry(), []);
  const fluke = useMemo(() => {
    const g = flukeGeometry(5, 64, 16);
    g.rotateZ(Math.PI / 2);
    g.scale(0.44, 0.44, 0.5);
    return g;
  }, []);
  const shadowTex = useMemo(() => shadowTexture(), []);

  const uni = useMemo(() => ({ uPhase: { value: 0 }, uAmp: { value: 0.07 }, uTurn: { value: 0 } }), []);
  const bodyMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.05 });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uni);
      sh.vertexShader =
        "uniform float uPhase; uniform float uAmp; uniform float uTurn;\n" +
        sh.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          float f = pow((1.0 - position.x) * 0.5, 2.2);
          transformed.z += uAmp * f * sin(uPhase - 3.0 * (1.0 - position.x));
          transformed.y += uTurn * f * 0.35;`,
        );
    };
    return m;
  }, [uni]);

  const root = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const finL = useRef<THREE.Group>(null);
  const finR = useRef<THREE.Group>(null);

  // splash droplets and rings for the leap
  const DROPS = 70;
  const drops = useMemo(() => Array.from({ length: DROPS }, () => ({ p: new THREE.Vector3(0, 0, -50), v: new THREE.Vector3(), life: 0 })), []);
  const dropGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(DROPS * 3), 3));
    return g;
  }, []);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const rings = useRef([
    { at: -99, x: 0, y: 0 },
    { at: -99, x: 0, y: 0 },
  ]);

  const st = useRef({
    mode: "hidden" as Mode,
    pos: new THREE.Vector2(-20, 0),
    th: 0,
    speed: 0.4,
    s: Math.random() * 40,
    phase: 0,
    turn: 0,
    leapT: 0,
    leapFrom: new THREE.Vector2(),
    leapTo: new THREE.Vector2(),
    leapArc: 2,
    pendingBehind: false,
    idle: 0,
    behindAt: 0,
    scale: 1,
  });

  const bend = (x: number, amp: number, phase: number, turn: number) => {
    const f = Math.pow((1 - x) * 0.5, 2.2);
    return { z: amp * f * Math.sin(phase - 3 * (1 - x)), y: turn * f * 0.35 };
  };

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const t = clock.elapsedTime;
    const s = st.current;
    const halfW = size.width / 2 / zoom;
    const halfH = size.height / 2 / zoom;
    const ib = ctl.introBottom.current;

    // decide the mode from where the intro is
    if (ib !== null) {
      if (ib > size.height * 1.02 && s.mode !== "hidden") {
        s.mode = "hidden";
        s.pendingBehind = false;
        ctl.layer(true);
      } else if (ib < size.height * 0.9 && s.mode === "hidden") {
        // breach from the intro's water just above where it ends, arc over the
        // seam, and come down into the page below it
        const toY = (px: number) => (size.height / 2 - px) / zoom;
        const fromPx = Math.min(size.height * 0.92, Math.max(size.height * 0.45, ib - 40));
        const toPx = Math.min(size.height * 0.94, fromPx + size.height * 0.36);
        s.mode = "leap";
        s.leapT = 0;
        s.leapFrom.set(-halfW * 0.18, toY(fromPx));
        s.leapTo.set(halfW * 0.12, toY(toPx));
        s.leapArc = Math.min(halfH * 0.45, toY(size.height * 0.12) - toY(fromPx));
        ctl.layer(true);
        rings.current[0] = { at: t, x: s.leapFrom.x, y: s.leapFrom.y };
        drops.forEach((d) => {
          d.p.set(s.leapFrom.x + (Math.random() - 0.5) * 0.5, s.leapFrom.y, 0.3);
          d.v.set((Math.random() - 0.5) * 2.2, 1.6 + Math.random() * 2.6, 0);
          d.life = 0.6 + Math.random() * 0.9;
        });
      }
    } else if (s.mode === "hidden") {
      // pages without the intro: swim in from the left edge
      s.mode = "swim";
      s.pos.set(-halfW - 1.2, -halfH * 0.2);
      s.th = 0.15;
      ctl.layer(false);
    }
    if (s.mode === "hidden" || !root.current) return;

    const v = ctl.vel.current;
    let amp = 0.07;
    if (s.mode === "leap") {
      s.leapT += dt / 1.9;
      const k = Math.min(1, s.leapT);
      const prev = s.pos.clone();
      s.pos.set(
        THREE.MathUtils.lerp(s.leapFrom.x, s.leapTo.x, k),
        THREE.MathUtils.lerp(s.leapFrom.y, s.leapTo.y, k) + Math.sin(Math.PI * k) * s.leapArc,
      );
      if (s.pos.distanceToSquared(prev) > 1e-8) s.th = Math.atan2(s.pos.y - prev.y, s.pos.x - prev.x);
      // closer to the camera at the top of the arc
      s.scale = 1.25 + 0.6 * Math.sin(Math.PI * k) - 0.25 * smooth(0.75, 1, k);
      s.speed = 1.6;
      amp = 0.12;
      s.turn = 0;
      if (k >= 1) {
        // dives into the page: from here on it swims behind the content
        s.mode = "swim";
        s.scale = 1;
        rings.current[1] = { at: t, x: s.pos.x, y: s.pos.y };
        // stay over the page until it has swum clear of the intro's dark edge
        s.behindAt = t;
        s.pendingBehind = true;
      }
    } else {
      // swim: wander on a noise path while the page moves (faster the faster
      // you scroll); once you stop reading-scroll, it settles into a calm
      // spot beside the section you're on and circles there slowly
      s.idle = Math.abs(v) < 40 ? s.idle + dt : 0;
      const spot = ctl.spot.current;
      const resting = s.idle > 0.6 && spot !== null;
      // heading to its spot it swims with purpose, then slows to a lazy circle
      const far = resting && spot ? Math.hypot((spot.x - size.width / 2) / zoom - s.pos.x, (size.height / 2 - spot.y) / zoom - s.pos.y) : 0;
      const target = resting ? 0.3 + Math.min(far * 0.45, 1.8) : 0.35 + Math.min(Math.abs(v) / 650, 3.2);
      s.speed += (target - s.speed) * Math.min(1, dt * 2.2);
      s.s += s.speed * dt;
      let wx: number;
      let wy: number;
      if (resting && spot) {
        const r = small ? 0.45 : 0.75;
        wx = (spot.x - size.width / 2) / zoom + Math.cos(t * 0.45) * r;
        wy = (size.height / 2 - spot.y) / zoom + Math.sin(t * 0.45) * r * 0.55;
      } else {
        wx = n1(s.s * 0.16) * halfW * 0.78;
        wy = n1(s.s * 0.16 + 61) * halfH * 0.7;
        // scrolling down nudges it down the page, scrolling up nudges it up
        wy -= Math.sign(v) * Math.min(Math.abs(v) / 900, 1) * halfH * 0.5;
      }
      // keep it inside the screen
      if (s.pos.x < -halfW + 1) wx = Math.max(wx, 0);
      if (s.pos.x > halfW - 1) wx = Math.min(wx, 0);
      const want = Math.atan2(wy - s.pos.y, wx - s.pos.x);
      const turn = THREE.MathUtils.clamp(wrap(want - s.th) * 1.4, -1.6, 1.6);
      s.turn += (turn - s.turn) * Math.min(1, dt * 3);
      s.th += s.turn * dt;
      s.pos.x += Math.cos(s.th) * s.speed * dt;
      s.pos.y += Math.sin(s.th) * s.speed * dt;
      s.pos.x = THREE.MathUtils.clamp(s.pos.x, -halfW - 1.5, halfW + 1.5);
      s.pos.y = THREE.MathUtils.clamp(s.pos.y, -halfH + 0.5, halfH - 0.5);
      s.scale += (1 - s.scale) * Math.min(1, dt * 3);
      if (s.pendingBehind) {
        const py = size.height / 2 - s.pos.y * zoom;
        if (ib === null || py > ib + 300 || ib < -200 || t - s.behindAt > 2.2) {
          s.pendingBehind = false;
          ctl.layer(false);
        }
      }
      amp = 0.06 + 0.035 * Math.min(s.speed, 2.5);
    }

    // tail beat speeds up with swim speed
    s.phase += dt * (2.2 + s.speed * 2.4);
    uni.uPhase.value = s.phase;
    uni.uAmp.value = amp;
    uni.uTurn.value = s.turn * 0.35;

    const g = root.current;
    g.position.set(s.pos.x, s.pos.y, 0);
    g.scale.setScalar(s.scale);
    // yaw to the heading, bank into turns (roll around the body axis first)
    g.rotation.set(-s.turn * 0.22 + (s.mode === "leap" ? 0.4 : 0), 0, s.th, "ZXY");

    // fluke follows the end of the bending body
    if (tail.current) {
      const a = bend(-1, amp, s.phase, s.turn * 0.35);
      const b = bend(-0.9, amp, s.phase, s.turn * 0.35);
      tail.current.position.set(-1, a.y, a.z);
      tail.current.rotation.set(0, -Math.atan((a.z - b.z) / -0.1) * 1.5, Math.atan((a.y - b.y) / -0.1), "XYZ");
    }
    const flap = Math.sin(s.phase * 0.5) * 0.18;
    if (finL.current) finL.current.rotation.set(-0.25 + flap, 0, Math.PI / 2 + 0.62);
    if (finR.current) finR.current.rotation.set(0.25 - flap, 0, -(Math.PI / 2 + 0.62));

    // splash
    const arr = dropGeo.attributes.position.array as Float32Array;
    drops.forEach((d, i) => {
      if (d.life > 0) {
        d.v.y -= 6 * dt;
        d.p.addScaledVector(d.v, dt);
        d.life -= dt;
      }
      arr[i * 3] = d.p.x;
      arr[i * 3 + 1] = d.p.y;
      arr[i * 3 + 2] = d.life > 0 ? 0.3 : -50;
    });
    dropGeo.attributes.position.needsUpdate = true;
    [ringA, ringB].forEach((r, i) => {
      const ring = rings.current[i];
      const age = t - ring.at;
      if (!r.current) return;
      r.current.visible = age >= 0 && age < 1.6;
      if (!r.current.visible) return;
      r.current.position.set(ring.x, ring.y, 0);
      r.current.scale.setScalar(0.3 + age * 1.3);
      (r.current.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - age / 1.6);
    });
  });

  return (
    <>
      <hemisphereLight args={["#b9d3ea", "#03203d", 0.8]} />
      <directionalLight position={[-2, 3, 7]} intensity={1.3} color="#eef6fc" />
      <group ref={root}>
        <mesh position={[0.15, -0.25, -0.4]} scale={[2.6, 0.9, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={shadowTex} transparent opacity={0.45} depthWrite={false} />
        </mesh>
        <mesh geometry={body} material={bodyMat} />
        <group ref={finL} position={[0.36, 0.22, -0.06]}>
          <mesh geometry={flipper}>
            <meshStandardMaterial color="#d6e2ec" roughness={0.5} />
          </mesh>
        </group>
        <group ref={finR} position={[0.36, -0.22, -0.06]}>
          <mesh geometry={flipper}>
            <meshStandardMaterial color="#d6e2ec" roughness={0.5} />
          </mesh>
        </group>
        <group ref={tail}>
          <mesh geometry={fluke} position={[-0.12, 0, 0]}>
            <meshStandardMaterial vertexColors roughness={0.45} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
      <points geometry={dropGeo} frustumCulled={false}>
        <pointsMaterial size={small ? 3 : 4} sizeAttenuation={false} color="#cfe5f5" transparent opacity={0.9} depthWrite={false} />
      </points>
      {[ringA, ringB].map((r, i) => (
        <mesh key={i} ref={r} visible={false}>
          <ringGeometry args={[0.92, 1, 64]} />
          <meshBasicMaterial color="#9fc6e4" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}
