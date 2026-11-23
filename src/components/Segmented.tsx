"use client";
import Link from "next/link";
import { motion } from "motion/react";

/** Link-based segmented control with a sliding highlight pill. */
export function Segmented({
  id,
  items,
  size = "md",
  tone = "aqua",
}: {
  id: string;
  items: { href: string; label: string; active: boolean }[];
  size?: "sm" | "md";
  tone?: "aqua" | "bone";
}) {
  return (
    <div className="relative flex flex-wrap rounded-full border border-line bg-coal/70 p-1 backdrop-blur-md">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          scroll={false}
          className={`relative rounded-full ${size === "sm" ? "px-3 py-1 text-[12.5px]" : "px-4 py-1.5 text-[13.5px]"} transition-colors ${
            it.active ? "text-ink" : "text-mute hover:text-bone"
          }`}
        >
          {it.active && (
            <motion.span
              layoutId={`seg-${id}`}
              className={`absolute inset-0 rounded-full ${tone === "aqua" ? "bg-aqua shadow-[0_0_24px_rgba(116,255,237,.35)]" : "bg-bone"}`}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative font-medium">{it.label}</span>
        </Link>
      ))}
    </div>
  );
}
