"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Trade } from "@/lib/pm";
import { usd, cents, ago } from "@/lib/format";

/**
 * Whale sonar: each bet is a blip. Distance from center = how recent
 * (center is now), size = dollars, amber = ranked trader. A sweep line
 * circles the scope; hover a blip to read it, click to open the wallet.
 */
export function Radar({ trades, size = 420 }: { trades: Trade[]; size?: number }) {
  const [hover, setHover] = useState<Trade | null>(null);
  const blips = useMemo(() => {
    const list = trades.slice(0, 40);
    if (!list.length) return [];
    const newest = Math.max(...list.map((t) => t.ts));
    const oldest = Math.min(...list.map((t) => t.ts));
    const span = Math.max(60, newest - oldest);
    const max = Math.max(...list.map((t) => t.usd));
    return list.map((t) => {
      let h = 0;
      for (const c of t.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      const ang = (h % 360) * (Math.PI / 180);
      const rad = 0.1 + 0.82 * ((newest - t.ts) / span);
      return { t, x: 50 + Math.cos(ang) * rad * 46, y: 50 + Math.sin(ang) * rad * 46, r: 0.8 + 3.2 * Math.sqrt(t.usd / max), deg: h % 360 };
    });
  }, [trades]);

  return (
    <div className="relative mx-auto aspect-square w-full" style={{ maxWidth: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        {[46, 34.5, 23, 11.5].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#2b2d22" strokeWidth=".3" />
        ))}
        <line x1="4" y1="50" x2="96" y2="50" stroke="#2b2d22" strokeWidth=".3" />
        <line x1="50" y1="4" x2="50" y2="96" stroke="#2b2d22" strokeWidth=".3" />
        <g className="t-sweep">
          <path d="M50 50 L96 50 A46 46 0 0 0 82.5 17.5 Z" fill="#cd8117" opacity=".09" />
          <line x1="50" y1="50" x2="96" y2="50" stroke="#cd8117" strokeWidth=".35" opacity=".8" />
        </g>
      </svg>
      {blips.map(({ t, x, y, r }) => {
        const ranked = t.rank !== null;
        return (
          <Link
            key={t.id}
            href={`/trader/${t.wallet}`}
            onMouseEnter={() => setHover(t)}
            onMouseLeave={() => setHover((h) => (h?.id === t.id ? null : h))}
            onFocus={() => setHover(t)}
            aria-label={`${t.name} ${t.side === "BUY" ? "bought" : "sold"} ${usd(t.usd)} on ${t.title}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-150"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${r * 2}%`,
              height: `${r * 2}%`,
              background: ranked ? "#cd8117" : t.side === "BUY" ? "#e8e4d6" : "transparent",
              border: t.side === "SELL" ? `1px solid ${ranked ? "#cd8117" : "#a29d86"}` : "none",
              opacity: hover && hover.id !== t.id ? 0.35 : 0.9,
            }}
          />
        );
      })}
      <div className="t-mono pointer-events-none absolute left-2 top-2 text-[10.5px] leading-relaxed text-t-dim">
        center = now
        <br />
        edge = oldest
      </div>
      <div className="t-mono pointer-events-none absolute bottom-2 right-2 flex gap-3 text-[10.5px] text-t-dim">
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-t-text" />buy</span>
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full border border-t-dim" />sell</span>
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-t-amber" />ranked</span>
      </div>
      {hover && (
        <div className="t-mono pointer-events-none absolute inset-x-3 bottom-9 border border-t-line bg-t-bg px-3 py-2 text-[12px]">
          <div className="flex justify-between gap-3">
            <span className="truncate text-t-text">
              {hover.rank ? <b className="text-t-amber">#{hover.rank} </b> : null}
              {hover.name}
            </span>
            <span className="text-t-text">{usd(hover.usd)}</span>
          </div>
          <div className="truncate text-t-dim">
            {hover.side === "BUY" ? "bought" : "sold"} {hover.outcome} @ {cents(hover.price)} · {hover.title} · {ago(hover.ts)} ago
          </div>
        </div>
      )}
    </div>
  );
}
