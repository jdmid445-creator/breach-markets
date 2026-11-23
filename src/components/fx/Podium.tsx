"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Avatar } from "@/components/Avatar";
import { Verified } from "@/components/desk/ui";
import { Tilt, Counter, EASE } from "./motion";

type P = { address: string; name: string; image: string; verified?: boolean; value: number; sub: string };

/** The top three, as tilting cards with their figure counting up. */
export function Podium({ rows, signed = false, label }: { rows: P[]; signed?: boolean; label: string }) {
  const reduce = useReducedMotion();
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  return (
    <>
    <div className="grid gap-4 md:grid-cols-3">
      {rows.slice(0, 3).map((t, i) => (
        <motion.div
          key={t.address}
          initial={reduce ? false : { opacity: 0, y: 40, rotateX: -25 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.2 + i * 0.1 }}
          style={{ transformPerspective: 900 }}
        >
          <Tilt className={`h-full rounded-xl border ${i === 0 ? "border-stone/60 bg-reef/70" : "border-hair-2 bg-shoal/80"} backdrop-blur-sm`}>
            <Link href={`/trader/${t.address}`} className="relative block h-full overflow-hidden p-6">
              <span aria-hidden className="title pointer-events-none absolute -right-2 -top-6 select-none text-[150px] leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(141,187,224,.22)]">
                {i + 1}
              </span>
              <div className="relative flex items-center gap-3">
                <Avatar src={t.image} seed={t.address} name={t.name} size={i === 0 ? 56 : 48} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[18px] font-semibold text-fg">{t.name}</span>
                    {t.verified && <Verified />}
                  </div>
                  <div className="text-[13px] text-faint">{i === 0 ? `#1 in ${label}` : `#${i + 1}`}</div>
                </div>
              </div>
              <div className="relative mt-10">
                <div className={`text-[clamp(30px,3.2vw,44px)] font-semibold leading-none ${signed ? (t.value >= 0 ? "text-stone-hi" : "text-mist") : "text-fg"}`}>
                  <Counter value={t.value} sign={signed} />
                </div>
                <div className="mt-2 text-[13px] text-faint">{t.sub}</div>
                <div className="mt-5 h-[4px] overflow-hidden rounded-full bg-sea/70">
                  <motion.div
                    className="h-full rounded-full bg-stone-hi"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(4, (Math.abs(t.value) / max) * 100)}%` }}
                    transition={{ duration: 1.1, ease: EASE, delay: 0.4 + i * 0.1 }}
                  />
                </div>
              </div>
            </Link>
          </Tilt>
        </motion.div>
      ))}
    </div>
    </>
  );
}
