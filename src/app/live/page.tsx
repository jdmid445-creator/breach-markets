import { bigTrades } from "@/lib/pm";
import { LiveDesk } from "@/components/desk/Whales";
import { PageHeader } from "@/components/desk/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Whale alerts — Breach" };

export default async function LivePage() {
  const initial = (await bigTrades(10_000, 120, 5)) ?? [];
  return (
    <>
      <PageHeader
        title="Whale alerts"
        sub="Every Polymarket bet over your minimum, seconds after it fills. Traders on the profit leaderboards show their rank in bold; the top 10 are marked in red. Turn on notifications to hear when a ranked whale moves."
      />
      <LiveDesk initial={initial} />
    </>
  );
}
