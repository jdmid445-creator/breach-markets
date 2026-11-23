import { CATEGORIES, leaderboard, tradesSince, flowBoard, type Period, type SortBy } from "@/lib/pm";
import { SPORTS } from "@/lib/sports";
import { TraderTable, FlowTable } from "@/components/TraderTable";
import { PageHero } from "@/components/PageHero";
import { Segmented } from "@/components/Segmented";
import { Podium } from "@/components/Podium";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leaderboards — Breach" };

const WINDOWS = [
  { id: "hour", label: "1H" },
  { id: "day", label: "24H" },
  { id: "week", label: "7D" },
  { id: "month", label: "30D" },
  { id: "all", label: "All time" },
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

  // Flow mode: 1H window or a specific sport. Polymarket only ranks profit for
  // day/week/month/all and one combined "sports" bucket, so we compute these
  // from the live $1K+ trade feed instead.
  const flowMode = win === "hour" || Boolean(sport);
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
    note = `Ranked by money moved in $1K+ bets over the last ${WINDOWS.find((w) => w.id === win)!.label}${
      sport ? ` in ${SPORTS.find((s) => s.id === sport)!.label}` : ""
    }. Polymarket doesn’t publish profit for this cut, so this shows who’s acting, not who’s right yet.`;
  } else {
    const rows = (await leaderboard({ period: win as Period, category: cat, sort, limit: 100 })) ?? [];
    const podium = rows.length >= 3;
    board = (
      <>
        {podium && (
          <div className="mb-6">
            <Podium rows={rows} />
          </div>
        )}
        <TraderTable rows={rows} sort={sort} skip={podium ? 3 : 0} />
      </>
    );
    note = sort === "PNL" ? "Ranked by profit in the window, straight from Polymarket." : "Ranked by trading volume in the window.";
  }

  const catLabel = CATEGORIES.find((c) => c.id === cat)!.label;

  const winLabel = WINDOWS.find((w) => w.id === win)!.label;
  const headline = `${sport ? SPORTS.find((s) => s.id === sport)!.label : catLabel} · ${winLabel}`;

  return (
    <>
      <PageHero kicker="Leaderboards" title={headline} sub={note} compact>
        <div className="flex flex-col gap-3">
          <Segmented id="cat" label="market" items={CATEGORIES.map((c) => ({ href: href({ cat: c.id, sport: undefined }), label: c.label, active: c.id === cat }))} />
          {cat === "sports" && (
            <Segmented
              id="sport"
              label="sport"
              items={[{ href: href({ sport: undefined }), label: "All sports", active: !sport }, ...SPORTS.map((s) => ({ href: href({ sport: s.id }), label: s.label, active: s.id === sport }))]}
            />
          )}
          <div className="flex flex-wrap gap-3">
            <Segmented id="win" label="window" items={WINDOWS.map((w) => ({ href: href({ w: w.id }), label: w.label, active: w.id === win }))} />
            {!flowMode && (
              <Segmented
                id="sort"
                label="rank by"
                items={(["PNL", "VOLUME"] as const).map((x) => ({ href: href({ sort: x }), label: x === "PNL" ? "Profit" : "Volume", active: x === sort }))}
              />
            )}
          </div>
        </div>
      </PageHero>
      <div key={`${cat}-${win}-${sort}-${sport ?? ""}`} className="mx-auto max-w-[1440px] px-5 pt-8">
        {board}
      </div>
    </>
  );
}
