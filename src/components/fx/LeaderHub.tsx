"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { Trader } from "@/lib/pm";
import { CATEGORIES } from "@/lib/pm";
import { SPORTS } from "@/lib/sports";
import { usd } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { Verified } from "@/components/desk/ui";
import { SplitTitle, Tilt, Counter, Magnetic, EASE } from "./motion";

type Row = Trader & { trades?: number };
type Sort = "PNL" | "VOLUME";

const MARKETS = CATEGORIES;
const SPORT_TABS = [{ id: "all", label: "All sports" }, ...SPORTS.map((s) => ({ id: s.id, label: s.label }))];

/**
 * The first thing after the intro: pick a market (and a sport), pick profit or
 * volume, see the top 20 for the last 24 hours. Refreshes every minute.
 */
export function LeaderHub({ initial, titled = true }: { initial: Row[]; titled?: boolean }) {
  const reduce = useReducedMotion();
  const [cat, setCat] = useState<string>("overall");
  const [sport, setSport] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("PNL");
  const cache = useRef(new Map<string, { rows: Row[]; at: number; mode: string }>([["overall|all|PNL", { rows: initial, at: Date.now(), mode: "rank" }]]));
  const single = cat === "sports" && sport !== "all";
  const key = `${cat}|${cat === "sports" ? sport : "all"}|${single ? "FLOW" : sort}`;
  const [, force] = useState(0);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    const load = async (bg = false) => {
      if (!bg) setLoading(!cache.current.has(key));
      const qs = single ? `sport=${sport}&w=day&limit=20` : `cat=${cat}&sort=${sort}&w=day&limit=20`;
      try {
        const r = await fetch(`/api/board?${qs}`, { cache: "no-store" });
        const j = (await r.json()) as { ok: boolean; rows: Row[]; mode: string };
        if (!alive) return;
        if (j.ok) cache.current.set(key, { rows: j.rows, at: Date.now(), mode: j.mode });
      } catch {}
      if (alive) {
        setLoading(false);
        force((n) => n + 1);
      }
    };
    const fresh = cache.current.get(key);
    if (!fresh || Date.now() - fresh.at > 55_000) load();
    const id = setInterval(() => load(true), 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [key, cat, sport, sort, single]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const entry = cache.current.get(key);
  const rows = useMemo(() => entry?.rows ?? [], [entry]);
  const metric = (r: Row) => (single || sort === "VOLUME" ? r.volume : r.pnl);
  const max = Math.max(...rows.map((r) => Math.abs(metric(r))), 1);
  const top = rows.slice(0, 3);
  const rest = rows.slice(3, 20);
  const marketLabel = single ? SPORTS.find((s) => s.id === sport)!.label : MARKETS.find((m) => m.id === cat)!.label;
  const moreHref = single ? `/leaderboard?cat=sports&sport=${sport}&w=day` : `/leaderboard?cat=${cat}&w=day&sort=${sort}`;
  const age = entry ? Math.max(0, Math.round((now - entry.at) / 1000)) : null;

  return (
    <section className="relative">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div>
          {titled && <SplitTitle as="h2" text="Top traders today" className="title text-[clamp(40px,6vw,84px)] text-fg" />}
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.35 }}
            className="mt-4 max-w-[58ch] text-[16px] leading-relaxed text-mist"
          >
            The 20 best Polymarket traders of the last 24 hours. Pick a market, then rank by profit or by how much they traded.
          </motion.p>
        </div>
        <p className="flex items-center gap-2 text-[13px] text-faint" aria-live="polite">
          <span className="live-dot" />
          Live from Polymarket · {age === null ? "loading" : age < 5 ? "updated just now" : `updated ${age}s ago`}
        </p>
      </div>

      {/* market picker */}
      <div className="mt-8 -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
        <Pills id="mkt" value={cat} onChange={(v) => (setCat(v), setSport("all"))} items={MARKETS.map((m) => ({ id: m.id, label: m.label }))} size="lg" />
      </div>
      <AnimatePresence initial={false}>
        {cat === "sports" && (
          <motion.div
            key="sports"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="-mx-5 mt-3 overflow-x-auto px-5 md:mx-0 md:px-0">
              <Pills id="sport" value={sport} onChange={setSport} items={SPORT_TABS} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        {single ? (
          <p className="text-[13.5px] text-mist">
            Ranked by money moved in $1K+ bets on {marketLabel} today. Polymarket doesn’t publish profit for a single sport.
          </p>
        ) : (
          <Pills
            id="sort"
            value={sort}
            onChange={(v) => setSort(v as Sort)}
            items={[
              { id: "PNL", label: "By profit" },
              { id: "VOLUME", label: "By volume" },
            ]}
          />
        )}
        <span className="text-[13px] text-faint">Last 24 hours</span>
      </div>

      {/* the board */}
      <div className="relative mt-8 min-h-[520px]">
        {loading && !entry && <Skeleton />}
        {entry && rows.length === 0 && <p className="py-20 text-center text-mist">No {marketLabel} traders on the board yet today.</p>}

        {top.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {top.map((t, i) => (
                <motion.div
                  key={`${key}-${t.address}`}
                  layout
                  initial={reduce ? false : { opacity: 0, y: 40, rotateX: -25, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(8px)", transition: { duration: 0.2 } }}
                  transition={{ duration: 0.7, ease: EASE, delay: i * 0.08 }}
                  style={{ transformPerspective: 900 }}
                >
                  <Tilt className={`h-full rounded-xl border ${i === 0 ? "border-stone/60 bg-reef/70" : "border-hair-2 bg-shoal/80"} backdrop-blur-sm`}>
                    <Link href={`/trader/${t.address}`} className="relative block h-full overflow-hidden p-6">
                      <span aria-hidden className="title pointer-events-none absolute -right-2 -top-6 select-none text-[150px] leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(141,187,224,.22)]">
                        {i + 1}
                      </span>
                      <div className="relative flex items-center gap-3">
                        <Avatar src={t.image} seed={t.address} name={t.name} size={i === 0 ? 56 : 48} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[18px] font-semibold text-fg">{t.name}</span>
                            {t.verified && <Verified />}
                          </div>
                          <div className="text-[13px] text-faint">{i === 0 ? `#1 in ${marketLabel} today` : `#${i + 1}`}</div>
                        </div>
                      </div>
                      <div className="relative mt-10">
                        <div className={`text-[clamp(30px,3.2vw,44px)] font-semibold leading-none ${single || sort === "VOLUME" ? "text-fg" : metric(t) >= 0 ? "text-stone-hi" : "text-mist"}`}>
                          <Counter value={metric(t)} sign={!single && sort === "PNL"} />
                        </div>
                        <div className="mt-2 text-[13px] text-faint">{single ? `moved in ${t.trades ?? 0} ${t.trades === 1 ? "bet" : "bets"}` : sort === "PNL" ? "profit today" : "traded today"}</div>
                        <div className="mt-5 h-[4px] overflow-hidden rounded-full bg-sea/70">
                          <motion.div
                            className="h-full rounded-full bg-stone-hi"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(4, (Math.abs(metric(t)) / max) * 100)}%` }}
                            transition={{ duration: 1.1, ease: EASE, delay: 0.25 + i * 0.08 }}
                          />
                        </div>
                      </div>
                    </Link>
                  </Tilt>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {rest.length > 0 && (
          <ol className="mt-6 grid gap-x-10 md:grid-cols-2 md:[grid-auto-flow:column] md:[grid-template-rows:repeat(9,auto)]">
            <AnimatePresence mode="popLayout" initial={false}>
              {rest.map((t, i) => (
                <motion.li
                  key={`${key}-${t.address}`}
                  layout
                  initial={reduce ? false : { opacity: 0, x: -24, filter: "blur(6px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.15 + i * 0.03 }}
                  className="border-b border-hair"
                >
                  <Link href={`/trader/${t.address}`} className="spot group grid grid-cols-[30px_32px_1fr_96px] items-center gap-3 rounded-md px-2 py-2.5">
                    <span className="fig text-[14px] text-faint">{i + 4}</span>
                    <Avatar src={t.image} seed={t.address} name={t.name} size={32} />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] text-fg transition-transform duration-200 group-hover:translate-x-1">{t.name}</span>
                      <span className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-reef">
                        <motion.span
                          className="block h-full rounded-full bg-stone"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(3, (Math.abs(metric(t)) / max) * 100)}%` }}
                          transition={{ duration: 0.9, ease: EASE, delay: 0.3 + i * 0.03 }}
                        />
                      </span>
                    </span>
                    <span className={`fig text-right text-[15px] font-semibold ${single || sort === "VOLUME" ? "text-fg" : metric(t) >= 0 ? "text-stone-hi" : "text-mist"}`}>
                      {usd(metric(t), { sign: !single && sort === "PNL" })}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <Magnetic>
          <Link href={moreHref} className="press group inline-flex h-12 items-center gap-2.5 rounded-full bg-stone-hi px-6 text-[15px] font-semibold text-sea hover:bg-fg">
            See the top 100 in {marketLabel}
            <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </Magnetic>
      </div>
    </section>
  );
}

function Pills({ id, value, onChange, items, size = "md" }: { id: string; value: string; onChange: (v: string) => void; items: { id: string; label: string }[]; size?: "md" | "lg" }) {
  const reduce = useReducedMotion();
  return (
    <div role="tablist" className={`inline-flex min-w-max gap-1 rounded-full border border-hair-2 bg-shoal/70 p-1 backdrop-blur-sm`}>
      {items.map((it) => {
        const on = it.id === value;
        return (
          <button
            key={it.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(it.id)}
            className={`press relative rounded-full ${size === "lg" ? "px-4 py-2 text-[14.5px]" : "px-3.5 py-1.5 text-[13.5px]"} ${on ? "font-semibold text-sea" : "text-mist hover:text-fg"}`}
          >
            {on && (
              <motion.span
                layoutId={`pill-${id}`}
                className="absolute inset-0 rounded-full bg-stone-hi"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[230px] animate-pulse rounded-xl border border-hair bg-shoal/60" />
      ))}
    </div>
  );
}
