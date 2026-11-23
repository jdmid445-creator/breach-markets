"use client";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Canvas } from "@react-three/fiber";

const Hero = dynamic(() => import("@/components/fx/three/HeroTail"), { ssr: false });
const Podium = dynamic(() => import("@/components/fx/three/Podium3D"), { ssr: false });
const Medal = dynamic(() => import("@/components/fx/three/Medal"), { ssr: false });

/** Dev-only turntable for the 3D pieces (not linked anywhere). */
function Lab() {
  if (process.env.NEXT_PUBLIC_BREACH_LAB !== "1") notFound();
  const q = useSearchParams();
  const what = q.get("m") ?? "hero";
  const yaw = Number(q.get("yaw") ?? 0);
  const t = Number(q.get("t") ?? 4);
  return (
    <div className="grid h-screen place-items-center">
      <div style={{ width: 700, height: 700 }}>
        <Canvas camera={{ position: what === "podium" ? [0, 2.6, 9] : [0, 0.6, 6.5], fov: 35 }} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true, localClippingEnabled: true }}>
          {what === "hero" && <Hero freeze={t} yaw={yaw} />}
          {what === "podium" && <Podium rows={[{ address: "0x1", name: "Theo4", value: 900000, sub: "profit today" }, { address: "0x2", name: "Fredi9999", value: 449700, sub: "profit today" }, { address: "0x3", name: "RepTrump", value: 299400, sub: "profit today" }]} signed />}
          {what === "medal" && <Medal rank={7} label="30-day profit" />}
        </Canvas>
      </div>
    </div>
  );
}
export default function LabPage() {
  return (
    <Suspense>
      <Lab />
    </Suspense>
  );
}
