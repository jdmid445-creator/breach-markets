import Link from "next/link";
import { leaderboard, positions, type Position, type Trader } from "@/lib/pm";
import { usd, cents, pmMarket } from "@/lib/format";
import { bucketLabel } from "@/lib/sports";
import { Avatar } from "@/components/Avatar";

export const revalidate = 600;
export const metadata = { title: "Smart money — Breach" };

type Agg = {
  key: string;
  title: string;
  outcome: string;
  eventSlug: string;
  slug: string;
  price: number;
  value: number;
  whales: { t: Trader; p: Position }[];
  bucket: Position["bucket"];
};

export default async function SmartMoneyPage() {
  // Top 30 traders by 30-day profit: who's hot right now
  const top = ((await leaderboard({ period: "month", category: "overall", sort: "PNL", limit: 30 })) ?? []).filter((t) => t.address);
  const books = await Promise.all(top.map(async (t) => ({ t, pos: await positions(t.address, 20) })));

  const m = new Map<string, Agg>();
  for (const { t, pos } of books) {
    for (const p of pos) {
      if (p.value < 1000) continue;
      const key = `${p.conditionId}:${p.outcome}`;
      const a =
        m.get(key) ??
        ({ key, title: p.title, outcome: p.outcome, eventSlug: p.eventSlug, slug: p.slug, price: p.curPrice, value: 0, whales: [], bucket: p.bucket } as Agg);
      a.value += p.value;
      a.whales.push({ t, p });
      m.set(key, a);
    }
  }
  const rows = [...m.values()]
    .filter((a) => a.whales.length >= 2)
    .sort((a, b) => b.whales.length - a.whales.length || b.value - a.value)
    .slice(0, 40);

  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-12">
      <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-royal-soft">Smart money</p>
      <h1 className="display mt-3 text-[clamp(48px,8vw,92px)]">
        Where the <span className="text-royal">pod</span> is swimming
      </h1>
      <p className="mt-4 max-w-[620px] text-[16px] leading-relaxed text-mute">
        We pull the open books of the 30 most profitable traders this month and show the bets two or more of them share.
        When the sharpest wallets stack the same side, you see it here first. Updates every 10 minutes.
      </p>

      <div className="mt-10 grid gap-3">
        {rows.length === 0 && (
          <div className="rounded-2xl border hairline bg-coal px-5 py-14 text-center text-mute">
            No shared positions right now, or Polymarket didn’t answer. Check back shortly.
          </div>
        )}
        {rows.map((a, i) => (
          <article key={a.key} className="grid items-center gap-4 rounded-2xl border hairline bg-coal px-5 py-4 sm:grid-cols-[44px_1fr_auto]">
            <span className={`num text-[22px] font-bold ${i < 3 ? "text-tang" : "text-mute"}`}>{i + 1}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-mute">
                <span className="uppercase tracking-[0.12em]">{bucketLabel(a.bucket)}</span>
              </div>
              <a href={pmMarket(a.eventSlug, a.slug)} target="_blank" rel="noreferrer" className="mt-1 block text-[16px] font-semibold leading-snug hover:text-royal-soft">
                {a.title}
              </a>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {a.whales.slice(0, 7).map(({ t }) => (
                    <Link key={t.address} href={`/trader/${t.address}`} title={t.name} className="rounded-full ring-2 ring-coal">
                      <Avatar src={t.image} seed={t.address} size={28} />
                    </Link>
                  ))}
                </div>
                <span className="text-[13px] text-mute">
                  <span className="font-semibold text-bone">{a.whales.length} top traders</span> hold{" "}
                  <span className="rounded bg-aqua px-1.5 py-0.5 text-[12px] font-semibold text-ink">{a.outcome}</span>
                </span>
              </div>
            </div>
            <div className="text-right max-sm:text-left">
              <div className="num text-[22px] font-semibold">{usd(a.value)}</div>
              <div className="num text-[12.5px] text-mute">combined · now {cents(a.price)}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
