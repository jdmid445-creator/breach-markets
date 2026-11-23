import { bigTrades } from "@/lib/pm";
import { WhaleFeed } from "@/components/WhaleFeed";
import { PageHero } from "@/components/PageHero";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live whales — Breach" };

export default async function LivePage() {
  const initial = (await bigTrades(10_000, 100, 5)) ?? [];
  return (
    <>
      <PageHero
        kicker="Live feed"
        title="Whales surfacing"
        sub={
          <>
            Every Polymarket bet over $10K, the moment it lands. Bets over $250K get the{" "}
            <span className="rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tier-blue">Blue whale</span> tag.
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
