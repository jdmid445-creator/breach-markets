import { CATEGORIES, leaderboard, tradesSince, flowBoard, type Period, type SortBy } from "@/lib/pm";
import { SPORTS } from "@/lib/sports";
import { TraderTable, FlowTable } from "@/components/desk/Boards";
import { PageHeader } from "@/components/desk/ui";
import { Tabs, Segmented } from "@/components/desk/Tabs";
import { SportSelect } from "@/components/desk/SportSelect";

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
    board = <FlowTable rows={flowBoard(filtered).slice(0, 100)} />;
    note = `Who moved the most money in $1K+ bets over ${winInfo.long}. Polymarket doesn’t publish profit for this cut, so this shows who’s acting, not yet who’s right.`;
  } else {
    const rows = (await leaderboard({ period: win as Period, category: cat, sort, limit: 100 })) ?? [];
    board = <TraderTable rows={rows} sort={sort} sortHref={(s) => href({ sort: s })} />;
    note = `The top 100 by ${sort === "PNL" ? "profit" : "volume"} over ${winInfo.long}, straight from Polymarket.`;
  }

  return (
    <>
      <PageHeader title={`${scope} leaderboard`} sub={note}>
        <Tabs id="cat" label="Market" items={CATEGORIES.map((c) => ({ href: href({ cat: c.id, sport: undefined }), label: c.label, active: c.id === cat }))} />
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Segmented id="win" label="Window" items={WINDOWS.map((w) => ({ href: href({ w: w.id }), label: w.label, active: w.id === win }))} />
          {cat === "sports" && (
            <SportSelect
              value={sport ?? ""}
              options={[{ value: "", label: "All sports", href: href({ sport: undefined }) }, ...SPORTS.map((s) => ({ value: s.id, label: s.label, href: href({ sport: s.id }) }))]}
            />
          )}
        </div>
      </PageHeader>
      <div key={`${cat}-${win}-${sort}-${sport ?? ""}`} className="mx-auto max-w-[1360px] px-5 md:px-8">
        <div className="overflow-hidden rounded-lg border border-hair bg-shoal">{board}</div>
      </div>
    </>
  );
}
