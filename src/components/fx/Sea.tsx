"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Trade } from "@/lib/pm";
import { Soundings } from "@/components/desk/Soundings";

const WhaleSea = dynamic(() => import("./WhaleSea"), { ssr: false, loading: () => null });

/** 3D whale sea where WebGL works; the 2D sounding chart where it doesn't. */
export function Sea({ trades, fresh, height = 520, plain = false }: { trades: Trade[]; fresh?: Set<string>; height?: number; plain?: boolean }) {
  const [gl, setGl] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setGl(Boolean(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setGl(false);
    }
  }, []);
  if (gl === false || plain) return <Soundings trades={trades} fresh={fresh} height={height} plain={plain} />;
  if (gl === null) return <div style={{ height }} />;
  return <WhaleSea trades={trades} fresh={fresh} height={height} />;
}
