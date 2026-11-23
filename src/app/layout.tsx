import type { Metadata } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { Nav } from "@/components/Nav";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Breach — Polymarket whale tracker",
  description: "See the whales before the market does. Live $10K+ Polymarket bets, leaderboards by category and sport, and what the smartest wallets are holding.",
  openGraph: { title: "Breach", description: "See the whales before the market does." },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Nav />
        <main>{children}</main>
        <footer className="mt-24 border-t hairline">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-5 py-8 text-[13px] text-mute sm:flex-row sm:justify-between">
            <span>Breach reads public Polymarket data. Not financial advice.</span>
            <span className="flex gap-4">
              <Link href="/live" className="hover:text-bone">Live</Link>
              <Link href="/leaderboard" className="hover:text-bone">Leaderboards</Link>
              <Link href="/smart-money" className="hover:text-bone">Smart money</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
