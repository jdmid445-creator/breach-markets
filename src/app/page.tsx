import Link from "next/link";
import { bigTrades, leaderboard } from "@/lib/pm";
import type { Trader, Trade } from "@/lib/pm";
import { usd, cents } from "@/lib/format";
import { WhaleFeed } from "@/components/WhaleFeed";
import { ScrollIntro } from "@/components/ScrollIntro";
import { Panel } from "@/components/term/Panel";
import { Radar } from "@/components/term/Radar";
import { podConsensus } from "@/lib/smart";
import { bucketLabel } from "@/lib/sports";

export const revalidate = 30;

export default async function Home() {
  const [feed, weekly, politics, sports, pod] = await Promise.all([
    bigTrades(10_000, 60, 10),
    leaderboard({ period: "week", category: "overall", sort: "PNL", limit: 8 }),
    leaderboard({ period: "week", category: "politics", sort: "PNL", limit: 6 }),
    leaderboard({ period: "week", category: "sports", sort: "PNL", limit: 6 }),
    podConsensus(15).catch(() => []),
  ]);
  const trades = feed ?? [];
  const mix = new Map<string, number>();
  for (const t of trades) mix.set(bucketLabel(t.bucket), (mix.get(bucketLabel(t.bucket)) ?? 0) + t.usd);
  const mixRows = [...mix.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const mixTotal = mixRows.reduce((s, [, v]) => s + v, 0) || 1;
  const MIX = ["#cd8117", "#e8e4d6", "#7d8a3a", "#a29d86", "#4f5530"];

  return (
    <>
      <ScrollIntro />
      {/* surfacing seam: the night water hands off to the desk */}
      <div aria-hidden className="h-24 bg-[linear-gradient(180deg,#0a0f26,#0e0e10)]" />

      <Tape trades={trades} />

      <div className="mx-auto max-w-[1440px] px-5 pt-16">
        <div className="grid items-end gap-6 border-b border-t-line pb-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="t-mono text-[12px] text-t-dim">breach / desk</p>
            <h2 className="t-head mt-4 text-[clamp(44px,7vw,108px)] text-t-text">
              The whale <span className="text-t-amber">desk</span>
            </h2>
          </div>
          <p className="max-w-[420px] text-[15px] leading-relaxed text-t-dim">
            Every big Polymarket bet, who placed it and how good they are. Press <Kbd>A</Kbd> for alerts, <Kbd>L</Kbd> for boards, <Kbd>⌘K</Kbd> to find any trader.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          <Panel code="01" title="Whale tape" meta="$10K+ · live" live href="/live" hrefLabel="alerts" className="lg:col-span-7 lg:row-span-2" bodyClass="max-h-[760px] overflow-y-auto">
            <WhaleFeed initial={trades} compact limit={18} />
          </Panel>

          <Panel code="02" title="Sonar" meta="last 40 bets" className="lg:col-span-5" bodyClass="p-4">
            <Radar trades={trades} size={440} />
          </Panel>

          <Panel code="03" title="Where the money is" meta="by market type" className="lg:col-span-5" bodyClass="p-4">
            <div className="flex h-3 w-full overflow-hidden">
              {mixRows.map(([k, v], i) => (
                <span key={k} className="bar-in h-full" style={{ width: `${(v / mixTotal) * 100}%`, background: MIX[i], animationDelay: `${i * 90}ms` }} />
              ))}
            </div>
            <ul className="t-mono mt-4 grid gap-1.5 text-[12.5px]">
              {mixRows.map(([k, v], i) => (
                <li key={k} className="flex items-center gap-3">
                  <span className="h-2 w-2" style={{ background: MIX[i] }} />
                  <span className="text-t-text">{k}</span>
                  <span className="ml-auto text-t-dim">{usd(v)}</span>
                  <span className="w-10 text-right text-t-text">{Math.round((v / mixTotal) * 100)}%</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel code="04" title="Top profit · 7d" href="/leaderboard?w=week" hrefLabel="top 100" className="lg:col-span-4">
            <Board rows={weekly} />
          </Panel>
          <Panel code="05" title="Politics · 7d" href="/leaderboard?cat=politics&w=week" hrefLabel="board" className="lg:col-span-4">
            <Board rows={politics} />
          </Panel>
          <Panel code="06" title="Sports · 7d" href="/leaderboard?cat=sports&w=week" hrefLabel="board" className="lg:col-span-4">
            <Board rows={sports} />
          </Panel>

          <Panel code="07" title="Smart money consensus" meta="top 15 traders this month, shared positions" href="/smart-money" hrefLabel="all" className="lg:col-span-12">
            <div className="t-mono grid grid-cols-[40px_1fr_160px_120px_80px] gap-4 border-b border-t-line px-4 py-2 text-[11px] text-t-dim max-md:grid-cols-[1fr_80px]">
              <span className="max-md:hidden">#</span>
              <span>market · side</span>
              <span className="max-md:hidden">agreement</span>
              <span className="text-right max-md:hidden">combined</span>
              <span className="text-right">wallets</span>
            </div>
            {pod.length === 0 && <div className="t-mono px-4 py-8 text-[13px] text-t-dim">No shared positions right now.</div>}
            {pod.slice(0, 6).map((p, i) => (
              <div key={`${p.title}-${p.outcome}`} className="t-row grid grid-cols-[40px_1fr_160px_120px_80px] items-center gap-4 border-b border-t-line px-4 py-3 last:border-0 max-md:grid-cols-[1fr_80px]">
                <span className="t-mono text-[12px] text-t-dim max-md:hidden">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] text-t-text">{p.title}</span>
                  <span className="t-mono text-[12px] text-t-amber">{p.outcome}</span>
                </span>
                <span className="flex gap-[3px] max-md:hidden">
                  {Array.from({ length: Math.min(p.whales, 15) }, (_, j) => (
                    <span key={j} className="row-in h-3 w-[5px] bg-t-amber" style={{ animationDelay: `${i * 80 + j * 30}ms` }} />
                  ))}
                </span>
                <span className="t-mono text-right text-[13px] text-t-text max-md:hidden">{usd(p.value)}</span>
                <span className="t-mono text-right text-[13px] text-t-text">{p.whales}</span>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </>
  );
}


function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="t-mono rounded-[3px] border border-t-line px-1 text-[11px] text-t-text">{children}</kbd>;
}

function Board({ rows }: { rows: Trader[] | null }) {
  const list = rows ?? [];
  const max = Math.max(...list.map((r) => Math.abs(r.pnl)), 1);
  if (!list.length) return <div className="t-mono px-4 py-8 text-[13px] text-t-dim">No data.</div>;
  return (
    <ol>
      {list.map((t, i) => (
        <li key={t.address} className="border-b border-t-line last:border-0">
          <Link href={`/trader/${t.address}`} className="t-row grid grid-cols-[26px_1fr_84px] items-center gap-3 px-4 py-2.5">
            <span className={`t-mono text-[12px] ${i === 0 ? "text-t-amber" : "text-t-dim"}`}>{String(i + 1).padStart(2, "0")}</span>
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] text-t-text">{t.name}</span>
              <span className="mt-1 block h-[2px] bg-t-line">
                <span className="bar-in block h-full bg-t-amber/80" style={{ width: `${(Math.abs(t.pnl) / max) * 100}%`, animationDelay: `${i * 60}ms` }} />
              </span>
            </span>
            <span className={`t-mono text-right text-[13px] ${t.pnl >= 0 ? "text-t-up" : "text-t-down"}`}>{usd(t.pnl, { sign: true })}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

function Tape({ trades }: { trades: Trade[] }) {
  if (!trades.length) return null;
  const items = trades.slice(0, 24);
  const row = (k: string) => (
    <div key={k} className="flex shrink-0 items-center">
      {items.map((t) => (
        <Link key={`${k}-${t.id}`} href={`/trader/${t.wallet}`} className="t-mono flex items-center gap-2 whitespace-nowrap border-r border-t-line px-5 text-[12.5px] hover:text-t-amber">
          {t.rank ? <span className="font-semibold text-t-amber">#{t.rank}</span> : null}
          <span className={t.side === "BUY" ? "text-t-up" : "text-t-down"}>{t.side === "BUY" ? "▲" : "▼"}</span>
          <span className="font-semibold text-t-text">{usd(t.usd)}</span>
          <span className="text-t-dim">
            {t.outcome} @{cents(t.price)}
          </span>
          <span className="max-w-[26ch] truncate text-t-dim">{t.title}</span>
        </Link>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-y border-t-line bg-t-panel py-2.5" aria-label="Recent whale bets">
      <div className="marquee flex w-max">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
