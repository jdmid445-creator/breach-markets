/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SplitTitle, Reveal } from "@/components/fx/motion";

/** A work area on the desk: hairline frame, a plain title row, optional link out. */
export function Panel({
  title,
  meta,
  href,
  hrefLabel,
  live,
  framed = false,
  className = "",
  bodyClass = "",
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  href?: string;
  hrefLabel?: string;
  live?: boolean;
  /** Only the chart gets a frame; every other work area sits on a hairline rule. */
  framed?: boolean;
  className?: string;
  bodyClass?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`flex min-w-0 flex-col ${framed ? "rounded-lg border border-hair-2 bg-shoal" : "border-t border-hair-2"} ${className}`}>
      <header className="flex min-h-11 shrink-0 items-center gap-2.5 border-b border-hair px-4">
        {live && <span className="live-dot shrink-0" aria-label="Live" />}
        <h2 className="text-[14.5px] font-semibold text-fg">{title}</h2>
        {meta && <span className="truncate text-[13px] text-faint max-sm:hidden">{meta}</span>}
        {href && (
          <Link href={href} className="press group ml-auto flex shrink-0 items-center gap-1 text-[13px] text-mist hover:text-fg">
            {hrefLabel ?? "Open"}
            <ArrowRight size={14} strokeWidth={2} className="transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-0.5" />
          </Link>
        )}
      </header>
      <div className={`relative min-h-0 flex-1 ${bodyClass}`}>{children}</div>
    </section>
  );
}

/** Page header for desk pages: a real title, one sentence, then the page's controls. */
export function PageHeader({ title, sub, aside, children }: { title: string; sub?: React.ReactNode; aside?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="mx-auto max-w-[1360px] px-5 pb-6 pt-40 sm:pt-32 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div className="min-w-0">
          <SplitTitle as="h1" text={title} hiLast className="mega text-[clamp(44px,7.5vw,124px)] text-fg" />
          {sub && (
            <Reveal delay={0.3} y={14}>
              <p className="mt-4 max-w-[62ch] text-[16px] leading-relaxed text-mist">{sub}</p>
            </Reveal>
          )}
        </div>
        {aside}
      </div>
      {children && (
        <Reveal delay={0.45} y={14}>
          <div className="mt-8">{children}</div>
        </Reveal>
      )}
    </header>
  );
}

/**
 * Rank chip. Top 10 carries the scarlet hazard mark; other ranked traders a
 * stone outline. The word "rank" stays in the accessible name.
 */
export function RankChip({ rank, size = "sm" }: { rank: number; size?: "sm" | "md" }) {
  const elite = rank <= 10;
  return (
    <span
      aria-label={`Rank ${rank}`}
      className={`fig inline-flex shrink-0 items-center rounded-[5px] font-bold leading-none ${size === "md" ? "h-6 px-2 text-[13px]" : "h-[20px] px-1.5 text-[12px]"} ${
        elite ? "bg-scarlet-deep text-white" : "border border-hair-2 text-stone-hi"
      }`}
    >
      #{rank.toLocaleString()}
    </span>
  );
}

export function SideTag({ side }: { side: "BUY" | "SELL" }) {
  return <Side side={side} />;
}

/** Polymarket's own market image, or a quiet placeholder tile. */
export function MarketIcon({ src, label = "", size = 32 }: { src?: string; label?: string; size?: number }) {
  if (src)
    return <img src={src} alt="" width={size} height={size} loading="lazy" className="block shrink-0 rounded-md object-cover ring-1 ring-hair" style={{ width: size, height: size }} />;
  const initial = (label.replace(/^((will|the)\s+)+/i, "").match(/[A-Za-z0-9]/)?.[0] ?? "").toUpperCase();
  return (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-md bg-reef font-semibold text-stone-hi ring-1 ring-hair" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {initial}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-14 text-center text-[14px] text-mist">{children}</div>;
}

export function Verified() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-label="Verified on Polymarket" className="shrink-0">
      <circle cx="8" cy="8" r="8" fill="#639cc5" />
      <path d="M4.6 8.2 7 10.4 11.4 5.8" fill="none" stroke="#03203d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Signed money: profit in stone, loss in mist; the sign carries the direction. */
export function Pnl({ value, children, className = "" }: { value: number; children: React.ReactNode; className?: string }) {
  return <span className={`fig font-semibold ${value >= 0 ? "text-stone-hi" : "text-mist"} ${className}`}>{children}</span>;
}

/** One code for buy and sell everywhere, the chart's: bought in stone, sold underlined. */
export function Side({ side, lower = false }: { side: "BUY" | "SELL"; lower?: boolean }) {
  const word = side === "BUY" ? "Bought" : "Sold";
  return side === "BUY" ? (
    <span className="font-semibold text-stone-hi">{lower ? word.toLowerCase() : word}</span>
  ) : (
    <span className="font-semibold text-fg underline decoration-1 underline-offset-[3px]">{lower ? word.toLowerCase() : word}</span>
  );
}
