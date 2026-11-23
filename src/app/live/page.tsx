import { bigTrades } from "@/lib/pm";
import { WhaleFeed } from "@/components/WhaleFeed";
import { PageHero } from "@/components/PageHero";

export const dynamic = "force-dynamic";
export const metadata = { title: "Whale alerts — Breach" };

export default async function LivePage() {
  const initial = (await bigTrades(10_000, 100, 5)) ?? [];
  return (
    <>
      <PageHero
        kicker="Whale alerts"
        title="Whale alerts"
        sub={
          <>
            Every bet over your threshold, the second it lands. Traders on the profit leaderboards are <b className="text-t-text">bold with their rank</b>; the top 10 carry an amber rail. Turn on alerts for a browser notification when a ranked whale moves.
          </>
        }
        compact
      />
      <div className="mx-auto max-w-[1440px] px-5 pt-8">
        <WhaleFeed initial={initial} radar />
      </div>
    </>
  );
}
