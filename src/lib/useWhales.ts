"use client";
import { useEffect, useRef, useState } from "react";
import type { Trade } from "./pm";
import { usd, cents } from "./format";

/**
 * Polls /api/whales every 5s, merges new bets on top, and marks the ones that
 * just arrived (for one entrance and one ring). Optionally fires a browser
 * notification for ranked traders.
 */
export function useWhales(initial: Trade[], { min = 10_000, paused = false, notify = false }: { min?: number; paused?: boolean; notify?: boolean } = {}) {
  const [trades, setTrades] = useState<Trade[]>(initial);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"live" | "error">("live");
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
        if (!incoming.length) return;
        if (notify && typeof Notification !== "undefined" && Notification.permission === "granted") {
          incoming
            .filter((t) => t.rank)
            .slice(0, 3)
            .forEach((t) => {
              try {
                new Notification(`#${t.rank} ${t.name} ${t.side === "BUY" ? "bought" : "sold"} ${usd(t.usd)}`, {
                  body: `${t.outcome} at ${cents(t.price)} · ${t.title}`,
                  icon: "/logo-mark.svg",
                  tag: t.id,
                });
              } catch {}
            });
        }
        setFresh(new Set(incoming.map((t) => t.id)));
        setTrades((prev) => [...incoming, ...prev].sort((a, b) => b.ts - a.ts).slice(0, 300));
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

  return { trades, fresh, status };
}

/** A clock that ticks once a second on the client only (no hydration mismatch). */
export function useNow(every = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now() / 1000);
    const id = setInterval(() => setNow(Date.now() / 1000), every);
    return () => clearInterval(id);
  }, [every]);
  return now;
}
