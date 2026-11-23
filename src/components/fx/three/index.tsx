"use client";
import dynamic from "next/dynamic";
import { LazyCanvas } from "./common";
import type { PodiumRow } from "./Podium3D";

const HeroTailScene = dynamic(() => import("./HeroTail"), { ssr: false });
const PodiumScene = dynamic(() => import("./Podium3D"), { ssr: false });
const MedalScene = dynamic(() => import("./Medal"), { ssr: false });

export function HeroTail3D({ className = "" }: { className?: string }) {
  return (
    <LazyCanvas className={className} camera={{ position: [0, 0, 7], fov: 35 }}>
      <HeroTailScene />
    </LazyCanvas>
  );
}

export function Podium3D({ rows, signed, labels = true, className = "" }: { rows: PodiumRow[]; signed?: boolean; labels?: boolean; className?: string }) {
  return (
    <LazyCanvas className={className} camera={{ position: [0, 2.6, labels ? 9 : 11], fov: 34 }}>
      <PodiumScene rows={rows} signed={signed} labels={labels} />
    </LazyCanvas>
  );
}

export function Medal3D({ rank, label, className = "" }: { rank: number | null; label: string; className?: string }) {
  return (
    <LazyCanvas className={className} camera={{ position: [0, 0, 5.2], fov: 35 }}>
      <MedalScene rank={rank} label={label} />
    </LazyCanvas>
  );
}
