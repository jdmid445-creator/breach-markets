import Link from "next/link";
import { bigTrades, leaderboard } from "@/lib/pm";
import { usd } from "@/lib/format";
import { WhaleFeed } from "@/components/WhaleFeed";
import { Avatar } from "@/components/Avatar";
import { HeroMedia } from "@/components/HeroMedia";
import type { Trader, Trade } from "@/lib/pm";
import { Reveal, CountUp, SonarCursor, Headline } from "@/components/fx";
import { BubblePool } from "@/components/BubblePool";

export const revalidate = 30;

export default async function Home() {
  const [feed, overall, politics, sports] = await Promise.all([
    bigTrades(10_000, 60, 10),
    leaderboard({ period: "day", category: "overall", sort: "PNL", limit: 5 }),
    leaderboard({ period: "week", category: "politics", sort: "PNL", limit: 5 }),
    leaderboard({ period: "week", category: "sports", sort: "PNL", limit: 5 }),
  ]);
  const trades = feed ?? [];
  const since = Date.now() / 1000 - 86400;
  const today = trades.filter((t) => t.ts >= since);
  const biggest = [...trades].sort((a, b) => b.usd - a.usd)[0];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b hairline">
        <HeroMedia />
        <SonarCursor />
        <div className="relative mx-auto max-w-[1240px] px-5 pb-20 pt-20 sm:pt-28">
          <p className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.18em] text-royal-soft">
            <span className="live-dot" /> Polymarket whale tracker
          </p>
          <Headline
            className="display mt-5 text-[clamp(64px,13vw,188px)]"
            lines={[
              [{ text: "See" }, { text: "the" }, { text: "whales" }],
              [{ text: "before", accent: true }, { text: "the" }, { text: "market" }],
            ]}
          />
          <p className="mt-7 max-w-[520px] text-[17px] leading-relaxed text-mute">
            Every $10K+ bet the moment it lands. The sharpest traders ranked by category, sport and hour. And what the top wallets are holding right now.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/live" className="rounded-full bg-tang px-6 py-3 text-[15px] font-semibold text-ink transition-transform hover:-translate-y-0.5">
              Watch whales live
            </Link>
            <Link href="/leaderboard" className="rounded-full border hairline bg-coal/70 px-6 py-3 text-[15px] font-semibold backdrop-blur hover:border-bone">
              Leaderboards
            </Link>
          </div>

          <dl className="mt-16 grid max-w-[720px] grid-cols-3 gap-6 border-t hairline pt-6">
            <Stat k="Latest whale bets" v={<CountUp value={trades.length} format="int" />} />
            <Stat k="Moved in those bets" v={<CountUp value={today.reduce((s, t) => s + t.usd, 0)} format="usd" />} />
            <Stat k="Biggest recent bet" v={biggest ? <CountUp value={biggest.usd} format="usd" /> : "—"} />
          </dl>
        </div>
      </section>

      <Tape trades={trades} />

      {/* Pool */}
      <section className="mx-auto max-w-[1240px] px-5 pt-20">
        <Reveal>
          <SectionHead kicker="The pool" title="Every bubble is a bet" href="/live" cta="Live feed" />
        </Reveal>
        <Reveal delay={120} className="mt-6">
          <BubblePool trades={trades} height={460} />
        </Reveal>
      </section>

      {/* Live tape */}
      <section className="mx-auto max-w-[1240px] px-5 pt-20">
        <Reveal>
          <SectionHead kicker="Live" title="Surfacing now" href="/live" cta="Open full feed" />
        </Reveal>
        <Reveal delay={120} className="mt-6">
          <WhaleFeed initial={trades} compact limit={8} />
        </Reveal>
      </section>

      {/* Boards */}
      <section className="mx-auto max-w-[1240px] px-5 pt-24">
        <Reveal>
          <SectionHead kicker="Leaderboards" title="Who’s printing" href="/leaderboard" cta="All boards" />
        </Reveal>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Reveal delay={0}><MiniBoard title="Today, overall" rows={overall} href="/leaderboard?cat=overall&w=day" /></Reveal>
          <Reveal delay={120}><MiniBoard title="This week, politics" rows={politics} href="/leaderboard?cat=politics&w=week" /></Reveal>
          <Reveal delay={240}><MiniBoard title="This week, sports" rows={sports} href="/leaderboard?cat=sports&w=week" /></Reveal>
        </div>
      </section>

      {/* Smart money teaser */}
      <Reveal className="mx-auto max-w-[1240px] px-5 pt-24">
        <Link
          href="/smart-money"
          className="group relative block overflow-hidden rounded-3xl border hairline bg-royal px-8 py-14 sm:px-14"
        >
          <div className="contours drift absolute -inset-[8%] opacity-60 mix-blend-screen" aria-hidden />
          <p className="relative text-[13px] font-medium uppercase tracking-[0.18em] text-white/70">Smart money</p>
          <h2 className="display relative mt-4 max-w-[900px] text-[clamp(44px,7vw,96px)] text-white">
            When the top 30 stack the same side, you’ll know
          </h2>
          <span className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-bone transition-transform group-hover:translate-x-1">
            See where the pod is swimming →
          </span>
        </Link>
      </Reveal>
    </>
  );
}

function Stat({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] uppercase tracking-[0.14em] text-mute">{k}</dt>
      <dd className="num mt-2 text-[clamp(20px,3vw,30px)] font-semibold">{v}</dd>
    </div>
  );
}

function SectionHead({ kicker, title, href, cta }: { kicker: string; title: string; href: string; cta: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-royal-soft">{kicker}</p>
        <h2 className="display mt-2 text-[clamp(40px,6vw,72px)]">{title}</h2>
      </div>
      <Link href={href} className="shrink-0 text-[14px] text-mute hover:text-bone">
        {cta} →
      </Link>
    </div>
  );
}

function MiniBoard({ title, rows, href }: { title: string; rows: Trader[] | null; href: string }) {
  return (
    <div className="rounded-2xl border hairline bg-coal">
      <div className="flex items-center justify-between border-b hairline px-5 py-3.5">
        <h3 className="font-semibold">{title}</h3>
        <Link href={href} className="text-[13px] text-mute hover:text-bone">
          Top 100 →
        </Link>
      </div>
      <ol>
        {(rows ?? []).length === 0 && <li className="px-5 py-10 text-center text-[14px] text-mute">No data yet.</li>}
        {(rows ?? []).map((t, i) => (
          <li key={t.address} className="border-b hairline last:border-0">
            <Link href={`/trader/${t.address}`} className="lift flex items-center gap-3 px-5 py-3 hover:bg-charcoal/60">
              <span className={`num w-5 text-[14px] ${i === 0 ? "font-bold text-tang" : "text-mute"}`}>{i + 1}</span>
              <Avatar src={t.image} seed={t.address} size={30} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{t.name}</span>
              <span className={`num text-[14px] font-semibold ${t.pnl >= 0 ? "text-up" : "text-down"}`}>{usd(t.pnl, { sign: true })}</span>
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
        <Link key={`${k}-${t.id}`} href={`/trader/${t.wallet}`} className="flex items-center gap-2 whitespace-nowrap px-6 text-[13.5px] hover:text-royal-soft">
          <span className={t.side === "BUY" ? "text-up" : "text-down"}>{t.side === "BUY" ? "▲" : "▼"}</span>
          <span className="num font-semibold">{usd(t.usd)}</span>
          <span className="text-mute">{t.outcome}</span>
          <span className="max-w-[28ch] truncate text-mute">{t.title}</span>
        </Link>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-b hairline bg-coal py-3.5" aria-label="Recent whale bets">
      <div className="marquee flex w-max">{row("a")}{row("b")}</div>
    </div>
  );
}
