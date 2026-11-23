"use client";
import { useEffect, useState } from "react";

const GLYPHS = "0123456789$.,KMB+-";

/**
 * Split-flap readout (airport departure board): each character flips through
 * random glyphs before landing, left to right. Animates on mount or when
 * `value` changes.
 */
export function SplitFlap({ value, className = "", speed = 38 }: { value: string; className?: string; speed?: number }) {
  const [shown, setShown] = useState(value);
  const [flipping, setFlipping] = useState<boolean[]>(() => value.split("").map(() => false));

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    const chars = value.split("");
    const settle = chars.map((_, i) => 6 + i * 2);
    let tick = 0;
    const id = setInterval(() => {
      tick++;
      setShown(chars.map((c, i) => (tick >= settle[i] || c === " " ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(""));
      setFlipping(chars.map((_, i) => tick < settle[i]));
      if (tick >= Math.max(...settle)) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [value, speed]);

  return (
    <span className={`inline-flex gap-[2px] ${className}`} aria-label={value}>
      {shown.split("").map((c, i) => (
        <span
          key={i}
          aria-hidden
          className={`flap relative inline-block min-w-[0.62em] rounded-[3px] bg-ink/70 px-[0.08em] text-center ring-1 ring-white/5 ${flipping[i] ? "flap-on" : ""}`}
        >
          {c}
        </span>
      ))}
    </span>
  );
}
