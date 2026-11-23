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
        title="Big money, named and ranked"
        sub={
          <>
            Every bet over your threshold, the second it lands. Traders on the profit leaderboards show up{" "}
            <b className="text-bone">bold with their rank</b>, and the top 10 glow{" "}
            <span className="rounded bg-pink px-1.5 py-0.5 text-[11px] font-bold text-ink">#pink</span>. Turn on alerts to get a
            browser notification when a ranked whale moves.
          </>
        }
        compact
      />
      <div className="mx-auto max-w-[1240px] px-5">
        <WhaleFeed initial={initial} pool />
      </div>
    </>
  );
}
