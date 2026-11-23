"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Trade } from "@/lib/pm";
import { usd, cents, ago, tier, pmMarket } from "@/lib/format";
import { bucketLabel, isSport } from "@/lib/sports";
import { SplitFlap } from "./SplitFlap";
import { Radar } from "./term/Radar";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "sports", label: "Sports" },
  { id: "politics", label: "Politics" },
  { id: "crypto", label: "Crypto" },
  { id: "other", label: "Other" },
] as const;
const SIZES = [10_000, 25_000, 50_000, 100_000, 250_000];

/**
 * Whale alerts tape. Polls every 5s. Ranked traders are bold with their rank;
 * the top 10 get the amber rail. `compact` is the homepage desk version.
 */
export function WhaleFeed({ initial, compact = false, limit = 60, radar = false }: { initial: Trade[]; compact?: boolean; limit?: number; radar?: boolean }) {
  const [trades, setTrades] = useState<Trade[]>(initial);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [min, setMin] = useState(10_000);
  const [cat, setCat] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [side, setSide] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [paused, setPaused] = useState(false);
  const [rankedOnly, setRankedOnly] = useState(false);
  const [notify, setNotify] = useState(false);
  const [custom, setCustom] = useState("");
  const [status, setStatus] = useState<"live" | "error">("live");
  const [now, setNow] = useState<number | null>(null);
  const seen = useRef(new Set(initial.map((t) => t.id)));

  useEffect(() => {
    if (paused) return;
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/whales?min=${min}`, { cache: "no-store" });
        const j = (await r.json()) as { ok: boolean; trades: Trade[] };
        if (!alive) return;
        if (!j.ok) return setStatus("error");
        setStatus("live");
        const incoming = j.trades.filter((t) => !seen.current.has(t.id));
        incoming.forEach((t) => seen.current.add(t.id));
        if (incoming.length) {
          if (notify && typeof Notification !== "undefined" && Notification.permission === "granted") {
            incoming
              .filter((t) => t.rank && t.usd >= min)
              .slice(0, 3)
              .forEach((t) => {
                try {
                  new Notification(`#${t.rank} ${t.name} ${t.side === "BUY" ? "bought" : "sold"} ${usd(t.usd)}`, {
                    body: `${t.outcome} @ ${cents(t.price)} · ${t.title}`,
                    icon: "/logo-mark.svg",
                    tag: t.id,
                  });
                } catch {}
              });
          }
          setFresh(new Set(incoming.map((t) => t.id)));
          setTrades((prev) => [...incoming, ...prev].sort((a, b) => b.ts - a.ts).slice(0, 300));
        }
      } catch {
        if (alive) setStatus("error");
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [min, paused, notify]);

  useEffect(() => {
    setNow(Date.now() / 1000);
    const id = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(id);
  }, []);

  const shown = useMemo(
    () =>
      trades
        .filter((t) => t.usd >= min)
        .filter((t) => side === "ALL" || t.side === side)
        .filter((t) => !rankedOnly || t.rank !== null)
        .filter((t) => (cat === "all" ? true : cat === "sports" ? isSport(t.bucket) : t.bucket === cat))
        .slice(0, limit),
    [trades, min, side, cat, limit, rankedOnly],
  );
  const total = shown.reduce((s, t) => s + t.usd, 0);
  const rankedCount = shown.filter((t) => t.rank).length;

  return (
    <div>
      {!compact && (
        <div className="t-mono flex flex-wrap items-stretch border border-t-line bg-t-panel text-[12.5px]">
          <Group label="market">
            {FILTERS.map((f) => (
              <Opt key={f.id} on={cat === f.id} onClick={() => setCat(f.id)}>
                {f.label}
              </Opt>
            ))}
          </Group>
          <Group label="side">
            {(["ALL", "BUY", "SELL"] as const).map((s) => (
              <Opt key={s} on={side === s} onClick={() => setSide(s)}>
                {s === "ALL" ? "Both" : s === "BUY" ? "Buys" : "Sells"}
              </Opt>
            ))}
          </Group>
          <Group label="min size">
            {SIZES.map((s) => (
              <Opt key={s} on={min === s} onClick={() => (setMin(s), setCustom(""))}>
                {usd(s)}
              </Opt>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const raw = custom.trim();
                const n = Math.round(Number(raw.replace(/[^0-9.]/g, "")) * (/k$/i.test(raw) ? 1000 : /m$/i.test(raw) ? 1e6 : 1));
                if (n >= 1000) setMin(n);
              }}
              className={`flex items-center px-2 ${SIZES.includes(min) ? "" : "bg-t-olive"}`}
            >
              <span className="text-t-dim">$</span>
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="custom: 75k"
                aria-label="Custom minimum bet size"
                className="w-[92px] bg-transparent px-1 py-2 text-t-text outline-none placeholder:text-t-dim/70"
              />
            </form>
          </Group>
          <Group label="filters">
            <Opt on={rankedOnly} onClick={() => setRankedOnly((v) => !v)}>
              Ranked only
            </Opt>
            <Opt
              on={notify}
              onClick={async () => {
                if (!notify && typeof Notification !== "undefined" && Notification.permission !== "granted") {
                  const p = await Notification.requestPermission();
                  if (p !== "granted") return;
                }
                setNotify((v) => !v);
              }}
            >
              {notify ? "Alerts on" : "Notify me"}
            </Opt>
            <Opt on={paused} onClick={() => setPaused((p) => !p)}>
              {paused ? "Paused" : "Pause"}
            </Opt>
          </Group>
        </div>
      )}

      {!compact && (
        <div className="t-mono mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-t-dim">
          <span className="flex items-center gap-2 text-t-text">
            <span className={`h-2 w-2 rounded-full ${status === "live" && !paused ? "t-blink bg-t-amber" : "bg-t-dim"}`} />
            {paused ? "paused" : status === "live" ? "live, every 5s" : "reconnecting"}
          </span>
          <span>min {usd(min)}</span>
          <span>{shown.length} bets</span>
          <span>{usd(total)} total</span>
          <span className="text-t-amber">{rankedCount} from ranked traders</span>
        </div>
      )}

      {radar && (
        <div className="mt-4 border border-t-line bg-t-panel p-4">
          <Radar trades={shown} size={520} />
        </div>
      )}

      <div className={`${compact ? "" : "mt-4 border border-t-line"} bg-t-panel`}>
        {!compact && (
          <div className="t-mono grid grid-cols-[64px_1fr_110px_90px] gap-4 border-b border-t-line px-4 py-2 text-[11px] text-t-dim max-md:grid-cols-[1fr_100px]">
            <span className="max-md:hidden">time</span>
            <span>trader · bet</span>
            <span className="text-right">size</span>
            <span className="text-right max-md:hidden">tier</span>
          </div>
        )}
        <ul>
          {shown.length === 0 && (
            <li className="t-mono px-4 py-12 text-center text-[13px] text-t-dim">
              {status === "error" ? "Polymarket isn’t answering. Retrying." : "No whales match these filters yet."}
            </li>
          )}
          {shown.map((t, i) => (
            <Row key={t.id} t={t} isNew={fresh.has(t.id)} compact={compact} now={now} i={i} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({ t, isNew, compact, now, i }: { t: Trade; isNew: boolean; compact: boolean; now: number | null; i: number }) {
  const buy = t.side === "BUY";
  const ranked = t.rank !== null;
  const elite = ranked && (t.rank as number) <= 10;
  const tr = tier(t.usd);
  return (
    <li
      className={`t-row relative grid items-center gap-4 border-b border-t-line px-4 py-2.5 last:border-0 ${
        compact ? "grid-cols-[1fr_96px]" : "grid-cols-[64px_1fr_110px_90px] max-md:grid-cols-[1fr_100px]"
      } ${isNew ? "row-in" : ""}`}
      style={isNew ? undefined : { animation: `row-rise .5s cubic-bezier(.2,.8,.2,1) ${Math.min(i, 14) * 30}ms both` }}
    >
      {elite && <span className="absolute inset-y-0 left-0 w-[3px] bg-t-amber" aria-hidden />}
      {!compact && (
        <span className="t-mono text-[12px] text-t-dim max-md:hidden" suppressHydrationWarning>
          {now ? ago(t.ts, now) : " "}
        </span>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 text-[14px]">
          {ranked && <span className={`t-mono text-[12px] font-semibold ${elite ? "text-t-amber" : "text-t-text"}`}>#{t.rank}</span>}
          <Link href={`/trader/${t.wallet}`} className={`max-w-[20ch] truncate hover:text-t-amber ${ranked ? "font-bold text-t-text" : "text-t-dim"}`}>
            {t.name}
          </Link>
          <span className={`t-mono text-[12.5px] ${buy ? "text-t-up" : "text-t-down"}`}>{buy ? "buy" : "sell"}</span>
          <span className="t-mono text-[12.5px] text-t-text">
            {t.outcome || "?"} <span className="text-t-dim">@{cents(t.price)}</span>
          </span>
          {!compact && <span className="text-[12px] text-t-dim">{bucketLabel(t.bucket)}</span>}
        </div>
        <a href={pmMarket(t.eventSlug, t.slug)} target="_blank" rel="noreferrer" className="block truncate text-[12.5px] text-t-dim hover:text-t-text">
          {t.title || "Unknown market"}
        </a>
      </div>
      <div className={`t-mono text-right font-semibold ${ranked ? "text-[16px] text-t-text" : "text-[15px] text-t-text/85"}`}>
        {isNew ? <SplitFlap value={usd(t.usd)} /> : usd(t.usd)}
      </div>
      {!compact && <span className={`t-mono text-right text-[11.5px] max-md:hidden ${t.usd >= 250_000 ? "text-t-amber" : "text-t-dim"}`}>{tr.label.toLowerCase()}</span>}
    </li>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-stretch border-r border-t-line last:border-r-0">
      <span className="flex items-center px-3 text-[11px] text-t-dim">{label}</span>
      {children}
    </div>
  );
}

function Opt({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`px-2.5 py-2 transition-colors ${on ? "bg-t-amber text-t-bg" : "text-t-dim hover:bg-t-olive hover:text-t-text"}`}>
      {children}
    </button>
  );
}
