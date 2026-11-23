"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Trade } from "@/lib/pm";
import { usd, cents, ago, tier, pmMarket } from "@/lib/format";
import { bucketLabel, isSport } from "@/lib/sports";
import { Avatar } from "./Avatar";
import { BubblePool } from "./BubblePool";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "sports", label: "Sports" },
  { id: "politics", label: "Politics" },
  { id: "crypto", label: "Crypto" },
  { id: "other", label: "Other" },
] as const;
const SIZES = [10_000, 25_000, 50_000, 100_000];

export function WhaleFeed({ initial, compact = false, limit = 60, pool = false }: { initial: Trade[]; compact?: boolean; limit?: number; pool?: boolean }) {
  const [trades, setTrades] = useState<Trade[]>(initial);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [min, setMin] = useState(10_000);
  const [cat, setCat] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [side, setSide] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [paused, setPaused] = useState(false);
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
  }, [min, paused]);

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
        .filter((t) =>
          cat === "all" ? true : cat === "sports" ? isSport(t.bucket) : t.bucket === cat,
        )
        .slice(0, limit),
    [trades, min, side, cat, limit],
  );

  const total = shown.reduce((s, t) => s + t.usd, 0);

  return (
    <div>
      {!compact && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Seg value={cat} onChange={setCat} options={FILTERS.map((f) => ({ v: f.id, l: f.label }))} />
          <Seg
            value={side}
            onChange={setSide}
            options={[{ v: "ALL", l: "Buys + sells" }, { v: "BUY", l: "Buys" }, { v: "SELL", l: "Sells" }]}
          />
          <Seg value={min} onChange={setMin} options={SIZES.map((s) => ({ v: s, l: `${usd(s)}+` }))} />
          <button
            onClick={() => setPaused((p) => !p)}
            className="ml-auto rounded-full border hairline px-3.5 py-1.5 text-[13px] text-mute hover:text-bone"
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      )}

      {pool && (
        <div className="mb-6">
          <BubblePool trades={shown} height={440} />
        </div>
      )}

      {!compact && (
        <div className="mb-3 flex items-center gap-3 text-[13px] text-mute">
          <span className="flex items-center gap-2">
            {status === "live" && !paused ? <span className="live-dot" /> : <span className="h-[7px] w-[7px] rounded-full bg-mute" />}
            {paused ? "Paused" : status === "live" ? "Live, refreshes every 5s" : "Reconnecting…"}
          </span>
          <span>·</span>
          <span className="num">{shown.length} bets · {usd(total)}</span>
        </div>
      )}

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border hairline bg-coal">
        {shown.length === 0 && (
          <li className="px-5 py-14 text-center text-mute">
            {status === "error" ? "Polymarket isn’t answering right now. Retrying…" : "No whales match these filters yet. They’ll surface here."}
          </li>
        )}
        {shown.map((t) => (
          <WhaleRow key={t.id} t={t} isNew={fresh.has(t.id)} compact={compact} now={now} />
        ))}
      </ul>
    </div>
  );
}

function WhaleRow({ t, isNew, compact, now }: { t: Trade; isNew: boolean; compact: boolean; now: number | null }) {
  const tr = tier(t.usd);
  const buy = t.side === "BUY";
  return (
    <li className={`lift grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3.5 hover:bg-charcoal/50 sm:px-5 ${isNew ? "surface-in" : ""}`}>
      <div className="flex min-w-0 items-center gap-3.5">
        <Link href={`/trader/${t.wallet}`} className="shrink-0">
          <Avatar src={t.image} seed={t.wallet} size={compact ? 32 : 38} />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]">
            <Link href={`/trader/${t.wallet}`} className="max-w-[16ch] truncate font-semibold hover:text-royal-soft">
              {t.name}
            </Link>
            <span className={buy ? "text-up" : "text-down"}>{buy ? "bought" : "sold"}</span>
            <span className="rounded-md bg-charcoal px-1.5 py-0.5 text-[12px] font-medium">
              {t.outcome || "—"} <span className="num text-mute">@ {cents(t.price)}</span>
            </span>
            {!compact && <span className="text-[12px] text-mute">{bucketLabel(t.bucket)}</span>}
          </div>
          <a
            href={pmMarket(t.eventSlug, t.slug)}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 block truncate text-[13px] text-mute hover:text-bone"
          >
            {t.title || "Unknown market"}
          </a>
        </div>
      </div>
      <div className="text-right">
        <div className="num text-[17px] font-semibold">{usd(t.usd)}</div>
        <div className="mt-1 flex items-center justify-end gap-2">
          {!compact && <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${tr.cls}`}>{tr.label}</span>}
          <span className="num text-[12px] text-mute" suppressHydrationWarning>{now ? ago(t.ts, now) : "\u00a0"}</span>
        </div>
      </div>
    </li>
  );
}

function Seg<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { v: T; l: string }[];
}) {
  return (
    <div className="flex rounded-full border hairline bg-coal p-0.5 text-[13px]">
      {options.map((o) => (
        <button
          key={String(o.v)}
          onClick={() => onChange(o.v)}
          className={`rounded-full px-3 py-1.5 transition-colors ${
            value === o.v ? "bg-aqua text-ink" : "text-mute hover:text-bone"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
