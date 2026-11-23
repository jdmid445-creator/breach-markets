import { bigTrades } from "@/lib/pm";
import { WhaleFeed } from "@/components/WhaleFeed";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live whales — Breach" };

export default async function LivePage() {
  const initial = (await bigTrades(10_000, 100, 5)) ?? [];
  return (
    <div className="mx-auto max-w-[1000px] px-5 pt-12">
      <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-royal-soft">Live feed</p>
      <h1 className="display mt-3 text-[clamp(48px,8vw,92px)]">Whales surfacing</h1>
      <p className="mt-4 max-w-[560px] text-[16px] leading-relaxed text-mute">
        Every Polymarket bet over $10K, as it lands. Filter by market, side, and size. Bets over $250K get flagged{" "}
        <span className="rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tier-blue">Blue whale</span>.
      </p>
      <div className="mt-10">
        <WhaleFeed initial={initial} pool />
      </div>
    </div>
  );
}
