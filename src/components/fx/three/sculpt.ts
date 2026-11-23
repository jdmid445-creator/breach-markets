/**
 * Code-built sculpts for Breach (no meshes, no textures from outside).
 * Units: the fluke spans x ∈ [-1, 1]; y is up; +z faces the viewer (ventral side).
 */
import * as THREE from "three";

/* deterministic noise ---------------------------------------------------- */
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, y: number, oct = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise(x * f, y * f);
    f *= 2.03;
    a *= 0.5;
  }
  return s;
}

/* fluke planform ----------------------------------------------------------- */
// Leading edge (lower, toward the tail stock) and trailing edge (upper, notched,
// scalloped), as heights over the span u ∈ [-1, 1]. Traced from the logo tail:
// tips at +0.40, notch at 0, root leading edge at -0.32.
const leading = (u: number) => -0.34 + 0.74 * Math.pow(Math.abs(u), 2.1);
const trailing = (u: number) => {
  const a = Math.abs(u);
  const notch = -0.07 * Math.exp(-Math.pow(u / 0.07, 2));
  const scallop = a > 0.12 && a < 0.96 ? 0.014 * Math.sin(a * 46) * (1 - a) : 0;
  return 0.405 * (0.55 * a + 0.45 * Math.pow(a, 2.4)) + notch + scallop;
};

/**
 * The humpback fluke: a lofted airfoil surface. Chord runs leading→trailing,
 * thickness follows a NACA-like profile that is fat at the root and paper thin
 * at the tips and trailing edge; the blades sweep back (dihedral) and carry a
 * slight camber. Vertex colours paint the ventral identity pattern: white
 * fields with black margins and streaks, unique per seed like a real fluke ID.
 */
export function flukeGeometry(seed = 3, spanSeg = 140, chordSeg = 40) {
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const dark = new THREE.Color("#1a222c");
  const white = new THREE.Color("#e6ebee");
  const mid = new THREE.Color("#5d6a76");
  const c = new THREE.Color();
  const thick = (u: number, v: number) => {
    const chord = Math.max(0, trailing(u) - leading(u));
    const tr = 0.2 * (1 - 0.55 * Math.abs(u)) + 0.08 * Math.exp(-Math.pow(u / 0.15, 2));
    const naca = 1.48 * (0.2969 * Math.sqrt(v) - 0.126 * v - 0.3516 * v * v + 0.2843 * v * v * v - 0.1036 * v * v * v * v);
    return chord * tr * Math.max(0, naca) + 0.004;
  };
  for (let side = 0; side < 2; side++) {
    const sgn = side === 0 ? 1 : -1; // +1 ventral (front), -1 dorsal (back)
    const base = pos.length / 3;
    for (let i = 0; i <= spanSeg; i++) {
      // cluster samples toward the tips and the notch
      const t = i / spanSeg;
      const u = Math.sin((t * 2 - 1) * (Math.PI / 2));
      for (let j = 0; j <= chordSeg; j++) {
        const v = 0.5 - 0.5 * Math.cos((j / chordSeg) * Math.PI);
        const y = leading(u) + (trailing(u) - leading(u)) * v;
        const sweep = 0.1 * u * u + 0.035 * Math.sin(v * Math.PI) * (1 - Math.abs(u)); // dihedral + camber
        const z = sweep + sgn * thick(u, v);
        pos.push(u, y, z);
        if (sgn > 0) {
          // ventral pattern: white field, black trailing margin and tips, noisy streaks
          const n = fbm(u * 3.2 + seed, y * 6 + seed * 1.7, 5);
          const streak = fbm(u * 5 + y * 7 + seed * 3, y * 3 - u * 4, 3);
          const margin = Math.min(1, Math.max(0, (v - 0.78) / 0.14)) + Math.max(0, Math.abs(u) - 0.82) * 4;
          const spots = fbm(u * 22 + seed, y * 22, 2) > 0.7 ? 0.4 : 0;
          let w = THREE.MathUtils.smoothstep(n + 0.12 - margin * 0.9 - (streak > 0.6 ? 0.35 : 0) - spots, 0.42, 0.5);
          w = Math.min(1, Math.max(0, w));
          c.copy(dark).lerp(mid, n * 0.35).lerp(white, w);
        } else {
          const n = fbm(u * 5 + 9, y * 9, 4);
          c.copy(dark).lerp(mid, n * 0.22);
        }
        col.push(c.r, c.g, c.b);
      }
    }
    for (let i = 0; i < spanSeg; i++)
      for (let j = 0; j < chordSeg; j++) {
        const a = base + i * (chordSeg + 1) + j, b = a + chordSeg + 1;
        if (sgn > 0) idx.push(a, b, a + 1, b, b + 1, a + 1);
        else idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * The tail stock: lofted ellipses along a gently curving spine, laterally
 * compressed with a ventral keel, widening into the body under the water and
 * necking into the fluke root at the top.
 */
export function pedunclGeometry(rings = 48, radial = 36) {
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const dark = new THREE.Color("#1a222c");
  const pale = new THREE.Color("#7c8894");
  const c = new THREE.Color();
  for (let i = 0; i <= rings; i++) {
    const t = i / rings; // 0 bottom (body) → 1 fluke root
    const y = -2.6 + t * 2.32;
    const zc = -0.18 * Math.sin(t * Math.PI * 0.9) + 0.05 * t; // spine curve
    // laterally compressed stock that flares sideways into the fluke root at the top
    const flare = Math.pow(Math.max(0, (t - 0.72) / 0.28), 2);
    const cap = t > 0.94 ? Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.94) / 0.06, 2))) : 1; // closes inside the fluke root
    const rx = (0.085 + 0.34 * Math.pow(1 - t, 1.6) + 0.12 * flare) * cap; // lateral half-width
    const rz = (0.15 + 0.5 * Math.pow(1 - t, 1.4) - 0.08 * flare) * cap; // dorso-ventral half-depth
    for (let k = 0; k <= radial; k++) {
      const a = (k / radial) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const keel = sa > 0 ? 1 + 0.18 * Math.pow(Math.max(0, sa), 6) : 1; // ventral keel ridge
      const n = fbm(a * 2, y * 3, 3);
      const x = ca * rx * (1 + (n - 0.5) * 0.05);
      const z = zc + sa * rz * keel;
      pos.push(x, y, z);
      c.copy(dark).lerp(pale, Math.max(0, sa) * 0.35 * n);
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < rings; i++)
    for (let k = 0; k < radial; k++) {
      const a = i * (radial + 1) + k, b = a + radial + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Barnacle clusters where humpbacks carry them: fluke tips and trailing edge. Returns transforms. */
export function barnacleSpots(seed = 3, count = 46) {
  const out: { p: THREE.Vector3; s: number; r: number }[] = [];
  let k = 0;
  while (out.length < count && k < 2000) {
    k++;
    const u = (hash(k, seed) * 2 - 1) * 0.98;
    const a = Math.abs(u);
    if (a < 0.45 && hash(k, seed + 7) > 0.15) continue; // mostly outboard
    const v = 0.55 + hash(k + 3, seed) * 0.4;
    const y = leading(u) + (trailing(u) - leading(u)) * v;
    const z = 0.1 * u * u + 0.012;
    out.push({ p: new THREE.Vector3(u, y, z), s: 0.008 + hash(k, seed + 2) * 0.016, r: hash(k, seed + 5) * Math.PI });
  }
  return out;
}

/** Points along the trailing edge, where water sheets off as drips. */
export function trailingEdgePoints(n = 40) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const u = (i / (n - 1)) * 1.9 - 0.95;
    pts.push(new THREE.Vector3(u, trailing(u) - 0.01, 0.1 * u * u));
  }
  return pts;
}

/* buoy ----------------------------------------------------------------------- */

/** A channel buoy hull: a lathe profile (flared skirt, waisted body, domed shoulder). */
export function buoyHullGeometry(height: number) {
  const h = height;
  const prof: [number, number][] = [
    [0.0, -0.9], [0.5, -0.88], [0.78, -0.7], [0.86, -0.42], [0.82, -0.2],
    [0.72, 0.0], [0.66, h * 0.4], [0.64, h * 0.75], [0.6, h * 0.92], [0.48, h * 1.02], [0.3, h * 1.06], [0.0, h * 1.07],
  ];
  const pts = prof.map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 72);
  // painted bands (vertex colours), algae and rust near the waterline
  const p = g.attributes.position;
  const cols: number[] = [];
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const ang = Math.atan2(z, x);
    const band = y > h * 0.55 ? "top" : y > 0.02 ? "mid" : "below";
    if (band === "below") c.set("#1c3b2f").lerp(new THREE.Color("#2b2f2a"), fbm(ang * 3, y * 6, 3));
    else c.set(band === "top" ? "#eef3f8" : "#639cc5");
    // rust streaks running down from the shoulder
    const streak = fbm(ang * 9, 2, 2);
    if (y > 0 && streak > 0.66) c.lerp(new THREE.Color("#6b4a3a"), (streak - 0.66) * 1.6 * (1 - y / (h * 1.1)));
    // waterline grime
    const wl = Math.exp(-Math.pow((y - 0.02) / 0.09, 2));
    c.lerp(new THREE.Color("#22302a"), wl * 0.6 * fbm(ang * 6, 1, 3));
    cols.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  g.computeVertexNormals();
  return g;
}
