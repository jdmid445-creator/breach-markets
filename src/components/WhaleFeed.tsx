"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Trade } from "@/lib/pm";
import { usd, cents, ago, tier, pmMarket } from "@/lib/format";
import { bucketLabel, isSport } from "@/lib/sports";
import { Avatar } from "./Avatar";
import { BubblePool } from "./BubblePool";
import { SplitFlap } from "./SplitFlap";
import { motion } from "motion/react";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "sports", label: "Sports" },
  { id: "politics", label: "Politics" },
  { id: "crypto", label: "Crypto" },
  { id: "other", label: "Other" },
] as const;
const SIZES = [10_000, 25_000, 50_000, 100_000, 250_000];

export function WhaleFeed({ initial, compact = false, limit = 60, pool = false }: { initial: Trade[]; compact?: boolean; limit?: number; pool?: boolean }) {
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
        .filter((t) =>
          cat === "all" ? true : cat === "sports" ? isSport(t.bucket) : t.bucket === cat,
        )
        .slice(0, limit),
    [trades, min, side, cat, limit, rankedOnly],
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
          <Seg value={SIZES.includes(min) ? min : -1} onChange={(v) => v > 0 && (setMin(v), setCustom(""))} options={SIZES.map((s) => ({ v: s, l: `${usd(s)}+` }))} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const n = Math.round(Number(custom.replace(/[^0-9.]/g, "")) * (/k$/i.test(custom.trim()) ? 1000 : /m$/i.test(custom.trim()) ? 1e6 : 1));
              if (n >= 1000) setMin(n);
            }}
            className={`flex items-center rounded-full border bg-coal/70 pl-3 pr-1 text-[13px] ${SIZES.includes(min) ? "border-line" : "border-aqua/60"}`}
          >
            <span className="text-mute">$</span>
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="custom, e.g. 75k"
              aria-label="Custom minimum bet size"
              className="num w-[120px] bg-transparent px-1.5 py-1.5 text-bone outline-none placeholder:text-mute/60"
            />
            <button className="rounded-full px-2.5 py-1 text-aqua hover:bg-aqua/10">Set</button>
          </form>
          <Toggle on={rankedOnly} onClick={() => setRankedOnly((v) => !v)} label="Ranked traders only" />
          <Toggle
            on={notify}
            onClick={async () => {
              if (!notify && typeof Notification !== "undefined" && Notification.permission !== "granted") {
                const p = await Notification.requestPermission();
                if (p !== "granted") return;
              }
              setNotify((v) => !v);
            }}
            label={notify ? "Alerts on" : "Notify me"}
            icon
          />
          <button
            onClick={() => setPaused((p) => !p)}
            className="ml-auto rounded-full border border-line bg-coal/70 px-4 py-2 text-[13px] text-mute hover:border-aqua/50 hover:text-aqua"
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
            {paused ? "Paused" : status === "live" ? `Live · bets over ${usd(min)} · refreshes every 5s` : "Reconnecting…"}
          </span>
          <span>·</span>
          <span className="num">{shown.length} bets · {usd(total)}</span>
          <span>·</span>
          <span className="num">{shown.filter((t) => t.rank).length} from ranked traders</span>
        </div>
      )}

      <ul className="glass divide-y divide-line overflow-hidden rounded-[28px]">
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
  const ranked = t.rank !== null;
  const elite = ranked && (t.rank as number) <= 10;
  return (
    <li
      className={`lift relative grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3.5 hover:bg-charcoal/50 sm:px-5 ${isNew ? "surface-in" : ""} ${
        ranked ? "bg-aqua/[.035]" : ""
      }`}
    >
      {ranked && <span className={`absolute inset-y-2 left-0 w-[3px] rounded-r ${elite ? "bg-pink" : "bg-aqua"}`} aria-hidden />}
      <div className="flex min-w-0 items-center gap-3.5">
        <Link href={`/trader/${t.wallet}`} className={`shrink-0 rounded-full ${ranked ? (elite ? "ring-2 ring-pink" : "ring-2 ring-aqua/70") : ""}`}>
          <Avatar src={t.image} seed={t.wallet} size={compact ? 32 : 38} />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]">
            <Link
              href={`/trader/${t.wallet}`}
              className={`max-w-[18ch] truncate hover:text-aqua ${ranked ? "font-extrabold tracking-[0.01em] text-bone" : "font-medium text-bone/75"}`}
            >
              {t.name}
            </Link>
            {ranked && (
              <span
                className={`num rounded-md px-1.5 py-0.5 text-[11px] font-bold ${elite ? "bg-pink text-ink" : "bg-aqua/15 text-aqua"}`}
                title={`#${t.rank} on the ${t.rankWindow === "all" ? "all-time" : "30-day"} profit leaderboard`}
              >
                #{t.rank}
                {!compact && <span className="ml-1 font-medium opacity-75">{t.rankWindow === "all" ? "all-time" : "30d"}</span>}
              </span>
            )}
            <span className={buy ? "text-up" : "text-down"}>{buy ? "bought" : "sold"}</span>
            <span className="rounded-md bg-charcoal px-1.5 py-0.5 text-[12px] font-medium">
              {t.outcome || "—"} <span className="num text-mute">@ {cents(t.price)}</span>
            </span>
            {!compact && <span className="text-[12px] text-mute">{bucketLabel(t.bucket)}</span>}
          </div>
          <a href={pmMarket(t.eventSlug, t.slug)} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-[13px] text-mute hover:text-bone">
            {t.title || "Unknown market"}
          </a>
        </div>
      </div>
      <div className="text-right">
        <div className={`num font-semibold ${ranked ? "text-[19px]" : "text-[17px]"}`}>{isNew ? <SplitFlap value={usd(t.usd)} /> : usd(t.usd)}</div>
        <div className="mt-1 flex items-center justify-end gap-2">
          {!compact && <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${tr.cls}`}>{tr.label}</span>}
          <span className="num text-[12px] text-mute" suppressHydrationWarning>
            {now ? ago(t.ts, now) : "\u00a0"}
          </span>
        </div>
      </div>
    </li>
  );
}

function Toggle({ on, onClick, label, icon }: { on: boolean; onClick: () => void; label: string; icon?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] transition-colors ${
        on ? "border-aqua/60 bg-aqua/10 text-aqua" : "border-line bg-coal/70 text-mute hover:text-bone"
      }`}
    >
      {icon ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      ) : (
        <span className={`relative h-4 w-7 rounded-full transition-colors ${on ? "bg-aqua" : "bg-charcoal"}`}>
          <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-ink transition-[left] ${on ? "left-[14px]" : "left-0.5"}`} />
        </span>
      )}
      {label}
    </button>
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
  const id = options.map((o) => o.v).join("-");
  return (
    <div className="flex rounded-full border border-line bg-coal/70 p-1 text-[13px]">
      {options.map((o) => (
        <button
          key={String(o.v)}
          onClick={() => onChange(o.v)}
          className={`relative rounded-full px-3.5 py-1.5 transition-colors ${value === o.v ? "text-ink" : "text-mute hover:text-bone"}`}
        >
          {value === o.v && (
            <motion.span
              layoutId={`feedseg-${id}`}
              className="absolute inset-0 rounded-full bg-aqua"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative font-medium">{o.l}</span>
        </button>
      ))}
    </div>
  );
}
