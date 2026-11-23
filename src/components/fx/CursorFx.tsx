"use client";
import { useEffect, useRef } from "react";

/**
 * Desk-wide pointer life: a soft ring that trails the cursor and swells over
 * anything clickable, a sonar ping where you click, and the light that follows
 * the cursor across rows (.spot). Mouse only; off for reduced motion.
 */
export function CursorFx() {
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(hover: none), (prefers-reduced-motion: reduce)").matches) return;
    let x = -100, y = -100, rx = -100, ry = -100, big = 0, cur = 0, raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const t = e.target as HTMLElement | null;
      big = t?.closest("a, button, [role=tab], [role=switch], select, input, canvas") ? 1 : 0;
      const spot = t?.closest<HTMLElement>(".spot");
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
        spot.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
    };
    const click = (e: PointerEvent) => {
      if (document.getElementById("intro")?.contains(e.target as Node)) return;
      const p = document.createElement("span");
      p.className = "ping";
      p.style.left = `${e.clientX}px`;
      p.style.top = `${e.clientY}px`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 900);
    };
    const tick = () => {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      cur += (big - cur) * 0.18;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${1 + cur * 1.4})`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", click);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", click);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ring} aria-hidden className="cursor-ring pointer-events-none fixed left-0 top-0 z-[80] h-7 w-7 rounded-full border border-stone-hi/60 max-[1023px]:hidden" />;
}
