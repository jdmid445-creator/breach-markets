"use client";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

/** Every desk page surfaces: rises out of a blur. The homepage intro is left alone. */
export default function Template({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const reduce = useReducedMotion();
  if (path === "/" || reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
