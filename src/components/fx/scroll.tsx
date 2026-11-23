"use client";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useVelocity,
  useMotionValue,
  useAnimationFrame,
  useInView,
  useReducedMotion,
} from "motion/react";

/**
 * A huge section headline. The moment it enters the screen its words slide
 * in from alternating sides on their own clock (not tied to scroll speed),
 * so it plays the same way on a flick or a slow scroll.
 */
export function BigTitle({ text, hi = [], className = "", as = "h2" }: { text: string; hi?: string[]; className?: string; as?: "h1" | "h2" }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const Tag = motion[as];
  const words = text.split(" ");
  return (
    <Tag ref={ref} aria-label={text} data-whale-spot className={`mega ${className}`}>
      {words.map((w, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        return (
          <motion.span
            key={i}
            aria-hidden
            className={`mr-[0.22em] inline-block ${hi.includes(w.replace(/[^A-Za-z0-9$]/g, "")) ? "hi-word" : ""}`}
            initial={reduce ? false : { x: `${dir * 14}vw`, opacity: 0 }}
            animate={inView ? { x: "0vw", opacity: 1 } : undefined}
            transition={{ x: { type: "spring", stiffness: 90, damping: 18, mass: 0.9, delay: i * 0.06 }, opacity: { duration: 0.35, delay: i * 0.06 } }}
          >
            {w}
          </motion.span>
        );
      })}
    </Tag>
  );
}

/** Fades up into place as soon as it's on screen (no scaling: canvases inside must not change size). */
export function ScrollZoom({ children, className = "" }: { children: React.ReactNode; className?: string; from?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`overflow-hidden rounded-[18px] ${className}`}
      initial={reduce ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Drifts slower or faster than the page for depth. */
export function Parallax({ children, className = "", speed = 0.2 }: { children: React.ReactNode; className?: string; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 100}px`, `${-speed * 100}px`]);
  return (
    <motion.div ref={ref} className={className} style={reduce ? undefined : { y }}>
      {children}
    </motion.div>
  );
}

/**
 * A band of giant outlined words that runs sideways forever and speeds up,
 * or flips direction, with how fast you scroll.
 */
export function VelocityTape({ items, base = -2.4 }: { items: string[]; base?: number }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const vel = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const factor = useTransform(vel, [-2000, 0, 2000], [-6, 0, 6], { clamp: false });
  const dirRef = useRef(1);
  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const f = factor.get();
    if (f < 0) dirRef.current = -1;
    else if (f > 0) dirRef.current = 1;
    let v = x.get() + dirRef.current * base * (delta / 1000) * (1 + Math.abs(f));
    if (v < -50) v += 50;
    if (v > 0) v -= 50;
    x.set(v);
  });
  const tx = useTransform(x, (v) => `${v}%`);
  const row = (k: string) => (
    <span className="flex shrink-0 items-center" aria-hidden={k === "b"}>
      {items.map((t, i) => (
        <span key={`${k}${i}`} className="flex items-center">
          <span className={i % 2 ? "mega-outline" : "text-fg"}>{t}</span>
          <svg width="0.7em" height="0.7em" viewBox="0 0 64 64" className="mx-[0.35em] shrink-0" aria-hidden>
            <path
              transform="translate(0 -4.4)"
              fill="#eb2f33"
              d="M28.6 50 C29 45 29.4 41.5 29.6 38.6 C23.5 38.2 15.6 34.8 10.5 24.2 C10.2 23.4 10.9 22.8 11.6 23.3 C17.8 27.4 25 28.8 30.4 30.2 C31.1 30.4 31.6 31 32 31.8 C32.4 31 32.9 30.4 33.6 30.2 C39 28.8 46.2 27.4 52.4 23.3 C53.1 22.8 53.8 23.4 53.5 24.2 C48.4 34.8 40.5 38.2 34.4 38.6 C34.6 41.5 35 45 35.4 50 Z"
            />
          </svg>
        </span>
      ))}
    </span>
  );
  return (
    <div className="relative overflow-hidden py-6" aria-label={items.join(", ")}>
      <motion.div className="mega flex w-max whitespace-nowrap text-[clamp(56px,9vw,150px)]" style={{ x: tx }}>
        {row("a")}
        {row("b")}
      </motion.div>
    </div>
  );
}
