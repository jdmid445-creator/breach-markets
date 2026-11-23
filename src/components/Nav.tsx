"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Search } from "lucide-react";
import { LogoMark } from "./Logo";

const LINKS = [
  { href: "/live", label: "Alerts" },
  { href: "/leaderboard", label: "Leaderboards" },
  { href: "/smart-money", label: "Smart money" },
];

export function Nav() {
  const path = usePathname();
  const reduce = useReducedMotion();
  // Hidden while the homepage intro plays; slides in once it has played out.
  const [shown, setShown] = useState(true);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const check = () => {
      const intro = document.getElementById("intro");
      setReady(true);
      if (!intro) return setShown(true);
      const end = intro.offsetTop + intro.offsetHeight - window.innerHeight * 0.6;
      setShown(window.scrollY > end);
    };
    check();
    const t = setTimeout(check, 50);
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [path]);

  return (
    <header
      data-nav
      className={`${ready ? "nav-ready " : ""}fixed inset-x-0 top-0 z-40 border-b border-hair bg-sea/90 backdrop-blur-md transition-[transform,opacity] duration-300 ease-[var(--ease-out)] ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex h-[60px] max-w-[1360px] items-center gap-6 px-5 md:px-8">
        <Link href="/" aria-label="Breach home" className="press flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="title text-[18px] tracking-[-0.01em] text-fg">Breach</span>
        </Link>
        <nav aria-label="Main" className="flex h-full items-stretch max-sm:hidden">
          {LINKS.map((l) => {
            const on = path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} aria-current={on ? "page" : undefined} className={`press relative flex items-center px-3 text-[14px] ${on ? "font-semibold text-fg" : "text-mist hover:text-fg"}`}>
                {l.label}
                {on && (
                  <motion.span
                    layoutId="nav-on"
                    className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-stone-hi"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 45 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => window.dispatchEvent(new Event("breach:palette"))}
          className="press ml-auto flex h-9 items-center gap-2.5 rounded-lg border border-hair bg-shoal pl-3 pr-2 text-[13.5px] text-faint hover:border-hair-2 hover:text-mist sm:w-[240px]"
          aria-label="Search traders"
        >
          <Search size={15} />
          <span className="max-sm:hidden">Search traders</span>
          <kbd className="ml-auto rounded border border-hair px-1.5 text-[11.5px] text-faint max-sm:hidden">⌘K</kbd>
        </button>
      </div>
      {/* small screens: the three destinations as a second row */}
      <nav aria-label="Main" className="flex border-t border-hair sm:hidden">
        {LINKS.map((l) => {
          const on = path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className={`flex-1 py-2.5 text-center text-[13.5px] ${on ? "font-semibold text-fg" : "text-mist"}`}>
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
