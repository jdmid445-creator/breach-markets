"use client";
import Link from "next/link";
import { motion } from "motion/react";

/** Terminal tab strip: links in a hairline frame, an amber block slides to the active one. */
export function Segmented({
  id,
  items,
  label,
}: {
  id: string;
  items: { href: string; label: string; active: boolean }[];
  size?: "sm" | "md";
  tone?: string;
  label?: string;
}) {
  return (
    <div className="t-mono flex flex-wrap items-stretch border border-t-line bg-t-panel text-[12.5px]">
      {label && <span className="flex items-center border-r border-t-line px-3 text-[11px] text-t-dim">{label}</span>}
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          scroll={false}
          className={`relative px-3 py-2 transition-colors active:translate-y-px ${it.active ? "text-t-bg" : "text-t-dim hover:bg-t-olive hover:text-t-text"}`}
        >
          {it.active && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 bg-t-amber" transition={{ type: "spring", stiffness: 520, damping: 38 }} />}
          <span className="relative">{it.label}</span>
        </Link>
      ))}
    </div>
  );
}
