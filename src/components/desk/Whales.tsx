"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, BellRing, Pause, Play, ArrowUpRight } from "lucide-react";
import type { Trade } from "@/lib/pm";
import { usd, cents, ago, tier, pmMarket } from "@/lib/format";
import { bucketLabel, isSport } from "@/lib/sports";
import { useWhales, useNow } from "@/lib/useWhales";
import { Soundings } from "./Soundings";
import { MarketIcon, RankChip, Empty, Panel, Side } from "./ui";

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
  const biggest = hour.reduce<Trade | null>((b, t) => (!b || t.usd > b.usd ? t : b), null);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6 pb-7">
        <div>
          <h2 className="title text-[clamp(30px,3.6vw,46px)] text-fg">Whale desk</h2>
          <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-mist">
            Every Polymarket bet of $10K or more, who placed it and how good they are. Ranked traders carry their leaderboard rank; the top 10 are marked in red.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-x-8 gap-y-1 sm:gap-x-12">
          <Stat label="Whale bets, last hour" value={String(hour.length)} />
          <Stat label="Money moved" value={usd(total)} />
          <Stat label="From ranked traders" value={hour.length ? `${Math.round((ranked / hour.length) * 100)}%` : "—"} />
        </dl>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel
          framed
          title="Whale chart"
          meta={biggest ? <>biggest this hour {usd(biggest.usd)} by {biggest.name}</> : "last 70 whale bets"}
          live={status === "live"}
          className="lg:col-span-8"
        >
          <Soundings trades={trades} fresh={fresh} height={470} />
        </Panel>
        <Panel title="Latest whales" href="/live" hrefLabel="All alerts" className="lg:col-span-4" bodyClass="max-h-[560px] overflow-y-auto lg:max-h-none lg:basis-0">
          <WhaleList trades={trades.slice(0, 30)} fresh={fresh} now={now} />
        </Panel>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-1 text-[12.5px] text-faint">{label}</dt>
      <dd className="fig text-[26px] font-semibold leading-none text-fg">{value}</dd>
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
          <li key={t.id} className={`row border-b border-hair last:border-0 ${isNew ? "row-new row-wash" : ""}`}>
            <div className="grid grid-cols-[28px_1fr_auto] items-start gap-3 px-3 py-3 sm:px-4">
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
          </li>
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
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-hair py-3">
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

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.75fr)]">
        <div className="overflow-x-auto border-t border-hair-2">
          <WhaleTable trades={shown} fresh={fresh} now={now} />
        </div>
        <div className="max-lg:order-first lg:sticky lg:top-[76px]">
          <Panel framed title="Whale chart" meta="the bets on the left, by price and time">
            <Soundings trades={shown} fresh={fresh} height={520} />
          </Panel>
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
        <tr className="border-b border-hair text-[12.5px] text-faint">
          <th className="w-[64px] px-3 py-2.5 sm:px-4 font-normal max-md:hidden">When</th>
          <th className="px-3 py-2.5 sm:px-4 font-normal">Trader and bet</th>
          <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 font-normal max-xl:hidden">Market type</th>
          <th className="px-3 py-2.5 sm:px-4 text-right font-normal">Size</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((t) => {
          const ranked = t.rank !== null;
          const tr = tier(t.usd);
          return (
            <tr key={t.id} className={`row border-b border-hair last:border-0 ${fresh?.has(t.id) ? "row-new row-wash" : ""}`}>
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
                      <ArrowUpRight size={13} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-3 sm:px-4 align-top text-[13px] text-mist max-xl:hidden">{bucketLabel(t.bucket)}</td>
              <td className="px-3 py-3 sm:px-4 text-right align-top">
                <div className={`fig text-[16px] font-semibold ${ranked ? "text-fg" : "text-mist"}`}>{usd(t.usd)}</div>
                {t.usd >= 50_000 && <div className="mt-0.5 whitespace-nowrap text-[12px] text-faint">{tr.label}</div>}
              </td>
            </tr>
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
