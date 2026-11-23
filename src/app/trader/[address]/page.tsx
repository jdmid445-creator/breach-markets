import Link from "next/link";
import { notFound } from "next/navigation";
import { positions, profile, standing, userTrades, short, type Period } from "@/lib/pm";
import { usd, cents, ago, pmMarket, pmProfile } from "@/lib/format";
import { bucketLabel } from "@/lib/sports";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

const PERIODS: { id: Period; label: string }[] = [
  { id: "day", label: "24H" },
  { id: "week", label: "7D" },
  { id: "month", label: "30D" },
  { id: "all", label: "All time" },
];

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

  const name = prof?.name || trades[0]?.name || short(address);
  const image = prof?.image || trades[0]?.image;
  const openValue = pos.reduce((s, p) => s + p.value, 0);
  const openPnl = pos.reduce((s, p) => s + p.pnl, 0);
  const bets = trades.filter((t) => t.side === "BUY");
  const biggest = [...trades].sort((a, b) => b.usd - a.usd)[0];

  // What this wallet trades most, by money
  const mix = new Map<string, number>();
  for (const t of trades) mix.set(bucketLabel(t.bucket), (mix.get(bucketLabel(t.bucket)) ?? 0) + t.usd);
  const mixTotal = [...mix.values()].reduce((a, b) => a + b, 0) || 1;
  const mixRows = [...mix.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="mx-auto max-w-[1100px] px-5 pt-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-5">
          <Avatar src={image} seed={address} size={76} />
          <div className="min-w-0">
            <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-royal-soft">Whale profile</p>
            <h1 className="display mt-2 truncate text-[clamp(40px,6vw,68px)]">{name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-mute">
              <span className="num">{short(address)}</span>
              {prof?.x && (
                <a href={`https://x.com/${prof.x}`} target="_blank" rel="noreferrer" className="hover:text-bone">
                  @{prof.x}
                </a>
              )}
              <a href={pmProfile(address)} target="_blank" rel="noreferrer" className="text-royal-soft hover:text-bone">
                View on Polymarket ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Profit by window */}
      <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border hairline bg-line lg:grid-cols-4">
        {PERIODS.map((p, i) => {
          const s = stands[i];
          return (
            <div key={p.id} className="bg-coal px-5 py-5">
              <div className="text-[12px] uppercase tracking-[0.14em] text-mute">{p.label} profit</div>
              <div className={`num mt-2 text-[26px] font-semibold ${!s ? "text-mute" : s.pnl >= 0 ? "text-up" : "text-down"}`}>
                {s ? usd(s.pnl, { sign: true }) : "—"}
              </div>
              <div className="num mt-1 text-[12px] text-mute">
                {s?.rankPnl ? `Rank #${s.rankPnl.toLocaleString()}` : "Unranked"} · {s ? usd(s.volume) : "—"} vol
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Open positions" value={usd(openValue)} sub={`${pos.length} markets`} />
        <Stat
          label="Unrealized P&L"
          value={usd(openPnl, { sign: true })}
          tone={openPnl >= 0 ? "up" : "down"}
          sub="on current holdings"
        />
        <Stat
          label="Biggest recent bet"
          value={biggest ? usd(biggest.usd) : "—"}
          sub={biggest ? biggest.title : "No recent trades"}
        />
      </div>

      {mixRows.length > 0 && (
        <div className="mt-4 rounded-2xl border hairline bg-coal px-5 py-4">
          <div className="text-[12px] uppercase tracking-[0.14em] text-mute">Where they play (recent)</div>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-charcoal">
            {mixRows.map(([k, v], i) => (
              <span
                key={k}
                style={{ width: `${(v / mixTotal) * 100}%`, background: ["#105BFF", "#6f98ff", "#3a4466", "#fe8500"][i] }}
              />
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
            {mixRows.map(([k, v], i) => (
              <span key={k} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: ["#105BFF", "#6f98ff", "#3a4466", "#fe8500"][i] }} />
                {k} <span className="num text-mute">{Math.round((v / mixTotal) * 100)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="display text-[34px]">Holding now</h2>
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border hairline bg-coal">
            {pos.length === 0 && <li className="px-5 py-10 text-center text-mute">No open positions found.</li>}
            {pos.map((p) => (
              <li key={`${p.conditionId}-${p.outcome}`} className="px-5 py-3.5">
                <a href={pmMarket(p.eventSlug, p.slug)} target="_blank" rel="noreferrer" className="block truncate text-[14px] font-medium hover:text-royal-soft">
                  {p.title}
                </a>
                <div className="num mt-1 flex flex-wrap items-center gap-x-3 text-[12.5px] text-mute">
                  <span className="rounded bg-charcoal px-1.5 py-0.5 text-bone">{p.outcome}</span>
                  <span>avg {cents(p.avgPrice)} → {cents(p.curPrice)}</span>
                  <span className="ml-auto text-[14px] text-bone">{usd(p.value)}</span>
                  <span className={p.pnl >= 0 ? "text-up" : "text-down"}>{usd(p.pnl, { sign: true })}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="display text-[34px]">Recent moves</h2>
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border hairline bg-coal">
            {trades.length === 0 && <li className="px-5 py-10 text-center text-mute">No recent trades.</li>}
            {trades.slice(0, 25).map((t) => (
              <li key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px]">{t.title}</div>
                  <div className="mt-1 text-[12.5px] text-mute">
                    <span className={t.side === "BUY" ? "text-up" : "text-down"}>{t.side === "BUY" ? "Bought" : "Sold"}</span>{" "}
                    {t.outcome} @ <span className="num">{cents(t.price)}</span> · {ago(t.ts)} ago
                  </div>
                </div>
                <span className="num text-[15px] font-semibold">{usd(t.usd)}</span>
              </li>
            ))}
          </ul>
          {bets.length > 0 && (
            <p className="mt-3 text-[12.5px] text-mute">
              {bets.length} buys in the last {trades.length} trades.{" "}
              <Link href="/live" className="text-royal-soft hover:text-bone">
                Watch the live feed →
              </Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-2xl border hairline bg-coal px-5 py-4">
      <div className="text-[12px] uppercase tracking-[0.14em] text-mute">{label}</div>
      <div className={`num mt-2 text-[22px] font-semibold ${tone === "up" ? "text-up" : tone === "down" ? "text-down" : ""}`}>{value}</div>
      {sub && <div className="mt-1 truncate text-[12.5px] text-mute">{sub}</div>}
    </div>
  );
}
