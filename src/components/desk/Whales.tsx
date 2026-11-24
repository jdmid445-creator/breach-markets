"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { Bell, BellRing, Pause, Play, ArrowUpRight } from "lucide-react";
import type { Trade } from "@/lib/pm";
import { usd, cents, ago, tier, pmMarket } from "@/lib/format";
import { bucketLabel, isSport } from "@/lib/sports";
import { useWhales, useNow } from "@/lib/useWhales";
import { Sea } from "@/components/fx/Sea";
import { MarketIcon, RankChip, Empty, Side } from "./ui";
import { Counter } from "@/components/fx/motion";
import { ScrollZoom } from "@/components/fx/scroll";

const MARKETS = [
  { id: "all", label: "All" },
  { id: "sports", label: "Sports" },
  { id: "politics", label: "Politics" },
  { id: "crypto", label: "Crypto" },
  { id: "other", label: "Other" },
] as const;
type MarketId = (typeof MARKETS)[number]["id"];
const SIZES = [10_000, 25_000, 50_000, 100_000, 250_000];

/* ---------------- Home: live row (chart + latest list) ---------------- */

export function HomeLive({ initial }: { initial: Trade[] }) {
  const { trades, fresh, status } = useWhales(initial);
  const now = useNow(5000);
  const hour = now ? trades.filter((t) => t.ts >= now - 3600) : trades;
  const total = hour.reduce((s, t) => s + t.usd, 0);
  const ranked = hour.filter((t) => t.rank !== null).length;

  return (
    <section>
      <ScrollZoom className="relative border border-hair-2 bg-shoal/30 max-sm:flex max-sm:flex-col-reverse">
        <Sea trades={trades} fresh={fresh} height={780} />
        {/* phones: the figures sit above the sea, not on top of it */}
        <div className="pointer-events-none flex flex-wrap items-start justify-between gap-3 max-sm:p-4 max-sm:pb-0 sm:absolute sm:left-5 sm:right-5 sm:top-5 sm:gap-4">
          <p className="flex items-center gap-2 rounded-full border border-hair-2 bg-sea/70 px-3 py-1.5 text-[13px] text-mist backdrop-blur-md">
            {status === "live" && <span className="live-dot" />}
            Last 60 whale bets, newest in the middle
          </p>
          <dl className="grid grid-cols-3 gap-x-6 rounded-2xl border border-hair-2 bg-sea/70 px-5 py-3 backdrop-blur-md max-sm:w-full">
            <Stat label="Bets, last hour" value={<Counter value={hour.length} format="int" />} />
            <Stat label="Money moved" value={<Counter value={total} />} />
            <Stat label="Ranked traders" value={<Counter value={hour.length ? (ranked / hour.length) * 100 : 0} format="pct" />} />
          </dl>
        </div>
      </ScrollZoom>

      <div className="mt-16 flex items-end justify-between gap-6">
        <h3 className="title text-[clamp(26px,3vw,40px)] text-fg">Latest whales</h3>
        <Link href="/live" className="press group flex items-center gap-1.5 text-[14px] text-mist hover:text-fg">
          All alerts <ArrowUpRight size={15} className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="mt-5 grid gap-x-10 md:grid-cols-2">
        <WhaleList trades={trades.slice(0, 6)} fresh={fresh} now={now} />
        <div className="max-md:hidden">
          <WhaleList trades={trades.slice(6, 12)} fresh={fresh} now={now} />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-1 text-[12.5px] text-faint">{label}</dt>
      <dd className="text-[24px] font-semibold leading-none text-fg">{value}</dd>
    </div>
  );
}

/** Compact list: who, what, how much. */
export function WhaleList({ trades, fresh, now }: { trades: Trade[]; fresh?: Set<string>; now: number | null }) {
  if (!trades.length) return <Empty>No whale bets yet. New ones appear here within seconds.</Empty>;
  return (
    <ul>
      {trades.map((t) => {
        const ranked = t.rank !== null;
        const isNew = fresh?.has(t.id);
        return (
          <motion.li
            key={t.id}
            layout
            initial={isNew ? { opacity: 0, y: -18, scale: 0.97 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={`band ${isNew ? "row-wash" : ""}`}
          >
            <div className="spot grid grid-cols-[28px_1fr_auto] items-start gap-3 px-3 py-3 sm:px-4">
              <MarketIcon src={t.icon} label={t.title} size={28} />
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1.5">
                  {ranked && <RankChip rank={t.rank as number} />}
                  <Link href={`/trader/${t.wallet}`} className={`truncate text-[14px] hover:underline ${ranked ? "font-bold text-fg" : "text-mist"}`}>
                    {t.name}
                  </Link>
                </div>
                <div className="mt-0.5 truncate text-[13px] text-faint">
                  <Side side={t.side} />{" "}
                  <span className="text-mist">{t.outcome}</span> at <span className="fig">{cents(t.price)}</span> · {t.title}
                </div>
              </div>
              <div className="text-right">
                <div className={`fig text-[15px] font-semibold ${ranked ? "text-fg" : "text-mist"}`}>{usd(t.usd)}</div>
                <div className="fig mt-0.5 text-[12px] text-faint" suppressHydrationWarning>
                  {now ? ago(t.ts, now) : ""}
                </div>
              </div>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}

/* ---------------- /live: the full alerts desk ---------------- */

export function LiveDesk({ initial }: { initial: Trade[] }) {
  const [min, setMin] = useState(10_000);
  const [market, setMarket] = useState<MarketId>("all");
  const [side, setSide] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [rankedOnly, setRankedOnly] = useState(false);
  const [notify, setNotify] = useState(false);
  const [paused, setPaused] = useState(false);
  const [custom, setCustom] = useState("");
  const { trades, fresh, status } = useWhales(initial, { min, paused, notify });
  const now = useNow(1000);

  const shown = useMemo(
    () =>
      trades
        .filter((t) => t.usd >= min)
        .filter((t) => side === "ALL" || t.side === side)
        .filter((t) => !rankedOnly || t.rank !== null)
        .filter((t) => (market === "all" ? true : market === "sports" ? isSport(t.bucket) : t.bucket === market))
        .slice(0, 120),
    [trades, min, side, market, rankedOnly],
  );
  const total = shown.reduce((s, t) => s + t.usd, 0);
  const rankedCount = shown.filter((t) => t.rank).length;

  const applyCustom = () => {
    const raw = custom.trim();
    if (!raw) return;
    const n = Math.round(Number(raw.replace(/[^0-9.]/g, "")) * (/k$/i.test(raw) ? 1000 : /m$/i.test(raw) ? 1e6 : 1));
    if (n >= 1000) setMin(n);
  };

  return (
    <div className="mx-auto max-w-[1360px] px-5 md:px-8">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-3">
        <ButtonGroup label="Market" value={market} onChange={setMarket} options={MARKETS.map((m) => ({ value: m.id, label: m.label }))} />
        <ButtonGroup
          label="Side"
          value={side}
          onChange={setSide}
          options={[
            { value: "ALL", label: "Both" },
            { value: "BUY", label: "Buys" },
            { value: "SELL", label: "Sells" },
          ]}
        />
        <label className="flex items-center gap-2.5 text-[13px] text-faint">
          Minimum
          <select
            value={SIZES.includes(min) ? String(min) : "custom"}
            onChange={(e) => {
              if (e.target.value === "custom") return;
              setMin(Number(e.target.value));
              setCustom("");
            }}
            className="press h-8 rounded-md border border-hair bg-sea px-2 text-[13px] text-fg hover:border-hair-2"
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {usd(s)}
              </option>
            ))}
            {!SIZES.includes(min) && <option value="custom">{usd(min)}</option>}
          </select>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onBlur={applyCustom}
            onKeyDown={(e) => e.key === "Enter" && applyCustom()}
            placeholder="Custom, e.g. 75k"
            aria-label="Custom minimum bet size"
            className="h-8 w-[132px] rounded-md border border-hair bg-sea px-2.5 text-[13px] text-fg placeholder:text-faint hover:border-hair-2"
          />
        </label>
        <Switch on={rankedOnly} onChange={setRankedOnly}>
          Ranked traders only
        </Switch>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={async () => {
              if (!notify && typeof Notification !== "undefined" && Notification.permission !== "granted") {
                const p = await Notification.requestPermission();
                if (p !== "granted") return;
              }
              setNotify((v) => !v);
            }}
            aria-pressed={notify}
            className={`press flex h-8 items-center gap-2 rounded-md border px-3 text-[13px] ${notify ? "border-stone bg-stone/15 text-fg" : "border-hair text-mist hover:border-hair-2 hover:text-fg"}`}
          >
            {notify ? <BellRing size={15} /> : <Bell size={15} />}
            {notify ? "Notifications on" : "Notify me"}
          </button>
          <button
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            className="press flex h-8 items-center gap-2 rounded-md border border-hair px-3 text-[13px] text-mist hover:border-hair-2 hover:text-fg"
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-faint" aria-live="polite">
        <span className="flex items-center gap-2 text-mist">
          {status === "live" && !paused ? <span className="live-dot" /> : <span className="h-[7px] w-[7px] rounded-full bg-faint" />}
          {paused ? "Paused" : status === "live" ? "Live, updates every 5 seconds" : "Polymarket isn’t answering, retrying"}
        </span>
        <span className="fig">{shown.length} bets</span>
        <span className="fig">{usd(total)} total</span>
        <span className="fig">{rankedCount} from ranked traders</span>
      </p>

      <div className="mt-4 grid items-start gap-6 lg:grid-cols-2">
        <div className="overflow-x-auto">
          <WhaleTable trades={shown} fresh={fresh} now={now} />
        </div>
        <div className="max-lg:order-first lg:sticky lg:top-[108px]">
          <div className="tile overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3">
              {status === "live" && !paused && <span className="live-dot" />}
              <span className="text-[14.5px] font-semibold text-fg">The sea</span>
              <span className="text-[13px] text-faint max-sm:hidden">the bets on the left, as tails</span>
            </div>
            <Sea trades={shown} fresh={fresh} height={620} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function WhaleTable({ trades, fresh, now }: { trades: Trade[]; fresh?: Set<string>; now: number | null }) {
  if (!trades.length) return <Empty>No whale bets match these filters yet. Try a lower minimum or another market.</Empty>;
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="text-[12.5px] text-faint">
          <th className="w-[64px] px-3 py-2.5 sm:px-4 font-normal max-md:hidden">When</th>
          <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 font-normal">Trader and bet</th>
          
          <th className="px-3 py-2.5 sm:px-4 text-right font-normal">Size</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((t) => {
          const ranked = t.rank !== null;
          const tr = tier(t.usd);
          return (
            <motion.tr
              key={t.id}
              layout="position"
              initial={fresh?.has(t.id) ? { opacity: 0, y: -16 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className={`spot-row band ${fresh?.has(t.id) ? "row-wash" : ""}`}
            >
              <td className="fig px-3 py-3 sm:px-4 align-top text-[13px] text-faint max-md:hidden" suppressHydrationWarning>
                {now ? ago(t.ts, now) : ""}
              </td>
              <td className="w-full max-w-0 px-3 py-3 sm:px-4">
                <div className="flex min-w-0 items-start gap-3">
                  <MarketIcon src={t.icon} label={t.title} size={34} />
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      {ranked && <RankChip rank={t.rank as number} />}
                      <Link href={`/trader/${t.wallet}`} className={`truncate text-[14.5px] hover:underline ${ranked ? "font-bold text-fg" : "text-mist"}`}>
                        {t.name}
                      </Link>
                      <span className="text-[13.5px] text-faint">
                        <Side side={t.side} lower />{" "}
                        <span className="text-fg">{t.outcome || "?"}</span> at <span className="fig text-fg">{cents(t.price)}</span>
                      </span>
                    </div>
                    <a
                      href={pmMarket(t.eventSlug, t.slug)}
                      target="_blank"
                      rel="noreferrer"
                      className="group mt-1 flex items-center gap-1 text-[13px] text-mist hover:text-fg"
                    >
                      <span className="truncate">{t.title || "Unknown market"}</span>
                      <span className="shrink-0 text-faint">· {bucketLabel(t.bucket)}</span>
                      <ArrowUpRight size={13} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  </div>
                </div>
              </td>
              
              <td className="px-3 py-3 sm:px-4 text-right align-top">
                <div className={`fig text-[16px] font-semibold ${ranked ? "text-fg" : "text-mist"}`}>{usd(t.usd)}</div>
                {t.usd >= 50_000 && <div className="mt-0.5 whitespace-nowrap text-[12px] text-faint">{tr.label}</div>}
              </td>
            </motion.tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ---------------- controls ---------------- */

function ButtonGroup<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[13px] text-faint">{label}</span>
      <div role="group" aria-label={label} className="flex rounded-lg border border-hair bg-sea p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={`press rounded-md px-2.5 py-1 text-[13px] ${value === o.value ? "bg-stone-hi font-semibold text-sea" : "text-mist hover:text-fg"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Switch({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="press flex items-center gap-2.5 text-[13px] text-mist hover:text-fg">
      <span className={`relative h-[18px] w-[32px] rounded-full transition-colors duration-200 ${on ? "bg-stone-hi" : "bg-reef ring-1 ring-hair-2"}`}>
        <span
          className={`absolute left-0 top-[2px] h-[14px] w-[14px] rounded-full bg-fg shadow-[0_1px_2px_rgba(0,0,0,.3)] transition-transform duration-200 ease-[var(--ease-out)] ${on ? "translate-x-[16px]" : "translate-x-[2px]"}`}
        />
      </span>
      {children}
    </button>
  );
}
