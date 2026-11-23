"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

type Item = { href: string; label: string; active: boolean };

/** Underline tabs for the main switch on a page (category). Scrolls sideways on small screens. */
export function Tabs({ id, items, label }: { id: string; items: Item[]; label: string }) {
  const reduce = useReducedMotion();
  return (
    <nav aria-label={label} className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <ul className="flex min-w-max gap-1 border-b border-hair">
        {items.map((it) => (
          <li key={it.href} className="relative">
            <Link
              href={it.href}
              scroll={false}
              aria-current={it.active ? "page" : undefined}
              className={`press block px-3 pb-3 pt-1 text-[14px] ${it.active ? "font-semibold text-fg" : "text-mist hover:text-fg"}`}
            >
              {it.label}
            </Link>
            {it.active && (
              <motion.span
                layoutId={`tab-${id}`}
                className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-stone-hi"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 45 }}
              />
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Segmented control for secondary switches (window, sort). */
export function Segmented({ id, items, label }: { id: string; items: Item[]; label: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[13px] text-faint">{label}</span>
      <div role="group" aria-label={label} className="flex rounded-lg border border-hair bg-shoal p-0.5">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            scroll={false}
            aria-current={it.active ? "true" : undefined}
            className={`press relative rounded-md px-3 py-1.5 text-[13px] ${it.active ? "font-semibold text-sea" : "text-mist hover:text-fg"}`}
          >
            {it.active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-md bg-stone-hi"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 45 }}
              />
            )}
            <span className="relative">{it.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
