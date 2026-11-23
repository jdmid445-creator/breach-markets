import Link from "next/link";
import { notFound } from "next/navigation";
import { positions, profile, standing, userTrades, short, displayName, type Period } from "@/lib/pm";
import { usd, cents, ago, pmMarket, pmProfile } from "@/lib/format";
import { bucketLabel } from "@/lib/sports";
import { Avatar } from "@/components/Avatar";
import {CountUp} from "@/components/fx";

export const dynamic = "force-dynamic";

const PERIODS: { id: Period; label: string }[] = [
  { id: "day", label: "24H" },
  { id: "week", label: "7D" },
  { id: "month", label: "30D" },
  { id: "all", label: "All time" },
];
const MIX = ["#cd8117", "#e8e4d6", "#7d8a3a", "#a29d86"];

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
    userTrades(address, 40),
  ]);

  const name = displayName(prof?.name || trades[0]?.name, address);
  const image = prof?.image || trades[0]?.image;
  const openValue = pos.reduce((s, p) => s + p.value, 0);
  const openPnl = pos.reduce((s, p) => s + p.pnl, 0);
  const biggest = [...trades].sort((a, b) => b.usd - a.usd)[0];
  const best = stands.find((s) => s?.rankPnl) ?? null;

  const mix = new Map<string, number>();
  for (const t of trades) mix.set(bucketLabel(t.bucket), (mix.get(bucketLabel(t.bucket)) ?? 0) + t.usd);
  const mixTotal = [...mix.values()].reduce((a, b) => a + b, 0) || 1;
  const mixRows = [...mix.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <>
      {/* Header */}
      <section className="t-scan border-b border-t-line pb-8 pt-24">
        <div className="mx-auto max-w-[1440px] px-5">
          <p className="t-mono text-[12px] text-t-dim">
            breach / profile / <span className="text-t-text">{short(address)}</span>
            <span className="t-blink ml-1 text-t-amber">▍</span>
          </p>
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end">
            <div className="shrink-0 border border-t-line p-1.5">
              <Avatar src={image} seed={address} size={104} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="t-head t-type truncate text-[clamp(40px,6.4vw,96px)] text-t-text">{name}</h1>
              <div className="t-mono mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-t-dim">
                {best?.rankPnl && (
                  <span className="text-t-text">
                    ranked <b className="text-t-amber">#{best.rankPnl.toLocaleString()}</b> on {PERIODS.find((p) => p.id === best.period)!.label} profit
                  </span>
                )}
                <span>{address}</span>
                {prof?.x && (
                  <a href={`https://x.com/${prof.x}`} target="_blank" rel="noreferrer" className="hover:text-t-text">
                    @{prof.x}
                  </a>
                )}
                <a href={pmProfile(address)} target="_blank" rel="noreferrer" className="text-t-amber underline-offset-4 hover:underline">
                  polymarket ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-5 pt-8">
        <div className="grid grid-cols-2 gap-px border border-t-line bg-t-line lg:grid-cols-5">
          {PERIODS.map((p, i) => {
            const s = stands[i];
            return (
              <div key={p.id} className={p.id === "all" ? "col-span-2" : ""}>
                                  <div className={`h-full px-6 py-6 ${p.id === "all" ? "bg-t-amber text-t-bg" : "bg-t-panel"}`}>
                    <div className={`text-[13px] ${p.id === "all" ? "text-t-bg/70" : "text-t-dim"}`}>{p.label} profit</div>
                    <div className={`t-mono mt-3 font-semibold ${p.id === "all" ? "text-[44px]" : "text-[30px]"} ${p.id === "all" ? "" : !s ? "text-t-dim" : s.pnl >= 0 ? "text-t-up" : "text-t-down"}`}>
                      {s ? (
                        <>
                          {s.pnl >= 0 ? "+" : "−"}
                          <CountUp value={Math.abs(s.pnl)} format="usd" />
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                    <div className={`t-mono mt-2 text-[12.5px] ${p.id === "all" ? "text-t-bg/70" : "text-t-dim"}`}>
                      {s?.rankPnl ? <span className={p.id === "all" ? "font-semibold text-t-bg" : "text-t-text"}>#{s.rankPnl.toLocaleString()}</span> : "Unranked"} · {s ? usd(s.volume) : "—"} vol
                    </div>
                  </div>
                              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Stat label="Open positions" value={<CountUp value={openValue} format="usd" />} sub={`${pos.length} markets`} delay={0} />
          <Stat
            label="Unrealized P&L"
            value={pos.length ? <>{openPnl >= 0 ? "+" : "−"}<CountUp value={Math.abs(openPnl)} format="usd" /></> : "—"}
            tone={pos.length ? (openPnl >= 0 ? "up" : "down") : undefined}
            sub="on current holdings"
            delay={80}
          />
          <Stat label="Biggest recent bet" value={biggest ? <CountUp value={biggest.usd} format="usd" /> : "—"} sub={biggest ? biggest.title : "No recent trades"} delay={160} />
        </div>

        {mixRows.length > 0 && (
          <div className="mt-4">
            <div className="border border-t-line bg-t-panel px-6 py-5">
              <div className="text-[13px] text-t-dim">Where they play</div>
              <div className="mt-4 flex h-3 gap-1 overflow-hidden">
                {mixRows.map(([k, v], i) => (
                  <span key={k} className="bar-in" style={{ width: `${(v / mixTotal) * 100}%`, background: MIX[i], animationDelay: `${i * 120}ms` }} />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13.5px]">
                {mixRows.map(([k, v], i) => (
                  <span key={k} className="flex items-center gap-2">
                    <span className="h-2 w-2" style={{ background: MIX[i] }} />
                    {k} <span className="t-mono text-t-dim">{Math.round((v / mixTotal) * 100)}%</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-20 grid gap-12 lg:grid-cols-2">
          <section>
            <div>
              <h2 className="t-head text-[clamp(28px,3vw,40px)]">
                Holding <span className="text-t-amber">now</span>
              </h2>
            </div>
            <div className="mt-6 grid gap-3">
              {pos.length === 0 && <div className="border border-t-line bg-t-panel px-6 py-12 text-center text-t-dim">No open positions right now.</div>}
              {pos.map((p, i) => (
                <div key={`${p.conditionId}-${p.outcome}`} className="row-in border border-t-line bg-t-panel group px-5 py-4" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start justify-between gap-4">
                    <a href={pmMarket(p.eventSlug, p.slug)} target="_blank" rel="noreferrer" className="min-w-0 text-[14.5px] font-medium leading-snug group-hover:text-t-amber">
                      {p.title}
                    </a>
                    <span className="t-mono shrink-0 text-[16px] font-semibold">{usd(p.value)}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="rounded-md bg-t-amber/15 px-2 py-0.5 text-[12px] font-semibold text-t-amber">{p.outcome}</span>
                    <span className="relative h-1.5 flex-1 overflow-hidden bg-t-olive">
                      <span className="bar-in absolute inset-y-0 left-0 bg-t-amber/70" style={{ width: `${Math.min(100, p.curPrice * 100)}%` }} />
                      <span className="absolute inset-y-0 w-0.5 bg-t-text" style={{ left: `${Math.min(100, p.avgPrice * 100)}%` }} />
                    </span>
                    <span className="t-mono text-[12.5px] text-t-dim">
                      {cents(p.avgPrice)} → {cents(p.curPrice)}
                    </span>
                    <span className={`t-mono text-[12.5px] font-semibold ${p.pnl >= 0 ? "text-t-up" : "text-t-down"}`}>{usd(p.pnl, { sign: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div>
              <h2 className="t-head text-[clamp(28px,3vw,40px)]">
                Recent <span className="text-t-amber">moves</span>
              </h2>
            </div>
            <ol className="relative mt-6 border-l border-t-line pl-6">
              {trades.length === 0 && <li className="border border-t-line bg-t-panel px-6 py-12 text-center text-t-dim">No recent trades.</li>}
              {trades.slice(0, 25).map((t, i) => (
                <li key={t.id} className="row-in relative pb-5" style={{ animationDelay: `${i * 40}ms` }}>
                  <span className={`absolute -left-[29px] top-1.5 h-2.5 w-2.5 ring-4 ring-t-bg ${t.side === "BUY" ? "bg-t-amber" : "bg-t-down"}`} />
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[14px] leading-snug">{t.title}</div>
                      <div className="mt-1 text-[12.5px] text-t-dim">
                        <span className={t.side === "BUY" ? "text-t-up" : "text-t-down"}>{t.side === "BUY" ? "Bought" : "Sold"}</span> {t.outcome} @{" "}
                        <span className="t-mono">{cents(t.price)}</span> · {ago(t.ts)} ago
                      </div>
                    </div>
                    <span className="t-mono shrink-0 text-[15px] font-semibold">{usd(t.usd)}</span>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/live" className="mt-2 inline-block text-[13px] text-t-amber hover:text-t-text">
              Watch the live feed →
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: "up" | "down"; delay?: number }) {
  return (
    <div>
      <div className="border border-t-line bg-t-panel px-6 py-5">
        <div className="text-[13px] text-t-dim">{label}</div>
        <div className={`t-mono mt-2.5 text-[26px] font-semibold ${tone === "up" ? "text-t-up" : tone === "down" ? "text-t-down" : ""}`}>{value}</div>
        {sub && <div className="mt-1 truncate text-[12.5px] text-t-dim">{sub}</div>}
      </div>
    </div>
  );
}
