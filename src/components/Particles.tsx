"use client";
import { useEffect, useRef } from "react";

/** Drifting marine snow: tiny particles rising slowly, nudged by the cursor. */
export function Particles({ density = 70, className = "" }: { density?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, mx = 0.5, my = 0.5;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    type P = { x: number; y: number; r: number; v: number; a: number; d: number };
    let ps: P[] = [];
    const resize = () => {
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 1e6 * density);
      ps = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + 0.3, v: Math.random() * 0.25 + 0.05, a: Math.random() * 0.5 + 0.15, d: Math.random() * Math.PI * 2 }));
    };
    const move = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height;
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        if (!reduce) {
          p.y -= p.v; p.d += 0.01; p.x += Math.sin(p.d) * 0.15 + (mx - 0.5) * p.r * 0.25;
          if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y + (my - 0.5) * p.r * 6, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168,255,244,${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    resize(); draw();
    const ro = new ResizeObserver(resize); ro.observe(c);
    window.addEventListener("pointermove", move);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("pointermove", move); };
  }, [density]);
  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
