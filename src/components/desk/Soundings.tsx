"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { contourDensity } from "d3-contour";
import { geoPath } from "d3-geo";
import type { Trade } from "@/lib/pm";
import { usd, cents, ago } from "@/lib/format";
import { RankChip, Side } from "./ui";

const M = { t: 18, r: 18, b: 34, l: 50 };
const BAND = 5; // graduation band thickness, the chart's neatline

const STEPS = [60, 120, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 86400];

/** "57" for $57K, "1.2M" for $1.2M: how a sounding is printed. */
function figure(n: number) {
  const k = n / 1000;
  if (k >= 1000) return `${(k / 1000).toFixed(1)}M`;
  return `${Math.round(k)}`;
}

function span(s: number) {
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

/**
 * The signature view: Polymarket as a sounding chart. Every bet is printed as
 * its size in $K at the price it filled (y) and the moment it landed (x, right
 * edge = now). Contours trace where the money pools. Top-10 traders carry the
 * scarlet hazard mark; any ranked trader a stone ring. Sells are underlined.
 */
export function Soundings({
  trades,
  height = 440,
  fresh,
  limit = 70,
  label = "Recent whale bets plotted by price and time",
  plain = false,
}: {
  trades: Trade[];
  height?: number;
  fresh?: Set<string>;
  limit?: number;
  label?: string;
  /** One trader's own bets: print every figure at full strength, no rank marks. */
  plain?: boolean;
}) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  // First paint only: soundings are taken left to right, like a survey line.
  const [phase, setPhase] = useState<"wait" | "in" | "done">("wait");
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done");
      return;
    }
    let t: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setPhase("in");
        t = setTimeout(() => setPhase("done"), 1000);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);
  const entering = phase === "in";

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    setNow(Date.now() / 1000);
    const id = setInterval(() => setNow(Date.now() / 1000), 15000);
    return () => clearInterval(id);
  }, []);

  const h = w && w < 560 ? Math.min(height, 340) : height;

  const model = useMemo(() => {
    if (!w || now === null) return null;
    const list = trades.slice(0, limit);
    const iw = w - M.l - M.r;
    const ih = h - M.t - M.b;
    if (!list.length) return { iw, ih, pts: [], contours: [], ticksX: [], t0: now - 600, t1: now, max: 1, thin: new Set<string>() };
    const newest = Math.max(now, ...list.map((t) => t.ts));
    const oldest = Math.min(...list.map((t) => t.ts));
    const t1 = newest;
    const t0 = Math.min(oldest - (newest - oldest) * 0.04, t1 - 600);
    const x = (ts: number) => M.l + ((ts - t0) / (t1 - t0)) * iw;
    const xIn = (ts: number) => Math.min(M.l + iw - 16, Math.max(M.l + 16, x(ts)));
    const y = (p: number) => M.t + (1 - Math.min(0.995, Math.max(0.005, p))) * ih;
    const max = Math.max(...list.map((t) => t.usd));
    const pts = list
      .map((t) => {
        const size = 11 + 10 * Math.sqrt(t.usd / max);
        return { t, x: xIn(t.ts), y: y(t.price), size, text: figure(t.usd) };
      })
      .sort((a, b) => a.t.usd - b.t.usd);

    // Thin the soundings like a chart does: where figures would collide, the
    // bigger bet keeps its figure and the smaller one becomes a dot.
    const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
    const thin = new Set<string>();
    for (const p of [...pts].reverse()) {
      const pad = 4;
      const ring = p.t.rank !== null && p.t.rank <= 10 && !plain ? 4 : 0;
      const half = (p.text.length * p.size * 0.56) / 2 + pad + ring;
      const left = p.t.rank !== null && !plain && !ring ? 10 : 0; // room for the rank mark
      const b = { x0: p.x - half - left, x1: p.x + half, y0: p.y - p.size * 0.5 - pad, y1: p.y + p.size * 0.62 + pad };
      const hit = placed.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
      if (hit) thin.add(p.t.id);
      else placed.push(b);
    }

    const density = contourDensity<(typeof pts)[number]>()
      .x((d) => d.x)
      .y((d) => d.y)
      .weight((d) => Math.sqrt(d.t.usd))
      .size([w, h])
      .bandwidth(Math.max(16, iw / 34))
      .thresholds(8)(pts);
    const path = geoPath();
    const contours = density.map((c, i) => ({ d: path(c) ?? "", i, n: density.length }));

    const total = t1 - t0;
    const step = STEPS.find((s) => total / s <= (w < 560 ? 4 : 8)) ?? 86400;
    const ticksX: { x: number; label: string }[] = [];
    for (let s = 0; t1 - s >= t0; s += step) ticksX.push({ x: x(t1 - s), label: s === 0 ? "now" : `${span(s)} ago` });
    return { iw, ih, pts, contours, ticksX, t0, t1, max, thin };
  }, [trades, w, h, now, limit, plain]);

  const hovered = model?.pts.find((p) => p.t.id === hover) ?? null;

  return (
    <figure className="m-0">
      <div ref={box} className="relative w-full select-none" style={{ height: h }}>
        {model && w && (
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="group" aria-label={label} className="block">
            <defs>
              <clipPath id="sea">
                <rect x={M.l} y={M.t} width={model.iw} height={model.ih} />
              </clipPath>
            </defs>

            {/* water */}
            <rect x={M.l} y={M.t} width={model.iw} height={model.ih} fill="#03203d" />
            <g clipPath="url(#sea)" className="fig-layer">
              {model.contours.map((c) => (
                <path
                  className={entering ? "contour-in" : undefined}
                  style={entering ? { animationDelay: `${c.i * 50}ms` } : undefined}
                  key={c.i}
                  d={c.d}
                  fill="#639cc5"
                  fillOpacity={0.018 + (c.i / c.n) * 0.07}
                  stroke="#639cc5"
                  strokeOpacity={0.22 + (c.i / c.n) * 0.4}
                  strokeWidth={c.i === c.n - 1 ? 1.2 : 0.8}
                />
              ))}
              {[0.25, 0.5, 0.75].map((p) => (
                <line key={p} x1={M.l} x2={M.l + model.iw} y1={M.t + (1 - p) * model.ih} y2={M.t + (1 - p) * model.ih} stroke="#17436d" strokeDasharray="2 5" />
              ))}
            </g>

            {/* neatline + graduations: left = price in 10¢ bands, bottom = time */}
            <rect x={M.l - BAND - 1} y={M.t - BAND - 1} width={model.iw + BAND * 2 + 2} height={model.ih + BAND * 2 + 2} fill="none" stroke="#255582" />
            <rect x={M.l} y={M.t} width={model.iw} height={model.ih} fill="none" stroke="#255582" />
            {Array.from({ length: 20 }, (_, i) =>
              i % 2 ? (
                <g key={`gy${i}`} fill="#8dbbe0" opacity={0.9}>
                  <rect x={M.l - BAND - 0.5} y={M.t + (i / 20) * model.ih} width={BAND} height={model.ih / 20} />
                  <rect x={M.l + model.iw + 0.5} y={M.t + (i / 20) * model.ih} width={BAND} height={model.ih / 20} />
                </g>
              ) : null,
            )}
            {model.ticksX.map((t, i) => {
              const next = model.ticksX[i + 1]?.x ?? M.l;
              return (
                <g key={`gx${i}`}>
                  {[0, 1].map((half) => {
                    const seg = Math.max(0, t.x - next) / 2;
                    const x0 = next + half * seg;
                    return half === 1 ? (
                      <g key={half} fill="#8dbbe0" opacity={0.9}>
                        <rect x={x0} y={M.t + model.ih + 0.5} width={seg} height={BAND} />
                        <rect x={x0} y={M.t - BAND - 0.5} width={seg} height={BAND} />
                      </g>
                    ) : null;
                  })}
                  <line x1={t.x} x2={t.x} y1={M.t + model.ih} y2={M.t + model.ih + BAND + 4} stroke="#639cc5" opacity={0.75} />
                  <text x={t.x} y={h - 10} textAnchor={i === 0 ? "end" : "middle"} className="fig" fontSize="11.5" fill="#7896b3">
                    {t.label}
                  </text>
                </g>
              );
            })}
            {[0, 25, 50, 75, 100].map((c) => (
              <text key={c} x={M.l - BAND - 8} y={M.t + (1 - c / 100) * model.ih} textAnchor="end" dominantBaseline="central" className="fig" fontSize="11.5" fill="#7896b3">
                {c}¢
              </text>
            ))}

            {/* survey pass: one sweep across the chart when it first comes into view */}
            {entering && <rect x={M.l} y={M.t} width={2} height={model.ih} fill="#8dbbe0" className="sweep" style={{ ["--sweep" as string]: `${model.iw}px` }} />}

            {/* soundings */}
            <g clipPath="url(#sea)" className="fig-layer">
              {model.pts.map((p) => {
                const r = plain ? null : p.t.rank;
                const elite = r !== null && r <= 10;
                const dim = hover !== null && hover !== p.t.id;
                const fill = elite ? "#ff6b6e" : r !== null || plain ? "#eef3f8" : "#a3bdd4";
                const tw = p.text.length * p.size * 0.56;
                return (
                  <g
                    key={p.t.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`${r ? `Rank ${r} ` : ""}${p.t.name} ${p.t.side === "BUY" ? "bought" : "sold"} ${usd(p.t.usd)} of ${p.t.outcome} at ${cents(p.t.price)}, ${p.t.title}`}
                    onMouseEnter={() => setHover(p.t.id)}
                    onMouseLeave={() => setHover((v) => (v === p.t.id ? null : v))}
                    onFocus={() => setHover(p.t.id)}
                    onBlur={() => setHover((v) => (v === p.t.id ? null : v))}
                    onClick={() => router.push(`/trader/${p.t.wallet}`)}
                    onKeyDown={(e) => e.key === "Enter" && router.push(`/trader/${p.t.wallet}`)}
                    className="cursor-pointer outline-none"
                    style={{ opacity: dim ? 0.22 : 1, transition: "opacity 160ms cubic-bezier(.23,1,.32,1)" }}
                  >
                    <circle cx={p.x} cy={p.y} r={Math.max(12, p.size)} fill="transparent" />
                    {fresh?.has(p.t.id) && (
                      <circle cx={p.x} cy={p.y} r={10} fill="none" stroke={elite ? "#eb2f33" : "#8dbbe0"} strokeWidth="1.5" className="ring-scale" />
                    )}
                    {model.thin.has(p.t.id) && hover !== p.t.id ? (
                      <circle cx={p.x} cy={p.y} r={elite ? 3 : 2} fill={elite ? "#eb2f33" : fill} opacity={elite ? 1 : 0.7} />
                    ) : (
                    <>
                    {elite && (
                      // the chart's danger mark: a dotted ring around the sounding
                      <ellipse cx={p.x} cy={p.y} rx={tw / 2 + 7} ry={p.size * 0.72 + 4} fill="none" stroke="#eb2f33" strokeWidth="1.4" strokeDasharray="1.2 2.6" strokeLinecap="round" />
                    )}
                    {r !== null && !elite && <circle cx={p.x - tw / 2 - 6} cy={p.y} r={3} fill="none" stroke="#8dbbe0" strokeWidth="1.3" />}
                    <text
                      x={p.x}
                      y={p.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="sounding"
                      fontSize={p.size}
                      fill={fill}
                      fontWeight={r !== null ? 750 : 560}
                      paintOrder="stroke"
                      stroke="#03203d"
                      strokeWidth={3}
                      strokeLinejoin="round"
                    >
                      {p.text}
                    </text>
                    {p.t.side === "SELL" && <line x1={p.x - tw / 2} x2={p.x + tw / 2} y1={p.y + p.size * 0.58} y2={p.y + p.size * 0.58} stroke={fill} strokeWidth="1.2" />}
                    </>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {model && model.pts.length === 0 && (
          <div className="absolute inset-0 grid place-items-center text-[14px] text-mist">No whale bets in this window yet.</div>
        )}

        {hovered && w && (
          <div
            key={hovered.t.id}
            className="tip-in pointer-events-none absolute z-10 w-[min(300px,80%)] rounded-lg border border-hair-2 bg-sea/95 px-3.5 py-3 shadow-[0_10px_30px_rgba(0,8,20,.5)] backdrop-blur-sm"
            style={{
              left: Math.min(Math.max(8, hovered.x - 150), w - 308),
              top: hovered.y > h / 2 ? undefined : hovered.y + hovered.size + 10,
              bottom: hovered.y > h / 2 ? h - hovered.y + hovered.size + 10 : undefined,
            }}
          >
            <div className="flex items-center gap-2">
              {hovered.t.rank !== null && <RankChip rank={hovered.t.rank} />}
              <span className={`truncate text-[14px] ${hovered.t.rank !== null ? "font-bold text-fg" : "text-mist"}`}>{hovered.t.name}</span>
              <span className="fig ml-auto text-[15px] font-semibold text-fg">{usd(hovered.t.usd)}</span>
            </div>
            <div className="mt-1.5 text-[13px] text-mist">
              <Side side={hovered.t.side} /> {hovered.t.outcome} at{" "}
              <span className="fig text-fg">{cents(hovered.t.price)}</span>
              {now !== null && <span className="text-faint"> · {ago(hovered.t.ts, now)} ago</span>}
            </div>
            <div className="mt-1 line-clamp-2 text-[13px] leading-snug text-fg/90">{hovered.t.title}</div>
          </div>
        )}
      </div>
      <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-hair px-4 py-2.5 text-[12.5px] text-faint">
        <span>
          Soundings in <span className="text-mist">$K</span>, set at the price each bet filled
        </span>
        {!plain && (
          <>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="12" aria-hidden>
            <ellipse cx="8" cy="6" rx="6.6" ry="4.6" fill="none" stroke="#eb2f33" strokeWidth="1.3" strokeDasharray="1.2 2.4" strokeLinecap="round" />
          </svg>
          Top-10 trader
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="9" height="9" aria-hidden>
            <circle cx="4.5" cy="4.5" r="3" fill="none" stroke="#8dbbe0" strokeWidth="1.3" />
          </svg>
          Ranked trader
        </span>
          </>
        )}
        <span>
          <span className="text-mist underline decoration-1 underline-offset-[3px]">Underlined</span> = sell
        </span>
      </figcaption>
    </figure>
  );
}
