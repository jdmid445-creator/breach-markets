"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring, useTransform, useMotionValueEvent, useReducedMotion } from "motion/react";
import { INTRO } from "@/lib/media";
import { Particles } from "./Particles";

/**
 * Cinematic, scroll-driven intro.
 * 0.00–0.62  the dive: underwater clip plays while the story lines scroll by
 * 0.55–1.00  the breach: the second clip plays, BREACH lands over the splash
 */
export function ScrollIntro() {
  const wrap = useRef<HTMLDivElement>(null);
  const dive = useRef<HTMLVideoElement>(null);
  const breach = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);

  const { scrollYProgress: raw } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  // Smooth out stepped mouse-wheel input so text and fades glide
  const p = useSpring(raw, { stiffness: 140, damping: 32, mass: 0.35, restDelta: 0.0005 });

  // Clips play on their own (smooth on any connection); scroll only drives
  // the text, the crossfade and the reveal. Remote MP4s can't be scrubbed
  // frame-by-frame without stutter, so we don't tie currentTime to scroll.
  //
  // Phones (iOS in-app browsers especially) can refuse play() until the page
  // has had a touch, and a rejected play() used to leave the clip frozen and
  // rewound on every scroll tick. Now: rewind only when crossing into the
  // breach, keep retrying play() while it's on screen, and unlock both clips
  // on the first touch or scroll.
  const past = useRef(false);
  const kick = (v: HTMLVideoElement | null) => {
    if (v && v.paused) v.play().catch(() => {});
  };
  useEffect(() => {
    const unlock = () => {
      kick(dive.current);
      const b = breach.current;
      if (b && b.paused) b.play().then(() => { if (!past.current) b.pause(); }).catch(() => {});
    };
    window.addEventListener("touchstart", unlock, { passive: true, once: true });
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => {
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("pointerdown", unlock);
    };
  }, []);
  useMotionValueEvent(p, "change", (v) => {
    const d = dive.current;
    const b = breach.current;
    if (d) {
      if (v < 0.66) kick(d);
      else if (!d.paused) d.pause();
    }
    if (b) {
      if (v > 0.5) {
        if (!past.current) {
          past.current = true;
          b.currentTime = 0;
        }
        kick(b);
      } else if (v < 0.45) {
        past.current = false;
        if (!b.paused) b.pause();
      }
    }
  });

  const diveOpacity = useTransform(p, [0, 0.55, 0.64], [1, 1, 0]);
  const breachOpacity = useTransform(p, [0.52, 0.62], [0, 1]);
  const line1 = useTransform(p, [0.02, 0.08, 0.18, 0.24], [0, 1, 1, 0]);
  const line2 = useTransform(p, [0.24, 0.3, 0.4, 0.46], [0, 1, 1, 0]);
  const line3 = useTransform(p, [0.44, 0.5, 0.56, 0.6], [0, 1, 1, 0]);
  const y1 = useTransform(p, [0.02, 0.24], [40, -40]);
  const y2 = useTransform(p, [0.24, 0.46], [40, -40]);
  const y3 = useTransform(p, [0.44, 0.6], [40, -40]);
  const word = useTransform(p, [0.6, 0.78], [0, 1]);
  const wordScale = useTransform(p, [0.6, 0.8], [1.35, 1]);
  const wordBlur = useTransform(p, [0.6, 0.78], ["blur(24px)", "blur(0px)"]);
  const tracking = useTransform(p, [0.6, 0.85], ["0.6em", "0.02em"]);
  const tail = useTransform(p, [0.8, 0.9], [0, 1]);
  const tailY = useTransform(p, [0.8, 0.92], [30, 0]);
  const hint = useTransform(p, [0, 0.04], [1, 0]);

  return (
    <section id="intro" ref={wrap} className="relative" style={{ height: reduce ? "100vh" : "460vh" }} aria-label="Breach intro">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-ink">
        {/* clips */}
        <motion.video
          ref={dive}
          src={INTRO.dive}
          muted
          playsInline
          autoPlay
          loop
          preload="auto"
          onCanPlay={() => setReady(true)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: reduce ? 0 : diveOpacity }}
        />
        <motion.video
          ref={breach}
          src={INTRO.breach}
          muted
          playsInline
          loop
          preload="auto"
          autoPlay={!!reduce}
          onLoadedData={() => {
            if (past.current) kick(breach.current);
          }}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: reduce ? 1 : breachOpacity }}
        />
        <Particles density={60} className="opacity-70" />
        {/* grade + vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(10,15,38,.85)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ink to-transparent" />
        <div className={`pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,#1a2250,#0a0f26)] transition-opacity duration-1000 ${ready ? "opacity-0" : "opacity-100"}`} />

        {/* narrative lines during the dive */}
        {!reduce && (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <motion.p style={{ opacity: line1, y: y1 }} className="display absolute text-[clamp(32px,6vw,88px)]">
              Every bet leaves a <b className="text-aqua">wake</b>
            </motion.p>
            <motion.p style={{ opacity: line2, y: y2 }} className="display absolute text-[clamp(32px,6vw,88px)]">
              Most are <b>ripples</b>
            </motion.p>
            <motion.p style={{ opacity: line3, y: y3 }} className="display absolute text-[clamp(32px,6vw,88px)]">
              Some are <b className="text-aqua">whales</b>
            </motion.p>
          </div>
        )}

        {/* the reveal */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <motion.h1
            style={reduce ? {} : { opacity: word, scale: wordScale, filter: wordBlur, letterSpacing: tracking }}
            className="display text-[clamp(64px,14.5vw,230px)] font-[200] text-bone"
          >
            Breach
          </motion.h1>
          <motion.div style={reduce ? {} : { opacity: tail, y: tailY }} className="mt-4 flex flex-col items-center">
            <p className="max-w-[560px] text-[17px] leading-relaxed text-bone/80">
              See the whales before the market does. Every $10K+ Polymarket bet, the sharpest traders by sport and hour, and what they’re holding now.
            </p>
            <Link
              href="/live"
              className="mt-9 inline-flex items-center gap-3 rounded-full bg-aqua px-7 py-3.5 text-[15px] font-semibold text-ink transition-transform hover:-translate-y-0.5"
            >
              Open whale alerts <span aria-hidden>→</span>
            </Link>
          </motion.div>
        </div>

        {/* scroll hint */}
        {!reduce && (
          <motion.div style={{ opacity: hint }} className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-bone/70">
            Scroll to dive
            <span className="block h-10 w-px overflow-hidden bg-bone/20">
              <span className="block h-4 w-px animate-[dive_1.6s_ease-in-out_infinite] bg-aqua" />
            </span>
          </motion.div>
        )}
      </div>
    </section>
  );
}
