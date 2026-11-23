import { CATEGORIES, leaderboard, tradesSince, flowBoard, type Period, type SortBy } from "@/lib/pm";
import { SPORTS } from "@/lib/sports";
import { TraderTable, FlowTable } from "@/components/desk/Boards";
import { PageHeader } from "@/components/desk/ui";
import { Tabs, Segmented } from "@/components/desk/Tabs";
import { Podium } from "@/components/fx/Podium";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leaderboards — Breach" };

const WINDOWS = [
  { id: "hour", label: "1H", long: "the last hour" },
  { id: "day", label: "24H", long: "the last 24 hours" },
  { id: "week", label: "7D", long: "the last 7 days" },
  { id: "month", label: "30D", long: "the last 30 days" },
  { id: "all", label: "All time", long: "all time" },
] as const;
type Win = (typeof WINDOWS)[number]["id"];
type SP = Promise<Record<string, string | undefined>>;

export default async function LeaderboardPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const cat = CATEGORIES.some((c) => c.id === sp.cat) ? sp.cat! : "overall";
  const win: Win = (WINDOWS.find((w) => w.id === sp.w)?.id ?? "day") as Win;
  const sort: SortBy = sp.sort === "VOLUME" ? "VOLUME" : "PNL";
  const sport = cat === "sports" ? SPORTS.find((s) => s.id === sp.sport)?.id : undefined;

  const href = (patch: Record<string, string | undefined>) => {
    const next = { cat, w: win, sort, sport, ...patch };
    const qs = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => v && qs.set(k, v));
    return `/leaderboard?${qs}`;
  };

  // Flow mode: 1H or a single sport. Polymarket only ranks profit for day/week/month/all
  // and one combined sports bucket, so these cuts rank who moved the most money instead.
  const flowMode = win === "hour" || Boolean(sport);
  const winInfo = WINDOWS.find((w) => w.id === win)!;
  const scope = sport ? SPORTS.find((s) => s.id === sport)!.label : CATEGORIES.find((c) => c.id === cat)!.label;
  let board: React.ReactNode;
  let note: string;

  if (flowMode) {
    const span = win === "hour" ? 3600 : win === "day" ? 86400 : win === "week" ? 7 * 86400 : 30 * 86400;
    const since = Math.floor(Date.now() / 1000) - span;
    const trades = await tradesSince(1000, since, win === "hour" ? 3 : 6);
    const filtered = trades.filter((t) =>
      sport ? t.bucket === sport : cat === "overall" ? true : cat === "sports" ? SPORTS.some((s) => s.id === t.bucket) : t.bucket === cat,
    );
    const flow = flowBoard(filtered).slice(0, 100);
    board = (
      <>
        {flow.length >= 3 && (
          <div className="mb-8">
            <Podium
              label={scope}
              rows={flow.slice(0, 3).map((r) => ({ address: r.address, name: r.name, image: r.image, value: r.bought + r.sold, sub: `moved in ${r.trades} ${r.trades === 1 ? "bet" : "bets"}` }))}
            />
          </div>
        )}
        <div className="overflow-x-auto">
          <FlowTable rows={flow.length >= 3 ? flow.slice(3) : flow} offset={flow.length >= 3 ? 3 : 0} />
        </div>
      </>
    );
    note = `Who moved the most money in $1K+ bets over ${winInfo.long}. Polymarket doesn’t publish profit for this cut, so this shows who’s acting, not yet who’s right.`;
  } else {
    const rows = (await leaderboard({ period: win as Period, category: cat, sort, limit: 100 })) ?? [];
    board = (
      <>
        {rows.length >= 3 && (
          <div className="mb-8">
            <Podium
              label={scope}
              signed={sort === "PNL"}
              rows={rows.slice(0, 3).map((t) => ({ address: t.address, name: t.name, image: t.image, verified: t.verified, value: sort === "PNL" ? t.pnl : t.volume, sub: sort === "PNL" ? `profit, ${winInfo.long}` : `volume, ${winInfo.long}` }))}
            />
          </div>
        )}
        <div className="overflow-x-auto">
          <TraderTable rows={rows} sort={sort} skip={rows.length >= 3 ? 3 : 0} sortHrefs={{ PNL: href({ sort: "PNL" }), VOLUME: href({ sort: "VOLUME" }) }} />
        </div>
      </>
    );
    note = `The top 100 by ${sort === "PNL" ? "profit" : "volume"} over ${winInfo.long}, straight from Polymarket.`;
  }

  return (
    <>
      <PageHeader title={`${scope} leaderboard`} sub={note}>
        <Tabs id="cat" label="Market" items={CATEGORIES.map((c) => ({ href: href({ cat: c.id, sport: undefined }), label: c.label, active: c.id === cat }))} />
        {cat === "sports" && (
          <div className="mt-3">
            <Tabs
              id="sport"
              label="Sport"
              items={[{ href: href({ sport: undefined }), label: "All sports", active: !sport }, ...SPORTS.map((x) => ({ href: href({ sport: x.id }), label: x.label, active: x.id === sport }))]}
            />
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Segmented id="win" label="Window" items={WINDOWS.map((w) => ({ href: href({ w: w.id }), label: w.label, active: w.id === win }))} />
          {!flowMode && (
            <Segmented
              id="sort"
              label="Rank by"
              items={[
                { href: href({ sort: "PNL" }), label: "Profit", active: sort === "PNL" },
                { href: href({ sort: "VOLUME" }), label: "Volume", active: sort === "VOLUME" },
              ]}
            />
          )}
        </div>
      </PageHeader>
      <div key={`${cat}-${win}-${sort}-${sport ?? ""}`} className="mx-auto max-w-[1360px] px-5 md:px-8">
        {board}
      </div>
    </>
  );
}
