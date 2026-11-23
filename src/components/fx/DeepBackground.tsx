"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Shader, LinearGradient, ContourLines, SimplexNoise, FilmGrain } from "shaders/react";

/**
 * The page sits on a nautical chart: depth soundings drawn as contour lines
 * over a slowly shifting seabed. It replaces the light-rays-and-plankton look.
 *
 * Phones render the shader at fewer pixels and scale it up (the
 * contours are soft, so it holds up), which keeps scrolling smooth next to the
 * WebGL scenes.
 */
export function DeepBackground() {
  const path = usePathname();
  const [ok, setOk] = useState(true);
  const [reduce, setReduce] = useState(false);
  const [small, setSmall] = useState(false);
  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setSmall(window.matchMedia("(max-width: 767px), (pointer: coarse)").matches);
  }, []);
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

  const scale = small ? 0.8 : 1;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_30%_-10%,#0b355f_0%,#062a4e_38%,#03203d_72%,#021629_100%)]" />
      {ok && !reduce && awake && (
        <Shader
          key={path === "/" ? "home" : "desk"}
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: `${100 * scale}%`, height: `${100 * scale}%`, transform: `scale(${1 / scale})` }}
          onUnavailable={() => setOk(false)}
          toneMapping="aces"
        >
          <LinearGradient
            stops={[
              { color: "#0b355f", position: 0 },
              { color: "#05284a", position: 0.45 },
              { color: "#03203d", position: 0.8 },
              { color: "#021629", position: 1 },
            ]}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.6, y: 1 }}
            colorSpace="oklab"
          />
          <ContourLines levels={9} lineWidth={1} softness={0.7} gamma={0.9} colorMode="custom" lineColor="#639cc5" backgroundColor="transparent" opacity={small ? 0.06 : 0.08}>
            <SimplexNoise colorA="#ffffff" colorB="#000000" scale={3.8} contrast={-0.6} seed={11} speed={0.04} />
          </ContourLines>
          <FilmGrain strength={0.035} />
        </Shader>
      )}
    </div>
  );
}
