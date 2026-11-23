"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "./Logo";

const LINKS = [
  { href: "/live", label: "Alerts", key: "A" },
  { href: "/leaderboard", label: "Leaderboards", key: "L" },
  { href: "/smart-money", label: "Smart money", key: "S" },
];

export function Nav() {
  const path = usePathname();
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
      data-shown={shown ? "true" : "false"}
      className={`${ready ? "nav-ready " : ""}fixed inset-x-0 top-0 z-40 border-b border-t-line bg-t-bg transition-[transform,opacity] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-6 px-5">
        <Link href="/" aria-label="Breach home" className="flex items-center gap-2.5">
          <LogoMark size={26} />
          <span className="t-head text-[17px] tracking-[0.06em] text-t-text">Breach</span>
        </Link>
        <span className="t-mono hidden text-[11.5px] text-t-dim md:inline">Polymarket whale desk</span>
        <nav className="ml-auto flex items-center text-[13.5px]">
          {LINKS.map((l) => {
            const on = path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`group flex h-14 items-center gap-2 border-l border-t-line px-4 transition-colors ${on ? "bg-t-olive text-t-text" : "text-t-dim hover:text-t-text"}`}
              >
                <kbd className={`t-mono hidden rounded-[3px] border px-1 text-[10.5px] leading-[16px] sm:inline ${on ? "border-t-amber text-t-amber" : "border-t-line text-t-dim group-hover:border-t-dim"}`}>
                  {l.key}
                </kbd>
                {l.label}
              </Link>
            );
          })}
          <button
            onClick={() => window.dispatchEvent(new Event("breach:palette"))}
            className="t-mono flex h-14 items-center gap-2 border-x border-t-line px-4 text-[12px] text-t-dim hover:text-t-text"
            aria-label="Search traders"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="hidden lg:inline">Search traders</span>
            <kbd className="rounded-[3px] border border-t-line px-1 text-[10.5px] leading-[16px]">⌘K</kbd>
          </button>
        </nav>
      </div>
    </header>
  );
}
