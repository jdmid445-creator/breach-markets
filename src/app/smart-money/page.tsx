import Link from "next/link";
import { leaderboard, positions, type Position, type Trader } from "@/lib/pm";
import { usd, cents, pmMarket } from "@/lib/format";
import { bucketLabel } from "@/lib/sports";
import { Avatar } from "@/components/Avatar";
import { PageHero } from "@/components/PageHero";
import { Reveal, Tilt } from "@/components/fx";

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

  const maxWhales = Math.max(...rows.map((r) => r.whales.length), 2);

  return (
    <>
      <PageHero
        kicker="Smart money"
        title="Where the pod is swimming"
        sub="We read the open books of the 30 most profitable traders this month and surface the bets two or more of them share. Updates every 10 minutes."
        compact
      />
      <div className="mx-auto grid max-w-[1240px] gap-4 px-5 md:grid-cols-2">
        {rows.length === 0 && (
          <div className="glass rounded-[28px] px-5 py-14 text-center text-mute md:col-span-2">
            No shared positions right now, or Polymarket didn’t answer. Check back shortly.
          </div>
        )}
        {rows.map((a, i) => (
          <Reveal key={a.key} delay={(i % 6) * 70} className={i === 0 ? "md:col-span-2" : ""}>
            <Tilt className="group h-full rounded-[28px]">
              <article
                className={`glass relative h-full overflow-hidden rounded-[28px] px-6 py-6 transition-colors group-hover:border-aqua/40 ${
                  i === 0 ? "bg-[radial-gradient(circle_at_85%_0%,rgba(116,255,237,.16),rgba(16,23,58,.85)_55%)] md:px-9 md:py-9" : ""
                }`}
              >
                <div className="flex items-center justify-between text-[11.5px] uppercase tracking-[0.16em] text-mute">
                  <span>
                    <span className="num text-aqua">{String(i + 1).padStart(2, "0")}</span> · {bucketLabel(a.bucket)}
                  </span>
                  <span className="num normal-case tracking-normal">now {cents(a.price)}</span>
                </div>
                <a
                  href={pmMarket(a.eventSlug, a.slug)}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-4 block font-semibold leading-snug hover:text-aqua ${i === 0 ? "display text-[clamp(28px,3.4vw,44px)] !font-[500]" : "text-[18px]"}`}
                >
                  {a.title}
                </a>
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <div className="flex -space-x-2.5">
                    {a.whales.slice(0, 8).map(({ t }, j) => (
                      <Link
                        key={t.address}
                        href={`/trader/${t.address}`}
                        title={t.name}
                        className="row-in rounded-full ring-2 ring-coal transition-transform hover:z-10 hover:-translate-y-1"
                        style={{ animationDelay: `${300 + j * 60}ms` }}
                      >
                        <Avatar src={t.image} seed={t.address} size={32} />
                      </Link>
                    ))}
                  </div>
                  <span className="text-[13.5px] text-mute">
                    <b className="text-bone">{a.whales.length} top traders</b> on{" "}
                    <span className="rounded-md bg-aqua px-1.5 py-0.5 text-[12px] font-semibold text-ink">{a.outcome}</span>
                  </span>
                </div>
                <div className="mt-6 flex items-end justify-between gap-6">
                  <div className="flex-1">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-mute">Consensus</div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-charcoal">
                      <div className="bar-in h-full rounded-full bg-aqua" style={{ width: `${(a.whales.length / maxWhales) * 100}%`, animationDelay: `${200 + (i % 6) * 70}ms` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="num text-[24px] font-semibold">{usd(a.value)}</div>
                    <div className="text-[12px] text-mute">combined</div>
                  </div>
                </div>
              </article>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </>
  );
}
