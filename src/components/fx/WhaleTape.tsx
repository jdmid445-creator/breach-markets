"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Trade } from "@/lib/pm";
import { usd, cents } from "@/lib/format";

/** The running tape of whale bets under the nav. Live; pauses on hover. */
export function WhaleTape() {
  const [trades, setTrades] = useState<Trade[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/whales?min=10000", { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => alive && j.ok && setTrades(j.trades.slice(0, 24)))
        .catch(() => {});
    load();
    const id = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  if (!trades.length) return <div className="h-8 border-t border-hair" />;
  const row = (k: string) => (
    <div className="flex shrink-0 items-center" aria-hidden={k === "b"}>
      {trades.map((t) => (
        <Link
          key={`${k}-${t.id}`}
          href={`/trader/${t.wallet}`}
          tabIndex={k === "b" ? -1 : 0}
          className="flex items-center gap-2 whitespace-nowrap px-5 text-[12.5px] text-mist hover:text-fg"
        >
          {t.rank !== null && (
            <span className={`fig rounded-[4px] px-1 text-[11px] font-bold ${t.rank <= 10 ? "bg-scarlet-deep text-white" : "text-stone-hi"}`}>#{t.rank}</span>
          )}
          <span className={t.rank !== null ? "font-semibold text-fg" : ""}>{t.name}</span>
          <span className={t.side === "BUY" ? "text-stone-hi" : "underline underline-offset-2"}>{t.side === "BUY" ? "bought" : "sold"}</span>
          <span className="fig font-semibold text-fg">{usd(t.usd)}</span>
          <span className="max-w-[28ch] truncate text-faint">
            {t.outcome} at {cents(t.price)} · {t.title}
          </span>
          <span aria-hidden className="ml-3 h-1 w-1 rounded-full bg-hair-2" />
        </Link>
      ))}
    </div>
  );
  return (
    <div className="relative h-8 overflow-hidden border-t border-hair [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]" aria-label="Latest whale bets">
      <div className="tape flex h-full w-max items-center">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
