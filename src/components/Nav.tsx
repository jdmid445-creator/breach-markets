"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/live", label: "Live whales", live: true },
  { href: "/leaderboard", label: "Leaderboards" },
  { href: "/smart-money", label: "Smart money" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b hairline bg-ink/85 backdrop-blur-md">
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
