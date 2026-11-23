import Link from "next/link";
import { CATEGORIES, leaderboard, tradesSince, flowBoard, type Period, type SortBy } from "@/lib/pm";
import { SPORTS } from "@/lib/sports";
import { TraderTable, FlowTable } from "@/components/TraderTable";

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
    const rows = await leaderboard({ period: win as Period, category: cat, sort, limit: 100 });
    board = <TraderTable rows={rows ?? []} sort={sort} />;
    note = sort === "PNL" ? "Ranked by profit in the window, straight from Polymarket." : "Ranked by trading volume in the window.";
  }

  const catLabel = CATEGORIES.find((c) => c.id === cat)!.label;

  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-12">
      <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-royal-soft">Leaderboards</p>
      <h1 className="display mt-3 text-[clamp(48px,8vw,92px)]">
        {sport ? SPORTS.find((s) => s.id === sport)!.label : catLabel}{" "}
        <span className="text-royal">{WINDOWS.find((w) => w.id === win)!.label}</span>
      </h1>

      <div className="mt-8 flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <Chip key={c.id} on={c.id === cat} href={href({ cat: c.id, sport: undefined })}>
            {c.label}
          </Chip>
        ))}
      </div>

      {cat === "sports" && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-l-2 border-royal pl-3">
          <Chip on={!sport} href={href({ sport: undefined })} small>
            All sports
          </Chip>
          {SPORTS.map((s) => (
            <Chip key={s.id} on={s.id === sport} href={href({ sport: s.id })} small>
              {s.label}
            </Chip>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border hairline bg-coal p-0.5 text-[13px]">
          {WINDOWS.map((w) => (
            <Link
              key={w.id}
              href={href({ w: w.id })}
              className={`rounded-full px-3.5 py-1.5 ${w.id === win ? "bg-royal text-white" : "text-mute hover:text-bone"}`}
            >
              {w.label}
            </Link>
          ))}
        </div>
        {!flowMode && (
          <div className="flex rounded-full border hairline bg-coal p-0.5 text-[13px]">
            {(["PNL", "VOLUME"] as const).map((s) => (
              <Link
                key={s}
                href={href({ sort: s })}
                className={`rounded-full px-3.5 py-1.5 ${s === sort ? "bg-charcoal text-bone" : "text-mute hover:text-bone"}`}
              >
                {s === "PNL" ? "Profit" : "Volume"}
              </Link>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 max-w-[680px] text-[13px] leading-relaxed text-mute">{note}</p>
      <div className="mt-5">{board}</div>
    </div>
  );
}

function Chip({ href, on, children, small }: { href: string; on: boolean; children: React.ReactNode; small?: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3.5 ${small ? "py-1 text-[12.5px]" : "py-1.5 text-[13.5px]"} transition-colors ${
        on ? "border-bone bg-bone text-ink" : "hairline text-mute hover:text-bone"
      }`}
    >
      {children}
    </Link>
  );
}
