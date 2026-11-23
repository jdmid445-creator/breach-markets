"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

/** Footer styled as a terminal status line, with a live clock. */
export function StatusBar() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const f = () =>
      setNow(new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" }));
    f();
    const id = setInterval(f, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <footer className="t-mono mt-24 border-t border-t-line text-[12px] text-t-dim">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
        <span className="flex items-center gap-2 text-t-text">
          <span className="t-blink h-2 w-2 rounded-full bg-t-amber" /> Connected
        </span>
        <span suppressHydrationWarning>{now ?? "--:--:--"}</span>
        <span>Source: Polymarket Data API</span>
        <span className="hidden md:inline">Not financial advice</span>
        <span className="ml-auto flex gap-5">
          <Link href="/live" className="hover:text-t-text">Alerts</Link>
          <Link href="/leaderboard" className="hover:text-t-text">Leaderboards</Link>
          <Link href="/smart-money" className="hover:text-t-text">Smart money</Link>
        </span>
      </div>
    </footer>
  );
}
