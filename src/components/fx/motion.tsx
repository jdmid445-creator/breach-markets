"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform, animate, useReducedMotion, type MotionValue } from "motion/react";
import { usd } from "@/lib/format";

const EASE = [0.23, 1, 0.32, 1] as const;

/** Headline that rises in word by word out of a blur, once, when it scrolls into view. */
export function SplitTitle({ text, className = "", as = "h2", delay = 0, hiLast = false }: { text: string; className?: string; as?: "h1" | "h2" | "h3"; delay?: number; hiLast?: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const Tag = motion[as];
  const words = text.split(" ");
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className={`inline-block ${hiLast && i === words.length - 1 && words.length > 1 ? "text-stone-hi" : ""}`}
            initial={reduce ? false : { y: "105%", rotate: 4, filter: "blur(6px)" }}
            animate={inView ? { y: "0%", rotate: 0, filter: "blur(0px)" } : undefined}
            transition={{ duration: 0.8, ease: EASE, delay: delay + i * 0.07 }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Fade, rise and un-blur into view. */
export function Reveal({ children, className = "", delay = 0, y = 28 }: { children: React.ReactNode; className?: string; delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.75, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** A number that counts to its value when it appears, and glides when the value changes. */
export function Counter({ value, format = "usd", sign = false, className = "" }: { value: number; format?: "usd" | "int" | "pct"; sign?: boolean; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const [text, setText] = useState(fmt(0));
  function fmt(n: number) {
    if (format === "int") return Math.round(n).toLocaleString("en-US");
    if (format === "pct") return `${Math.round(n)}%`;
    return usd(n, { sign });
  }
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, { duration: 1.3, ease: EASE });
    return () => c.stop();
  }, [inView, value, mv]);
  useEffect(() => mv.on("change", (v) => setText(fmt(v))), [mv]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span ref={ref} className={`fig ${className}`} suppressHydrationWarning>
      {text}
    </span>
  );
}

/** Card that tilts toward the cursor with a light that follows it. */
export function Tilt({ children, className = "", max = 9 }: { children: React.ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 220, damping: 22 });
  const sy = useSpring(my, { stiffness: 220, damping: 22 });
  const rx = useTransform(sy, [0, 1], [max, -max]);
  const ry = useTransform(sx, [0, 1], [-max, max]);
  const light = useLight(sx, sy);
  return (
    <motion.div
      className={`relative [transform-style:preserve-3d] ${className}`}
      style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
      <motion.span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: light }} />
    </motion.div>
  );
}
function useLight(x: MotionValue<number>, y: MotionValue<number>) {
  return useTransform([x, y], ([a, b]) => `radial-gradient(420px circle at ${(a as number) * 100}% ${(b as number) * 100}%, rgba(141,187,224,.16), transparent 60%)`);
}

/** Pulls toward the cursor a little, springs back when it leaves. */
export function Magnetic({ children, className = "", strength = 0.3 }: { children: React.ReactNode; className?: string; strength?: number }) {
  const x = useSpring(0, { stiffness: 300, damping: 18 });
  const y = useSpring(0, { stiffness: 300, damping: 18 });
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`inline-block ${className}`}
      style={reduce ? undefined : { x, y }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export { EASE };

/** Table row that slides in once as it scrolls into view. */
export function RevealRow({ children, className = "", i = 0 }: { children: React.ReactNode; className?: string; i?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.tr
      className={className}
      initial={reduce ? false : { opacity: 0, x: -20, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -5% 0px" }}
      transition={{ duration: 0.5, ease: EASE, delay: Math.min(i, 12) * 0.04 }}
    >
      {children}
    </motion.tr>
  );
}
