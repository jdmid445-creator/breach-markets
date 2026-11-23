"use client";
import { useEffect, useRef, useState } from "react";

/** Fade + rise into view once, staggered by `delay` ms. */
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${
        on ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Animated number that counts up when it enters view. */
export function CountUp({ value, format }: { value: number; format: "usd" | "int" }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / 1400);
        setN(value * (1 - Math.pow(1 - p, 4)));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);
  const text =
    format === "int"
      ? Math.round(n).toLocaleString()
      : n >= 1e6
        ? `$${(n / 1e6).toFixed(2)}M`
        : n >= 1e4
          ? `$${(n / 1e3).toFixed(1)}K`
          : `$${Math.round(n).toLocaleString()}`;
  return <span ref={ref}>{text}</span>;
}

/** Sonar glow that follows the cursor inside its parent, pinging on click. */
export function SonarCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [pings, setPings] = useState<{ id: number; x: number; y: number }[]>([]);
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ref.current!.style.setProperty("--x", `${e.clientX - r.left}px`);
      ref.current!.style.setProperty("--y", `${e.clientY - r.top}px`);
    };
    const click = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("a,button")) return;
      const r = el.getBoundingClientRect();
      const p = { id: Date.now(), x: e.clientX - r.left, y: e.clientY - r.top };
      setPings((ps) => [...ps.slice(-4), p]);
      setTimeout(() => setPings((ps) => ps.filter((q) => q.id !== p.id)), 1600);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", click);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerdown", click);
    };
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 [--x:70%] [--y:30%]"
      style={{ background: "radial-gradient(420px circle at var(--x) var(--y), rgba(16,91,255,.20), transparent 60%)" }}
    >
      {pings.map((p) => (
        <span key={p.id} className="sonar-ping" style={{ left: p.x, top: p.y }} />
      ))}
    </div>
  );
}

/** Word-by-word rise for big display headlines. */
export function Headline({ lines, className = "" }: { lines: { text: string; accent?: boolean }[][]; className?: string }) {
  let i = 0;
  return (
    <h1 className={className}>
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.map((w, wi) => {
            const d = i++ * 70;
            return (
              <span key={wi} className="inline-block overflow-hidden pb-[0.06em] align-bottom">
                <span className={`word-rise inline-block ${w.accent ? "text-royal" : ""}`} style={{ animationDelay: `${d}ms` }}>
                  {w.text}
                </span>
                {wi < line.length - 1 && " "}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
