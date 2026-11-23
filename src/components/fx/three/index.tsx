"use client";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { usd } from "@/lib/format";
import { LazyCanvas } from "./common";
import type { PodiumRow } from "./Podium3D";

const HeroTailScene = dynamic(() => import("./HeroTail"), { ssr: false });
const PodiumScene = dynamic(() => import("./Podium3D"), { ssr: false });
const MedalScene = dynamic(() => import("./Medal"), { ssr: false });

export function HeroTail3D({ className = "" }: { className?: string }) {
  return (
    <LazyCanvas className={className} camera={{ position: [0, 0.6, 6.5], fov: 35 }}>
      <HeroTailScene />
    </LazyCanvas>
  );
}

/**
 * Name tags live in plain DOM over the canvas (not drei <Html>, which tears
 * down badly when the canvas unmounts); the scene moves them every frame so
 * they ride with their buoy.
 */
export function Podium3D({ rows, signed, labels = true, className = "" }: { rows: PodiumRow[]; signed?: boolean; labels?: boolean; className?: string }) {
  const tags = useRef<(HTMLDivElement | null)[]>([]);
  return (
    <div className={`relative ${className}`}>
      <LazyCanvas className="absolute inset-0" camera={{ position: [0, 2.6, labels ? 9 : 11], fov: 34 }}>
        <PodiumScene rows={rows} signed={signed} tags={labels ? tags : undefined} />
      </LazyCanvas>
      {labels &&
        rows.slice(0, 3).map((r, i) => (
          <div
            key={i}
            ref={(el) => {
              tags.current[i] = el;
            }}
            className="pointer-events-none absolute left-0 top-0 w-[190px] text-center opacity-0 will-change-transform"
          >
            <div className="truncate text-[15px] font-semibold text-fg">{r.name}</div>
            <div className={`fig text-[22px] font-semibold leading-tight ${signed ? (r.value >= 0 ? "text-stone-hi" : "text-mist") : "text-fg"}`}>{usd(r.value, { sign: signed })}</div>
            <div className="text-[12px] text-faint">{r.sub}</div>
          </div>
        ))}
    </div>
  );
}

export function Medal3D({ rank, label, className = "" }: { rank: number | null; label: string; className?: string }) {
  return (
    <LazyCanvas className={className} camera={{ position: [0, 0, 5.2], fov: 35 }}>
      <MedalScene rank={rank} label={label} />
    </LazyCanvas>
  );
}
