"use client";
import { useEffect } from "react";

/**
 * The light that follows the cursor across rows (.spot). No cursor ring and no
 * click ping: the pointer stays the system pointer. Mouse only.
 */
export function CursorFx() {
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    const move = (e: PointerEvent) => {
      const spot = (e.target as HTMLElement | null)?.closest<HTMLElement>(".spot, .spot-row");
      if (!spot) return;
      const r = spot.getBoundingClientRect();
      spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
      spot.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return null;
}
