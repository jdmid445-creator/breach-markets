import Link from "next/link";
import { bigTrades, leaderboard } from "@/lib/pm";
import { usd, cents, pmMarket } from "@/lib/format";
import { ScrollIntro } from "@/components/ScrollIntro";
import { HomeLive } from "@/components/desk/Whales";
import { BoardSwitch } from "@/components/desk/BoardSwitch";
import { Panel, Empty, MarketIcon } from "@/components/desk/ui";
import { Avatar } from "@/components/Avatar";
import { podConsensus } from "@/lib/smart";
import { bucketLabel } from "@/lib/sports";

export const revalidate = 30;

export default async function Home() {
  const [feed, weekly, politics, sports, pod] = await Promise.all([
    bigTrades(10_000, 80, 10),
    leaderboard({ period: "week", category: "overall", sort: "PNL", limit: 8 }),
    leaderboard({ period: "week", category: "politics", sort: "PNL", limit: 8 }),
    leaderboard({ period: "week", category: "sports", sort: "PNL", limit: 8 }),
    podConsensus(15).catch(() => []),
  ]);
  const trades = feed ?? [];

  const mix = new Map<string, number>();
  for (const t of trades) mix.set(bucketLabel(t.bucket), (mix.get(bucketLabel(t.bucket)) ?? 0) + t.usd);
  const mixRows = [...mix.entries()].sort((a, b) => b[1] - a[1]);
  const mixTop = mixRows.slice(0, 5);
  const rest = mixRows.slice(5).reduce((s, [, v]) => s + v, 0);
  if (rest > 0) mixTop.push(["Everything else", rest]);
  const mixTotal = mixTop.reduce((s, [, v]) => s + v, 0) || 1;
  const SHADES = ["#8dbbe0", "#639cc5", "#4a82ad", "#356b96", "#25557f", "#17436d"];
  const SIZES = [
    { label: "$10K–50K", lo: 10_000, hi: 50_000 },
    { label: "$50K–100K", lo: 50_000, hi: 100_000 },
    { label: "$100K–250K", lo: 100_000, hi: 250_000 },
    { label: "$250K and up", lo: 250_000, hi: Infinity },
  ].map((b) => ({ ...b, n: trades.filter((t) => t.usd >= b.lo && t.usd < b.hi).length }));
  const sizeMax = Math.max(...SIZES.map((b) => b.n), 1);

  return (
    <>
      <ScrollIntro />
      {/* seam: the intro's night water hands off to the desk */}
      <div aria-hidden className="h-24 bg-[linear-gradient(180deg,#0a0f26,#03203d)]" />

      <div className="mx-auto max-w-[1360px] px-5 pt-10 md:px-8">
        <HomeLive initial={trades} />

        <div className="mt-14 grid gap-x-8 gap-y-12 lg:grid-cols-12">
          <BoardSwitch
            className="lg:col-span-5"
            boards={[
              { id: "overall", label: "All markets", href: "/leaderboard?w=week", rows: weekly },
              { id: "politics", label: "Politics", href: "/leaderboard?cat=politics&w=week", rows: politics },
              { id: "sports", label: "Sports", href: "/leaderboard?cat=sports&w=week", rows: sports },
            ]}
          />
          <Panel title="Smart money" meta="bets the month’s top 15 traders share" href="/smart-money" hrefLabel="All shared bets" className="lg:col-span-7">
            {pod.length === 0 ? (
              <Empty>None of the top traders share a position right now.</Empty>
            ) : (
              <ul>
                {pod.slice(0, 6).map((p) => (
                  <li key={p.key} className="row grid grid-cols-[34px_1fr_auto] items-center gap-4 border-b border-hair px-4 py-3 last:border-0 sm:grid-cols-[34px_1fr_120px_96px]">
                    <MarketIcon src={p.icon} label={p.title} size={34} />
                    <div className="min-w-0">
                      <a href={pmMarket(p.eventSlug, p.slug)} target="_blank" rel="noreferrer" className="block truncate text-[14.5px] text-fg hover:underline">
                        {p.title}
                      </a>
                      <div className="mt-0.5 text-[13px] text-faint">
                        <span className="font-semibold text-stone-hi">{p.outcome}</span> · now <span className="fig">{cents(p.price)}</span>
                      </div>
                    </div>
                    <div className="hidden items-center gap-2 sm:flex">
                      {p.whales.some(({ t }) => t.image) && (
                        <span className="flex -space-x-2">
                          {p.whales
                            .filter(({ t }) => t.image)
                            .slice(0, 5)
                            .map(({ t }) => (
                              <Link key={t.address} href={`/trader/${t.address}`} title={t.name} className="rounded-full ring-2 ring-sea transition-transform duration-150 hover:z-10 hover:-translate-y-0.5">
                                <Avatar src={t.image} seed={t.address} name={t.name} size={24} />
                              </Link>
                            ))}
                        </span>
                      )}
                      <span className="whitespace-nowrap text-[13px] text-mist">
                        <span className="fig font-semibold text-fg">{p.whales.length}</span> of 15
                      </span>
                    </div>
                    <div className="fig text-right text-[15px] font-semibold text-fg">{usd(p.value)}</div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Where the money is" meta="the recent whale bets above" className="lg:col-span-12" bodyClass="grid gap-x-16 gap-y-8 px-4 py-5 md:grid-cols-2">
            {mixTop.length === 0 ? (
              <Empty>No whale bets yet.</Empty>
            ) : (
              <>
                <div>
                  <h3 className="text-[13px] text-mist">By market type</h3>
                  <div className="mt-3 flex h-3 w-full gap-[2px] overflow-hidden rounded-full">
                    {mixTop.map(([k, v], i) => (
                      <span key={k} className="bar-in h-full" style={{ width: `${(v / mixTotal) * 100}%`, background: SHADES[i], animationDelay: `${i * 60}ms` }} />
                    ))}
                  </div>
                  <ul className="mt-4 grid gap-2.5">
                    {mixTop.map(([k, v], i) => (
                      <li key={k} className="flex items-center gap-3 text-[14px]">
                        <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SHADES[i] }} />
                        <span className="text-fg">{k}</span>
                        <span className="fig ml-auto text-mist">{usd(v)}</span>
                        <span className="fig w-11 text-right font-semibold text-fg">{Math.round((v / mixTotal) * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-[13px] text-mist">By bet size</h3>
                  <ul className="mt-3 grid gap-3">
                    {SIZES.map((b, i) => (
                      <li key={b.label} className="grid grid-cols-[112px_1fr_32px] items-center gap-3 text-[14px]">
                        <span className="text-fg">{b.label}</span>
                        <span className="h-[6px] rounded-full bg-reef">
                          <span className="bar-in block h-full rounded-full bg-stone" style={{ width: `${Math.max(2, (b.n / sizeMax) * 100)}%`, animationDelay: `${i * 60}ms` }} />
                        </span>
                        <span className="fig text-right font-semibold text-fg">{b.n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
