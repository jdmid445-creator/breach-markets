"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { WhaleControl } from "./WhaleScene";

const Canvas = dynamic(() => import("@react-three/fiber").then((m) => m.Canvas), { ssr: false });
const WhaleScene = dynamic(() => import("./WhaleScene").then((m) => m.WhaleScene), { ssr: false });

/**
 * A little whale that lives behind the page. On the home page it breaches out
 * of the intro's water once the film ends, arcs over the page, then dives
 * behind the content and wanders for the rest of the scroll, swimming faster
 * the faster you scroll. Other pages: it swims in from the side.
 */
/**
 * Where the whale should rest: the empty space right of the section title
 * nearest the middle of the screen (titles marked data-whale-spot). Phones
 * have no side space, so it rests low in the right corner instead.
 */
function findSpot(): { x: number; y: number } | null {
  const W = window.innerWidth;
  const H = window.innerHeight;
  if (W < 768) return { x: W - 70, y: H - 150 };
  let best: { x: number; y: number; d: number } | null = null;
  document.querySelectorAll<HTMLElement>("[data-whale-spot]").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.bottom < H * 0.08 || r.top > H * 0.85) return;
    // right edge of the words themselves, not the block
    let right = r.left;
    el.querySelectorAll("span").forEach((sp) => {
      const q = sp.getBoundingClientRect();
      if (q.width > 0) right = Math.max(right, q.right);
    });
    if (right === r.left) right = r.left + r.width * 0.6;
    const room = W - right;
    if (room < 260) return;
    const x = Math.min(W - 150, right + Math.max(140, room * 0.45));
    const y = Math.min(H * 0.8, Math.max(H * 0.2, r.top + r.height * 0.55));
    const d = Math.abs(y - H * 0.45);
    if (!best || d < best.d) best = { x, y, d };
  });
  if (best) return { x: (best as { x: number }).x, y: (best as { y: number }).y };
  return { x: W - 130, y: H * 0.62 };
}

export function SwimmingWhale() {
  const path = usePathname();
  const box = useRef<HTMLDivElement>(null);
  const [ok, setOk] = useState(false);
  const [small, setSmall] = useState(false);
  const [active, setActive] = useState(false);
  const vel = useRef(0);
  const introBottom = useRef<number | null>(null);
  const spot = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      const c = document.createElement("canvas");
      if (!(c.getContext("webgl2") || c.getContext("webgl"))) return;
    } catch {
      return;
    }
    setSmall(window.matchMedia("(max-width: 767px)").matches);
    setOk(true);
  }, []);

  // scroll speed and where the intro ends; only read on scroll, never per frame
  useEffect(() => {
    if (!ok) return;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let raf = 0;
    const read = () => {
      const intro = document.getElementById("intro");
      const b = intro ? intro.getBoundingClientRect().bottom : null;
      introBottom.current = b;
      spot.current = findSpot();
      setActive(b === null || b < window.innerHeight * 1.1);
    };
    const onScroll = () => {
      const now = performance.now();
      const dy = window.scrollY - lastY;
      const inst = (dy / Math.max(8, now - lastT)) * 1000;
      vel.current = vel.current * 0.6 + inst * 0.4;
      lastY = window.scrollY;
      lastT = now;
      read();
    };
    // let the scroll speed fall back to zero when scrolling stops
    const decay = () => {
      vel.current *= 0.92;
      raf = requestAnimationFrame(decay);
    };
    read();
    raf = requestAnimationFrame(decay);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", read);
    };
  }, [ok, path]);

  const ctl: WhaleControl = useMemo(
    () => ({
      vel,
      introBottom,
      spot,
      layer: (front) => {
        const el = box.current;
        if (!el) return;
        // over the page for the leap (still under the nav), behind the content after the dive
        el.style.zIndex = front ? "30" : "-5";
        el.style.opacity = front ? "1" : "0.82";
      },
    }),
    [],
  );

  if (!ok) return null;
  return (
    <div ref={box} aria-hidden className="pointer-events-none fixed inset-0 transition-opacity duration-500" style={{ zIndex: 30 }}>
      <Canvas
        key={path}
        orthographic
        frameloop={active ? "always" : "never"}
        dpr={small ? 1 : [1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ position: [0, -3.4, 10], zoom: small ? 48 : 74, near: 0.1, far: 100 }}
        style={{ pointerEvents: "none" }}
      >
        <WhaleScene ctl={ctl} small={small} />
      </Canvas>
    </div>
  );
}
