"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Trade } from "@/lib/pm";
import { usd, cents } from "@/lib/format";

type B = { t: Trade; r: number; x: number; y: number; vx: number; vy: number };

/**
 * Whale pool: every big bet is a bubble sized by dollars. Buys glow blue,
 * sells are hollow, $100K+ get a tangerine rim. Bubbles drift and push each
 * other apart; hover one to see the bet, click to open the trader.
 */
export function BubblePool({ trades, height = 420 }: { trades: Trade[]; height?: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const nodes = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [w, setW] = useState(1000);
  const [hover, setHover] = useState<Trade | null>(null);
  const items = useMemo(() => trades.slice(0, 45), [trades]);
  const state = useRef<Map<string, B>>(new Map());

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);

  // Seed / refresh bubbles
  useEffect(() => {
    const max = Math.max(...items.map((t) => t.usd), 1);
    const scale = Math.min(w, 1100) / 1100;
    const next = new Map<string, B>();
    for (const t of items) {
      const r = (14 + 62 * Math.sqrt(t.usd / max)) * (0.55 + 0.45 * scale);
      const prev = state.current.get(t.id);
      next.set(
        t.id,
        prev ? { ...prev, r } : { t, r, x: Math.random() * w, y: height + r + Math.random() * 80, vx: (Math.random() - 0.5) * 0.4, vy: -1.6 - Math.random() },
      );
    }
    state.current = next;
  }, [items, w, height]);

  // Physics loop
  useEffect(() => {
    let raf = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = () => {
      const bs = [...state.current.values()];
      for (const b of bs) {
        b.vy += (height / 2 - b.y) * 0.0006 - 0.004; // gentle buoyancy toward middle
        b.vx += (w / 2 - b.x) * 0.00012;
        b.vx *= 0.985;
        b.vy *= 0.985;
      }
      for (let i = 0; i < bs.length; i++)
        for (let j = i + 1; j < bs.length; j++) {
          const a = bs[i], c = bs[j];
          const dx = c.x - a.x, dy = c.y - a.y;
          const d = Math.hypot(dx, dy) || 1;
          const min = a.r + c.r + 4;
          if (d < min) {
            const push = ((min - d) / d) * 0.04;
            a.vx -= dx * push; a.vy -= dy * push;
            c.vx += dx * push; c.vy += dy * push;
          }
        }
      for (const b of bs) {
        if (!reduce) {
          b.x += b.vx;
          b.y += b.vy;
        }
        b.x = Math.max(b.r, Math.min(w - b.r, b.x));
        b.y = Math.max(b.r, Math.min(height - b.r + (reduce ? 0 : 200), b.y));
        const el = nodes.current.get(b.t.id);
        if (el) el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [w, height]);

  return (
    <div ref={wrap} className="relative overflow-hidden rounded-3xl border hairline bg-coal" style={{ height }}>
      <div className="contours absolute inset-0 opacity-70" aria-hidden />
      {items.map((t) => {
        const b = state.current.get(t.id);
        const r = b?.r ?? 20;
        const buy = t.side === "BUY";
        const big = t.usd >= 250_000;
        return (
          <Link
            key={t.id}
            href={`/trader/${t.wallet}`}
            ref={(el) => {
              if (el) nodes.current.set(t.id, el);
              else nodes.current.delete(t.id);
            }}
            onMouseEnter={() => setHover(t)}
            onMouseLeave={() => setHover((h) => (h?.id === t.id ? null : h))}
            className="absolute left-0 top-0 grid place-items-center rounded-full text-center transition-[box-shadow,filter] duration-300 hover:z-10 hover:brightness-125"
            style={{
              width: r * 2,
              height: r * 2,
              willChange: "transform",
              background: buy ? "radial-gradient(circle at 35% 30%, rgba(168,255,244,.55), rgba(116,255,237,.22) 45%, rgba(116,255,237,.08) 75%)" : "rgba(116,255,237,.03)",
              border: buy ? "none" : "1.2px solid rgba(116,255,237,.45)",
              boxShadow: big ? "0 0 0 2px #fe81d1" : buy ? "inset 0 0 0 1px rgba(168,255,244,.55)" : "none",
            }}
            aria-label={`${t.name} ${buy ? "bought" : "sold"} ${usd(t.usd)} of ${t.outcome} on ${t.title}`}
          >
            {r > 30 && <span className="num text-[11px] font-semibold text-bone">{usd(t.usd)}</span>}
          </Link>
        );
      })}

      <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
        <div
          className={`max-w-[440px] rounded-xl border hairline bg-ink/90 px-4 py-3 backdrop-blur transition-opacity ${hover ? "opacity-100" : "opacity-0"}`}
        >
          {hover && (
            <>
              <div className="text-[13px]">
                <b>{hover.name}</b>{" "}
                <span className={hover.side === "BUY" ? "text-up" : "text-down"}>{hover.side === "BUY" ? "bought" : "sold"}</span>{" "}
                <b className="num">{usd(hover.usd)}</b> of {hover.outcome} @ <span className="num">{cents(hover.price)}</span>
              </div>
              <div className="mt-0.5 truncate text-[12.5px] text-mute">{hover.title}</div>
            </>
          )}
        </div>
        <div className="hidden shrink-0 gap-3 rounded-full bg-ink/80 px-3 py-1.5 text-[11.5px] text-mute backdrop-blur sm:flex">
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-aqua/60" />Buy</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full border border-aqua/60" />Sell</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full ring-2 ring-tang" />$250K+</span>
        </div>
      </div>
    </div>
  );
}
