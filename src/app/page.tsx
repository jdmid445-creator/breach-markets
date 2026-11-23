import Link from "next/link";
import { bigTrades, leaderboard } from "@/lib/pm";
import { usd, cents, pmMarket } from "@/lib/format";
import { ScrollIntro } from "@/components/ScrollIntro";
import { HomeLive } from "@/components/desk/Whales";
import { HeroTail3D } from "@/components/fx/three";
import { LeaderHub } from "@/components/fx/LeaderHub";
import { Reveal, SplitTitle } from "@/components/fx/motion";
import { BigTitle, VelocityTape } from "@/components/fx/scroll";
import { Panel, Empty, MarketIcon } from "@/components/desk/ui";
import { Avatar } from "@/components/Avatar";
import { podConsensus } from "@/lib/smart";
import { bucketLabel } from "@/lib/sports";

export const revalidate = 30;

export default async function Home() {
  const [feed, today, pod] = await Promise.all([
    bigTrades(10_000, 80, 10),
    leaderboard({ period: "day", category: "overall", sort: "PNL", limit: 20 }),
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
      {/* seam: the intro's night water melts straight into the desk's water, no band */}
      <div aria-hidden className="pointer-events-none relative z-10 -mb-64 -mt-28 h-[23rem] bg-[linear-gradient(180deg,rgba(10,15,38,0)_0%,#0a0f26_30%,#0a0f26_42%,rgba(10,15,38,.55)_68%,rgba(10,15,38,0)_100%)]" />

      <div className="relative z-20 mx-auto max-w-[1360px] px-5 pt-6 md:px-8 md:pt-10">
        <div className="relative">
          <SplitTitle as="h2" text="Top traders today" hiLast className="mega relative z-10 text-[clamp(52px,9.5vw,156px)] text-fg" />
        </div>
        <div className="mt-6">
          <LeaderHub initial={today ?? []} titled={false} aside={<HeroTail3D className="h-[260px] w-[300px]" />} />
        </div>
      </div>

      <div className="mt-28">
        <VelocityTape items={["$10K+ bets", "Live", "Ranked traders", "Every market"]} />
      </div>

      <div className="mx-auto max-w-[1600px] px-3 pt-20 md:px-6">
        <div className="mx-auto max-w-[1360px] px-2 md:px-2">
          <BigTitle text="Whales breaking the surface" hi={["surface"]} className="text-[clamp(48px,8.5vw,140px)] text-fg" />
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-[60ch] text-[17px] leading-relaxed text-mist">
              Every Polymarket bet of $10K or more, live. Each tail is one bet and the taller it stands, the bigger the bet. Red is a top-10 trader. Drag to turn the sea, click a tail to see who placed it.
            </p>
          </Reveal>
        </div>
        <div className="mt-12">
          <HomeLive initial={trades} />
        </div>
      </div>

      <div className="mx-auto max-w-[1360px] px-5 md:px-8">

        <div className="mt-32">
          <BigTitle text="Follow the smart money" hi={["smart"]} className="text-[clamp(48px,8.5vw,140px)] text-fg" />
        </div>
        <div className="mt-10 grid gap-x-8 gap-y-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-12">
          <Panel title="Smart money" meta="bets the month’s top 15 traders share" href="/smart-money" hrefLabel="All shared bets" className="lg:col-span-12">
            {pod.length === 0 ? (
              <Empty>None of the top traders share a position right now.</Empty>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {pod.slice(0, 6).map((p) => (
                  <li key={p.key} className="tile tile-hover spot grid grid-cols-[38px_1fr_auto] items-center gap-4 p-4 sm:grid-cols-[38px_1fr_auto_auto]">
                    <MarketIcon src={p.icon} label={p.title} size={38} />
                    <div className="min-w-0">
                      <a href={pmMarket(p.eventSlug, p.slug)} target="_blank" rel="noreferrer" className="block truncate text-[15.5px] font-medium text-fg hover:underline">
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
                    <div className="numeral text-right text-[28px] text-fg">{usd(p.value)}</div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          </Reveal>

          <Reveal className="lg:col-span-12" delay={0.1}>
          <Panel title="Whale money by market and size" meta="the recent whale bets above" className="lg:col-span-12" bodyClass="grid gap-3 md:grid-cols-2">
            {mixTop.length === 0 ? (
              <Empty>No whale bets yet.</Empty>
            ) : (
              <>
                <div className="tile p-5">
                  <h3 className="text-[15px] text-mist">By market <em className="serif text-[18px] text-stone-hi">type</em></h3>
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
                <div className="tile p-5">
                  <h3 className="text-[15px] text-mist">By bet <em className="serif text-[18px] text-stone-hi">size</em></h3>
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
          </Reveal>
        </div>
      </div>
    </>
  );
}
