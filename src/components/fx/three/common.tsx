"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas, type CanvasProps } from "@react-three/fiber";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

export const TAIL =
  "M28.6 50 C29 45 29.4 41.5 29.6 38.6 C23.5 38.2 15.6 34.8 10.5 24.2 C10.2 23.4 10.9 22.8 11.6 23.3 C17.8 27.4 25 28.8 30.4 30.2 C31.1 30.4 31.6 31 32 31.8 C32.4 31 32.9 30.4 33.6 30.2 C39 28.8 46.2 27.4 52.4 23.3 C53.1 22.8 53.8 23.4 53.5 24.2 C48.4 34.8 40.5 38.2 34.4 38.6 C34.6 41.5 35 45 35.4 50 Z";

/** The logo's whale tail as an extruded solid, base at y=0, about 1 unit tall. */
export function tailGeometry({ depth = 3.2, bevel = 1.2, center = false } = {}) {
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="${TAIL}"/></svg>`);
  const shapes = data.paths.flatMap((p) => p.toShapes());
  const g = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.75, bevelSegments: 4, curveSegments: 24 });
  g.scale(1 / 36, -1 / 36, 1 / 36);
  g.computeBoundingBox();
  const b = g.boundingBox!;
  g.translate(-(b.min.x + b.max.x) / 2, center ? -(b.min.y + b.max.y) / 2 : -b.min.y, -(b.min.z + b.max.z) / 2);
  g.computeVertexNormals();
  return g;
}

/** A canvas that only mounts once it's near the screen and only renders while it's on it. */
export function LazyCanvas({ className = "", style, children, ...props }: CanvasProps & { className?: string; style?: React.CSSProperties }) {
  const box = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [gl, setGl] = useState(true);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setGl(Boolean(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setGl(false);
    }
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting);
        if (e.isIntersecting) setMounted(true);
      },
      { rootMargin: "160px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={box} className={className} style={style}>
      {mounted && gl && (
        <Canvas frameloop={visible ? "always" : "never"} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true, localClippingEnabled: true }} style={{ touchAction: "pan-y" }} {...props}>
          {children}
        </Canvas>
      )}
    </div>
  );
}
