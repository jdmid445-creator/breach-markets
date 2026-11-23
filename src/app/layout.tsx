import type { Metadata } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/ibm-plex-sans/300.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { StatusBar } from "@/components/term/StatusBar";
import { CommandPalette } from "@/components/term/CommandPalette";

export const metadata: Metadata = {
  metadataBase: new URL("https://breach-markets.vercel.app"),
  title: { default: "Breach — Polymarket whale tracker", template: "%s" },
  description:
    "See the whales before the market does. Live $10K+ Polymarket bets with trader ranks, leaderboards by category, sport and hour, and what the top wallets are holding.",
  applicationName: "Breach",
  keywords: ["Polymarket", "whale tracker", "prediction markets", "Polymarket leaderboard", "smart money"],
  openGraph: {
    type: "website",
    siteName: "Breach",
    title: "Breach — See the whales before the market does",
    description: "Live $10K+ Polymarket bets with trader ranks, leaderboards and smart-money consensus.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Breach — See the whales before the market does",
    description: "Live $10K+ Polymarket bets with trader ranks, leaderboards and smart-money consensus.",
  },
};

export const viewport = { themeColor: "#0a0f26" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Nav />
        <main>{children}</main>
        <StatusBar />
        <CommandPalette />
      </body>
    </html>
  );
}
