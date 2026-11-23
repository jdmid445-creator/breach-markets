import Link from "next/link";
import { bigTrades, leaderboard } from "@/lib/pm";
import type { Trader, Trade } from "@/lib/pm";
import { usd } from "@/lib/format";
import { WhaleFeed } from "@/components/WhaleFeed";
import { Avatar } from "@/components/Avatar";
import { BubblePool } from "@/components/BubblePool";
import { ScrollIntro } from "@/components/ScrollIntro";
import { Magnetic } from "@/components/fx";
import { WaterConsole } from "@/components/WaterConsole";
import { Particles } from "@/components/Particles";
import { podConsensus } from "@/lib/smart";

export const revalidate = 30;

export default async function Home() {
  const [feed, overall, politics, sports, weekly, pod] = await Promise.all([
    bigTrades(10_000, 60, 10),
    leaderboard({ period: "day", category: "overall", sort: "PNL", limit: 5 }),
    leaderboard({ period: "week", category: "politics", sort: "PNL", limit: 5 }),
    leaderboard({ period: "week", category: "sports", sort: "PNL", limit: 5 }),
    leaderboard({ period: "week", category: "overall", sort: "PNL", limit: 6 }),
    podConsensus(15).catch(() => []),
  ]);
  const trades = feed ?? [];

  return (
    <>
      <ScrollIntro />

      <Tape trades={trades} />

      {/* Scene 1: scroll-stacking console (MotionSites Nimbus pattern, live data) */}
      <WaterConsole trades={trades} leaders={weekly ?? []} pod={pod} />

      {/* Scene 2 (deep): the pool + live feed */}
      <section className="surface-dive relative overflow-hidden pt-36">
        <div className="caustics pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(180deg,transparent_0%,transparent_14%,#000_30%)]" aria-hidden />
        <Particles density={45} />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-aqua">The pool</p>
            <h2 className="display mt-4 text-[clamp(44px,7vw,104px)]">
              Every bubble is <b>a bet</b>
            </h2>
            <p className="mt-4 max-w-[520px] text-[16px] leading-relaxed text-mute">
              Size is dollars. Filled bubbles are buys, hollow ones are sells, and anything over $250K glows pink. Hover to read it, click to follow the wallet.
            </p>
          </div>
          <div className="mt-10">
            <BubblePool trades={trades} height={500} />
          </div>

          <div className="mt-28 flex items-end justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-aqua">Live</p>
              <h2 className="display mt-4 text-[clamp(40px,6vw,84px)]">Surfacing <b>now</b></h2>
            </div>
            <Magnetic>
              <Link href="/live" className="rounded-full border border-aqua/40 px-5 py-2.5 text-[14px] text-aqua hover:bg-aqua hover:text-ink">
                Full feed →
              </Link>
            </Magnetic>
          </div>
          <div className="mt-8 pb-28">
            <WhaleFeed initial={trades} compact limit={8} />
          </div>
        </div>
      </section>

      {/* Scene 3 (light): boards */}
      <section className="scene-light">
        <div className="mx-auto max-w-[1240px] px-5 py-28">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-[#2b8f86]">Leaderboards</p>
              <h2 className="display mt-4 text-[clamp(44px,7vw,104px)]">Who’s printing</h2>
            </div>
            <Magnetic>
              <Link href="/leaderboard" className="rounded-full bg-abyss px-5 py-2.5 text-[14px] font-semibold text-bone">
                All boards →
              </Link>
            </Magnetic>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            <div><MiniBoard title="Today · overall" rows={overall} href="/leaderboard?cat=overall&w=day" /></div>
            <div><MiniBoard title="This week · politics" rows={politics} href="/leaderboard?cat=politics&w=week" /></div>
            <div><MiniBoard title="This week · sports" rows={sports} href="/leaderboard?cat=sports&w=week" /></div>
          </div>
        </div>
      </section>

      {/* Scene 4: smart money */}
      <section className="relative overflow-hidden bg-abyss">
        <div className="caustics absolute inset-0 opacity-60" aria-hidden />
        <div className="contours drift absolute -inset-[8%] opacity-70" aria-hidden />
        <div className="relative mx-auto max-w-[1240px] px-5 py-32 text-center">
          <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-aqua">Smart money</p>
          <h2 className="display mx-auto mt-5 max-w-[1000px] text-[clamp(40px,6.4vw,92px)] !leading-[0.98]">When the top 30 swim the same way, you’ll see it first</h2>
          <Magnetic className="mt-12">
            <Link href="/smart-money" className="inline-flex rounded-full bg-aqua px-8 py-4 text-[16px] font-semibold text-ink">
              Follow the pod →
            </Link>
          </Magnetic>
        </div>
      </section>
    </>
  );
}

function MiniBoard({ title, rows, href }: { title: string; rows: Trader[] | null; href: string }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#cfdedd] bg-white shadow-[0_20px_60px_-35px_rgba(23,31,68,.4)]">
      <div className="flex items-center justify-between border-b border-[#e3ecec] px-6 py-4">
        <h3 className="font-semibold">{title}</h3>
        <Link href={href} className="text-[13px] text-[#56608a] hover:text-abyss">Top 100 →</Link>
      </div>
      <ol>
        {(rows ?? []).length === 0 && <li className="px-6 py-10 text-center text-[14px] text-[#56608a]">No data yet.</li>}
        {(rows ?? []).map((t, i) => (
          <li key={t.address} className="border-b border-[#eef3f3] last:border-0">
            <Link href={`/trader/${t.address}`} className="lift flex items-center gap-3 px-6 py-3.5 hover:bg-[#f2f8f8]">
              <span className={`num w-5 text-[14px] ${i === 0 ? "font-bold text-[#d94fae]" : "text-[#8a93b5]"}`}>{i + 1}</span>
              <Avatar src={t.image} seed={t.address} size={30} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{t.name}</span>
              <span className={`num text-[14px] font-semibold ${t.pnl >= 0 ? "text-[#1d8f80]" : "text-[#d4553f]"}`}>{usd(t.pnl, { sign: true })}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Tape({ trades }: { trades: Trade[] }) {
  if (!trades.length) return null;
  const items = trades.slice(0, 24);
  const row = (k: string) => (
    <div key={k} className="flex shrink-0 items-center">
      {items.map((t) => (
        <Link key={`${k}-${t.id}`} href={`/trader/${t.wallet}`} className="flex items-center gap-2 whitespace-nowrap px-6 text-[13.5px] hover:text-aqua">
          <span className={t.side === "BUY" ? "text-up" : "text-down"}>{t.side === "BUY" ? "▲" : "▼"}</span>
          <span className="num font-semibold">{usd(t.usd)}</span>
          <span className="text-mute">{t.outcome}</span>
          <span className="max-w-[28ch] truncate text-mute">{t.title}</span>
        </Link>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-y hairline bg-coal py-4" aria-label="Recent whale bets">
      <div className="marquee flex w-max">{row("a")}{row("b")}</div>
    </div>
  );
}
