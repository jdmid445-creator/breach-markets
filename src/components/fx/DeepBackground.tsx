"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Shader, LinearGradient, Godrays, FloatingParticles, CursorRipples, FilmGrain } from "shaders/react";

/**
 * The water every desk page sits in: a depth gradient, light shafts from the
 * surface, drifting plankton the cursor stirs, and ripples wherever the cursor
 * moves. WebGPU; when the browser can't run it, the CSS gradient underneath
 * stays as the background.
 */
export function DeepBackground() {
  const path = usePathname();
  const [ok, setOk] = useState(true);
  const [reduce, setReduce] = useState(false);
  useEffect(() => setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  // On the homepage the intro film covers everything: don't spend the GPU until it's nearly over.
  const [awake, setAwake] = useState(false);
  useEffect(() => {
    const check = () => {
      const intro = document.getElementById("intro");
      if (!intro) return setAwake(true);
      setAwake(window.scrollY > intro.offsetTop + intro.offsetHeight - window.innerHeight * 1.5);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [path]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_30%_-10%,#0e3d6b_0%,#062a4e_35%,#03203d_70%,#021629_100%)]" />
      {ok && !reduce && awake && (
        <Shader key={path === "/" ? "home" : "desk"} className="absolute inset-0 h-full w-full" onUnavailable={() => setOk(false)} toneMapping="aces">
          <LinearGradient
            stops={[
              { color: "#0c3a66", position: 0 },
              { color: "#05284a", position: 0.4 },
              { color: "#03203d", position: 0.75 },
              { color: "#01121f", position: 1 },
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            colorSpace="oklab"
          />
          <Godrays center={{ x: 0.22, y: -0.08 }} density={0.22} intensity={0.32} spotty={0.4} speed={0.18} rayColor="#3f7fb0" />
          <FloatingParticles particleColor="#a8cbe8" shape="glow" count={900} particleSize={1.1} softness={0.6} speed={0.08} angle={95} twinkle={0.6} cursorStrength={0.35} />
          <CursorRipples intensity={6} decay={6} radius={0.35} chromaticSplit={0.4} />
          <FilmGrain strength={0.18} />
        </Shader>
      )}
    </div>
  );
}
