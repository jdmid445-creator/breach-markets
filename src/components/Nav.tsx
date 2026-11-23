"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/live", label: "Live whales", live: true },
  { href: "/leaderboard", label: "Leaderboards" },
  { href: "/smart-money", label: "Smart money" },
];

export function Nav() {
  const path = usePathname();
  const home = path === "/";
  // On the homepage the nav stays hidden until the intro has fully played out
  const [shown, setShown] = useState(!home);
  useEffect(() => {
    if (!home) return setShown(true);
    const check = () => {
      const intro = document.getElementById("intro");
      const end = intro ? intro.offsetTop + intro.offsetHeight - window.innerHeight * 0.6 : 0;
      setShown(window.scrollY > end);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [home]);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b hairline bg-ink/85 backdrop-blur-md transition-[transform,opacity] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5">
        <Link href="/" aria-label="Breach home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-[14px]">
          {LINKS.map((l) => {
            const on = path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 transition-colors ${
                  on ? "bg-charcoal text-bone" : "text-mute hover:text-bone"
                }`}
              >
                {l.live && <span className="live-dot" />}
                <span className="hidden sm:inline">{l.label}</span>
                <span className="sm:hidden">{l.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
