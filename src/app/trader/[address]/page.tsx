import Link from "next/link";
import { notFound } from "next/navigation";
import { positions, profile, standing, userTrades, short, displayName, type Period } from "@/lib/pm";
import { usd, cents, ago, pmMarket, pmProfile } from "@/lib/format";
import { bucketLabel } from "@/lib/sports";
import { Avatar } from "@/components/Avatar";
import { CountUp, Tilt } from "@/components/fx";
import { INTRO } from "@/lib/media";
import { TextReveal } from "@/components/unlumen/text-reveal";

export const dynamic = "force-dynamic";

const PERIODS: { id: Period; label: string }[] = [
  { id: "day", label: "24H" },
  { id: "week", label: "7D" },
  { id: "month", label: "30D" },
  { id: "all", label: "All time" },
];
const MIX = ["#74FFED", "#3b8e8f", "#2b3a7a", "#fe81d1"];

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
      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-32">
        <video src={INTRO.dive} autoPlay muted loop playsInline preload="metadata" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="caustics pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,15,38,.5),#0a0f26)]" aria-hidden />
        <div className="relative mx-auto flex max-w-[1240px] flex-col gap-8 px-5 md:flex-row md:items-end">
          <div className="relative w-fit shrink-0">
            <span className="absolute -inset-3 animate-[spin_14s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(116,255,237,.55),transparent_40%)] blur-[2px]" aria-hidden />
            <div className="relative rounded-full bg-ink p-1.5">
              <Avatar src={image} seed={address} size={116} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-[13px] font-medium uppercase tracking-[0.2em] text-aqua">
              <span className="h-px w-8 bg-aqua/60" /> Whale profile
            </p>
            <TextReveal as="h1" text={name} splitBy="characters" staggerDelay={0.03} className="display mt-4 truncate text-[clamp(40px,6.4vw,96px)] !leading-[0.95]" />
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-mute">
              {best?.rankPnl && (
                <span className="text-bone">
                  Ranked <b className="num text-aqua">#{best.rankPnl.toLocaleString()}</b> on {PERIODS.find((p) => p.id === best.period)!.label} profit
                </span>
              )}
              <span className="num">{short(address)}</span>
              {prof?.x && (
                <a href={`https://x.com/${prof.x}`} target="_blank" rel="noreferrer" className="hover:text-bone">
                  @{prof.x}
                </a>
              )}
              <a href={pmProfile(address)} target="_blank" rel="noreferrer" className="text-aqua hover:text-bone">
                View on Polymarket ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {PERIODS.map((p, i) => {
            const s = stands[i];
            return (
              <div key={p.id} className={p.id === "all" ? "col-span-2" : ""}>
                <Tilt className="group h-full rounded-[24px]">
                  <div className={`h-full rounded-[24px] px-6 py-6 ${p.id === "all" ? "bg-aqua text-ink" : "glass"}`}>
                    <div className={`text-[13px] ${p.id === "all" ? "text-ink/70" : "text-mute"}`}>{p.label} profit</div>
                    <div className={`num mt-3 font-semibold ${p.id === "all" ? "text-[44px]" : "text-[30px]"} ${p.id === "all" ? "" : !s ? "text-mute" : s.pnl >= 0 ? "text-up" : "text-down"}`}>
                      {s ? (
                        <>
                          {s.pnl >= 0 ? "+" : "−"}
                          <CountUp value={Math.abs(s.pnl)} format="usd" />
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                    <div className={`num mt-2 text-[12.5px] ${p.id === "all" ? "text-ink/70" : "text-mute"}`}>
                      {s?.rankPnl ? <span className={p.id === "all" ? "font-semibold text-ink" : "text-bone"}>#{s.rankPnl.toLocaleString()}</span> : "Unranked"} · {s ? usd(s.volume) : "—"} vol
                    </div>
                  </div>
                </Tilt>
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
            <div className="glass rounded-[24px] px-6 py-5">
              <div className="text-[13px] text-mute">Where they play</div>
              <div className="mt-4 flex h-3 gap-1 overflow-hidden rounded-full">
                {mixRows.map(([k, v], i) => (
                  <span key={k} className="bar-in rounded-full" style={{ width: `${(v / mixTotal) * 100}%`, background: MIX[i], animationDelay: `${i * 120}ms` }} />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13.5px]">
                {mixRows.map(([k, v], i) => (
                  <span key={k} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: MIX[i] }} />
                    {k} <span className="num text-mute">{Math.round((v / mixTotal) * 100)}%</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-20 grid gap-12 lg:grid-cols-2">
          <section>
            <div>
              <h2 className="display text-[clamp(34px,4vw,52px)]">
                Holding <b>now</b>
              </h2>
            </div>
            <div className="mt-6 grid gap-3">
              {pos.length === 0 && <div className="glass rounded-[24px] px-6 py-12 text-center text-mute">No open positions right now.</div>}
              {pos.map((p, i) => (
                <div key={`${p.conditionId}-${p.outcome}`} className="row-in glass group rounded-[22px] px-5 py-4" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start justify-between gap-4">
                    <a href={pmMarket(p.eventSlug, p.slug)} target="_blank" rel="noreferrer" className="min-w-0 text-[14.5px] font-medium leading-snug group-hover:text-aqua">
                      {p.title}
                    </a>
                    <span className="num shrink-0 text-[16px] font-semibold">{usd(p.value)}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="rounded-md bg-aqua/15 px-2 py-0.5 text-[12px] font-semibold text-aqua">{p.outcome}</span>
                    <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-charcoal">
                      <span className="bar-in absolute inset-y-0 left-0 rounded-full bg-aqua/70" style={{ width: `${Math.min(100, p.curPrice * 100)}%` }} />
                      <span className="absolute inset-y-0 w-0.5 bg-bone/80" style={{ left: `${Math.min(100, p.avgPrice * 100)}%` }} />
                    </span>
                    <span className="num text-[12.5px] text-mute">
                      {cents(p.avgPrice)} → {cents(p.curPrice)}
                    </span>
                    <span className={`num text-[12.5px] font-semibold ${p.pnl >= 0 ? "text-up" : "text-down"}`}>{usd(p.pnl, { sign: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div>
              <h2 className="display text-[clamp(34px,4vw,52px)]">
                Recent <b>moves</b>
              </h2>
            </div>
            <ol className="relative mt-6 border-l border-line pl-6">
              {trades.length === 0 && <li className="glass rounded-[24px] px-6 py-12 text-center text-mute">No recent trades.</li>}
              {trades.slice(0, 25).map((t, i) => (
                <li key={t.id} className="row-in relative pb-5" style={{ animationDelay: `${i * 40}ms` }}>
                  <span className={`absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-ink ${t.side === "BUY" ? "bg-aqua" : "bg-down"}`} />
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[14px] leading-snug">{t.title}</div>
                      <div className="mt-1 text-[12.5px] text-mute">
                        <span className={t.side === "BUY" ? "text-up" : "text-down"}>{t.side === "BUY" ? "Bought" : "Sold"}</span> {t.outcome} @{" "}
                        <span className="num">{cents(t.price)}</span> · {ago(t.ts)} ago
                      </div>
                    </div>
                    <span className="num shrink-0 text-[15px] font-semibold">{usd(t.usd)}</span>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/live" className="mt-2 inline-block text-[13px] text-aqua hover:text-bone">
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
      <div className="glass rounded-[24px] px-6 py-5">
        <div className="text-[13px] text-mute">{label}</div>
        <div className={`num mt-2.5 text-[26px] font-semibold ${tone === "up" ? "text-up" : tone === "down" ? "text-down" : ""}`}>{value}</div>
        {sub && <div className="mt-1 truncate text-[12.5px] text-mute">{sub}</div>}
      </div>
    </div>
  );
}
