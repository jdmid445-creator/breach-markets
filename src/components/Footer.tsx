import Link from "next/link";
import { LogoMark } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-hair">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-x-8 gap-y-3 px-5 py-6 text-[13px] text-faint md:px-8">
        <span className="flex items-center gap-2 text-mist">
          <LogoMark size={20} /> Breach
        </span>
        <span>Data from Polymarket’s public API. Not financial advice.</span>
        <nav aria-label="Footer" className="ml-auto flex gap-6">
          <Link href="/live" className="hover:text-fg">Alerts</Link>
          <Link href="/leaderboard" className="hover:text-fg">Leaderboards</Link>
          <Link href="/smart-money" className="hover:text-fg">Smart money</Link>
        </nav>
      </div>
    </footer>
  );
}
