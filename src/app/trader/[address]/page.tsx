import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { positions, profile, standing, userTrades, short, displayName, type Period } from "@/lib/pm";
import { usd, cents, ago, pmMarket, pmProfile } from "@/lib/format";
import { bucketLabel } from "@/lib/sports";
import { Avatar } from "@/components/Avatar";
import { Panel, Empty, MarketIcon, RankChip, Pnl, Verified, Side, Stat, Accent } from "@/components/desk/ui";
import { Sea } from "@/components/fx/Sea";
import { Counter, Reveal, SplitTitle } from "@/components/fx/motion";
import { CopyAddress } from "@/components/desk/CopyAddress";
import { Medal3D } from "@/components/fx/three";

export const dynamic = "force-dynamic";

const PERIODS: { id: Period; label: string; long: string }[] = [
  { id: "day", label: "24 hours", long: "24-hour" },
  { id: "week", label: "7 days", long: "7-day" },
  { id: "month", label: "30 days", long: "30-day" },
  { id: "all", label: "All time", long: "all-time" },
];
const SHADES = ["#8dbbe0", "#639cc5", "#4a82ad", "#356b96", "#25557f"];

export async function generateMetadata({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  return { title: `${short(address)} — Breach` };
}

export default async function TraderPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) notFound();

  const [prof, stands, pos, trades] = await Promise.all([
    profile(address),
    Promise.all(PERIODS.map((p) => standing(address, p.id))),
    positions(address, 30),
    userTrades(address, 60),
  ]);

  const name = displayName(prof?.name || trades[0]?.name, address);
  const image = prof?.image || trades[0]?.image;
  const openValue = pos.reduce((s, p) => s + p.value, 0);
  const openPnl = pos.reduce((s, p) => s + p.pnl, 0);
  const biggest = [...trades].sort((a, b) => b.usd - a.usd)[0];
  const best = stands
    .map((s, i) => (s?.rankPnl ? { rank: s.rankPnl, label: PERIODS[i].long } : null))
    .filter(Boolean)
    .sort((a, b) => a!.rank - b!.rank)[0];

  const mix = new Map<string, number>();
  for (const t of trades) mix.set(bucketLabel(t.bucket), (mix.get(bucketLabel(t.bucket)) ?? 0) + t.usd);
  const mixTotal = [...mix.values()].reduce((a, b) => a + b, 0) || 1;
  const mixRows = [...mix.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const now = Date.now() / 1000;

  return (
    <>
      <header className="mx-auto max-w-[1360px] px-5 pb-7 pt-40 sm:pt-32 md:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <Avatar src={image} seed={address} name={name} size={76} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <SplitTitle as="h1" text={name} className="mega truncate text-[clamp(40px,6.5vw,104px)] text-fg" />
              {prof?.verified && <Verified />}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px] text-mist">
              {best ? (
                <span className="flex items-center gap-2">
                  <RankChip rank={best.rank} size="md" />
                  on {best.label} profit
                </span>
              ) : (
                <span>Not on a profit leaderboard</span>
              )}
              <CopyAddress address={address} />
              {prof?.x && (
                <a href={`https://x.com/${prof.x}`} target="_blank" rel="noreferrer" className="hover:text-fg">
                  @{prof.x}
                </a>
              )}
            </div>
          </div>
          <Medal3D rank={best?.rank ?? null} label={best ? `${best.label} profit` : "unranked"} className="h-[150px] w-[150px] shrink-0 max-md:-mt-2 md:h-[190px] md:w-[190px]" />
          <a
            href={pmProfile(address)}
            target="_blank"
            rel="noreferrer"
            className="press inline-flex h-10 items-center gap-2 self-start rounded-lg bg-stone-hi px-4 text-[14px] font-semibold text-sea hover:bg-fg md:self-center"
          >
            Open on Polymarket <ArrowUpRight size={16} />
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-[1360px] px-5 md:px-8">
        <div className="grid gap-x-8 gap-y-10 lg:grid-cols-12">
          {/* left column: the sea, then open positions in the space under it */}
          <div className="grid min-w-0 content-start gap-12 lg:col-span-8">
            <Panel framed title="Their bets, as tails" meta={`last ${Math.min(trades.length, 60)} trades`}>
              <Sea trades={trades} height={460} />
            </Panel>
            <Reveal>
              <h2 className="section-title"><Accent text="Open positions" /></h2>
              <div className="mt-4 overflow-x-auto">
                {pos.length === 0 ? (
                  <Empty>No open positions right now.</Empty>
                ) : (
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="text-[12.5px] text-faint">
                        <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 font-normal">Market and side</th>
                        <th className="whitespace-nowrap w-[28%] px-3 py-2.5 sm:px-4 font-normal max-md:hidden">Entry → now</th>
                        <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 text-right font-normal">Value</th>
                        <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 text-right font-normal max-sm:hidden">P&amp;L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pos.map((p) => (
                        <tr key={`${p.conditionId}-${p.outcome}`} className="row band">
                          <td className="w-full max-w-0 px-3 py-3 sm:px-4">
                            <a href={pmMarket(p.eventSlug, p.slug)} target="_blank" rel="noreferrer" className="group flex min-w-0 items-center gap-3">
                              <MarketIcon src={p.icon} label={p.title} size={34} />
                              <span className="min-w-0">
                                <span className="block truncate text-[14.5px] text-fg group-hover:underline">{p.title}</span>
                                <span className="block text-[13px] font-semibold text-stone-hi">{p.outcome}</span>
                              </span>
                            </a>
                          </td>
                          <td className="px-3 py-3 sm:px-4 max-md:hidden">
                            <div className="flex items-center gap-3">
                              <PriceTrack from={p.avgPrice} to={p.curPrice} />
                              <span className="fig shrink-0 text-[13px] text-mist">
                                {cents(p.avgPrice)} → <span className="text-fg">{cents(p.curPrice)}</span>
                              </span>
                            </div>
                          </td>
                          <td className="fig px-3 py-3 sm:px-4 text-right text-[15px] font-semibold text-fg">{usd(p.value)}</td>
                          <td className="px-3 py-3 sm:px-4 text-right max-sm:hidden">
                            <Pnl value={p.pnl} className="text-[14px]">
                              {usd(p.pnl, { sign: true })}
                            </Pnl>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Reveal>
          </div>
          <div className="grid content-start gap-10 lg:col-span-4">
            <Panel title="Profit by window">
              <div className="grid grid-cols-2 gap-3">
                {PERIODS.map((p, i) => {
                  const st = stands[i];
                  return (
                    <Stat
                      key={p.id}
                      hot={Boolean(st?.rankPnl && st.rankPnl <= 10)}
                      label={p.label}
                      aside={st?.rankPnl ? <RankChip rank={st.rankPnl} /> : undefined}
                      value={st ? <Pnl value={st.pnl}><Counter value={st.pnl} sign /></Pnl> : <span className="text-faint">—</span>}
                      sub={st ? `${usd(st.volume)} traded` : "no trades"}
                      className="!p-4 [&_.numeral]:text-[clamp(26px,2.6vw,34px)]"
                    />
                  );
                })}
              </div>
            </Panel>
            <Panel title="Right now">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Open positions" value={<Counter value={openValue} />} sub={`${pos.length} ${pos.length === 1 ? "market" : "markets"}`} className="!p-4 [&_.numeral]:text-[clamp(26px,2.6vw,34px)]" />
                <Stat
                  label="Unrealized"
                  value={pos.length ? <Pnl value={openPnl}><Counter value={openPnl} sign /></Pnl> : <span className="text-faint">—</span>}
                  sub="if they sold now"
                  className="!p-4 [&_.numeral]:text-[clamp(26px,2.6vw,34px)]"
                />
                <Stat label="Biggest recent bet" value={biggest ? usd(biggest.usd) : "—"} sub={biggest?.title} className="col-span-2 !p-4 [&_.numeral]:text-[clamp(26px,2.6vw,34px)]" />
              </div>
            </Panel>
            <Panel title="Where they play" meta="share of recent money" bodyClass="tile p-5">
              {mixRows.length === 0 ? (
                <Empty>No recent trades.</Empty>
              ) : (
                <>
                  <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full">
                    {mixRows.map(([k, v], i) => (
                      <span key={k} className="bar-in h-full" style={{ width: `${(v / mixTotal) * 100}%`, background: SHADES[i], animationDelay: `${i * 60}ms` }} />
                    ))}
                  </div>
                  <ul className="mt-3.5 grid gap-2">
                    {mixRows.map(([k, v], i) => (
                      <li key={k} className="flex items-center gap-3 text-[14px]">
                        <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SHADES[i] }} />
                        <span className="text-fg">{k}</span>
                        <span className="fig ml-auto font-semibold text-fg">{Math.round((v / mixTotal) * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Panel>
          </div>
        </div>

        <Reveal className="mt-16">
          <h2 className="section-title"><Accent text="Recent trades" /></h2>
          <div className="mt-4 overflow-x-auto">
            {trades.length === 0 ? (
              <Empty>No recent trades.</Empty>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="text-[12.5px] text-faint">
                    <th className="whitespace-nowrap w-[52px] px-3 sm:w-[72px] py-2.5 sm:px-4 font-normal max-sm:hidden">When</th>
                    <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 font-normal">Bet</th>
                    <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 text-right font-normal">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.slice(0, 30).map((t) => (
                    <tr key={t.id} className="row band">
                      <td className="fig px-3 py-3 sm:px-4 text-[13px] text-faint max-sm:hidden">{ago(t.ts, now)}</td>
                      <td className="w-full max-w-0 px-3 py-3 sm:px-4">
                        <a href={pmMarket(t.eventSlug, t.slug)} target="_blank" rel="noreferrer" className="group flex min-w-0 items-center gap-3">
                          <MarketIcon src={t.icon} label={t.title} size={30} />
                          <span className="min-w-0">
                            <span className="block truncate text-[14px] text-fg group-hover:underline">{t.title}</span>
                            <span className="block text-[13px] text-faint">
                              <Side side={t.side} />{" "}
                              <span className="text-mist">{t.outcome}</span> at <span className="fig">{cents(t.price)}</span>
                            </span>
                          </span>
                        </a>
                      </td>
                      <td className="fig px-3 py-3 sm:px-4 text-right text-[15px] font-semibold text-fg">{usd(t.usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Reveal>
      </div>
    </>
  );
}

/** Where they bought (tick) and where it trades now (fill), on a 0–100¢ track. */
function PriceTrack({ from, to }: { from: number; to: number }) {
  const a = Math.min(100, Math.max(0, from * 100));
  const b = Math.min(100, Math.max(0, to * 100));
  const up = b >= a;
  return (
    <span className="relative block h-[6px] flex-1 rounded-full bg-reef" aria-hidden>
      <span
        className={`bar-in absolute inset-y-0 rounded-full ${up ? "bg-stone-hi/80" : "bg-faint/80"}`}
        style={{ left: `${Math.min(a, b)}%`, width: `${Math.max(1.5, Math.abs(b - a))}%` }}
      />
      <span className="absolute -top-[3px] h-[12px] w-[2px] rounded-full bg-fg" style={{ left: `${a}%` }} />
    </span>
  );
}
