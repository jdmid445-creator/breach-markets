"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Row = { address: string; name: string; rank: number; pnl: number };
type Item = { kind: "page" | "trader"; label: string; sub: string; href: string };

const PAGES: Item[] = [
  { kind: "page", label: "Whale alerts", sub: "Live bets over your threshold", href: "/live" },
  { kind: "page", label: "Leaderboards", sub: "Profit by window, category and sport", href: "/leaderboard" },
  { kind: "page", label: "Smart money", sub: "Where the top 30 agree", href: "/smart-money" },
  { kind: "page", label: "Politics, 7 days", sub: "Leaderboard", href: "/leaderboard?cat=politics&w=week" },
  { kind: "page", label: "Sports, 24 hours", sub: "Leaderboard", href: "/leaderboard?cat=sports&w=day" },
  { kind: "page", label: "Last hour", sub: "Who's moving money right now", href: "/leaderboard?w=hour" },
];

/**
 * ⌘K / "/" palette: jump to any page or search the top 1000 traders by name
 * or wallet. Also wires single-key shortcuts: A alerts, L leaderboards,
 * S smart money, H home.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [traders, setTraders] = useState<Row[] | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, [contenteditable]");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") {
        e.preventDefault();
        setOpen(true);
      }
      const map: Record<string, string> = { a: "/live", l: "/leaderboard", s: "/smart-money", h: "/" };
      if (!open && map[e.key.toLowerCase()]) router.push(map[e.key.toLowerCase()]);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("breach:palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("breach:palette", onOpen);
    };
  }, [open, router]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setSel(0);
    setTimeout(() => input.current?.focus(), 10);
    if (!traders)
      fetch("/api/traders")
        .then((r) => r.json())
        .then((j) => setTraders(j.traders ?? []))
        .catch(() => setTraders([]));
  }, [open, traders]);

  const items = useMemo<Item[]>(() => {
    const s = q.trim().toLowerCase();
    const pages = PAGES.filter((p) => !s || p.label.toLowerCase().includes(s));
    const people = (traders ?? [])
      .filter((t) => s && (t.name.toLowerCase().includes(s) || t.address.toLowerCase().startsWith(s)))
      .slice(0, 8)
      .map<Item>((t) => ({ kind: "trader", label: t.name, sub: `#${t.rank} all-time · ${t.address.slice(0, 6)}…${t.address.slice(-4)}`, href: `/trader/${t.address}` }));
    if (/^0x[a-f0-9]{40}$/.test(s)) people.unshift({ kind: "trader", label: "Open wallet", sub: s, href: `/trader/${s}` });
    return [...people, ...pages].slice(0, 12);
  }, [q, traders]);

  const go = (it?: Item) => {
    if (!it) return;
    setOpen(false);
    router.push(it.href);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 px-4 pt-[14vh]" onClick={() => setOpen(false)}>
      <div className="w-full max-w-[620px] border border-t-line bg-t-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Search">
        <div className="flex items-center gap-3 border-b border-t-line px-4">
          <span className="t-mono text-t-amber">&gt;</span>
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") (e.preventDefault(), setSel((v) => Math.min(items.length - 1, v + 1)));
              if (e.key === "ArrowUp") (e.preventDefault(), setSel((v) => Math.max(0, v - 1)));
              if (e.key === "Enter") go(items[sel]);
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Search a trader, paste a wallet, or jump to a page"
            className="t-mono h-12 flex-1 bg-transparent text-[14px] text-t-text outline-none placeholder:text-t-dim"
          />
          <kbd className="t-mono rounded-[3px] border border-t-line px-1.5 text-[10.5px] text-t-dim">esc</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto py-1">
          {items.length === 0 && <li className="t-mono px-4 py-6 text-[13px] text-t-dim">{traders === null ? "loading traders…" : "no match"}</li>}
          {items.map((it, i) => (
            <li key={`${it.href}-${i}`}>
              <button
                onMouseEnter={() => setSel(i)}
                onClick={() => go(it)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${i === sel ? "bg-t-olive" : ""}`}
              >
                <span className={`t-mono w-14 text-[10.5px] ${it.kind === "trader" ? "text-t-amber" : "text-t-dim"}`}>{it.kind === "trader" ? "trader" : "page"}</span>
                <span className="flex-1 truncate text-[14px] text-t-text">{it.label}</span>
                <span className="t-mono truncate text-[11.5px] text-t-dim">{it.sub}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="t-mono flex gap-4 border-t border-t-line px-4 py-2 text-[11px] text-t-dim">
          <span>↑↓ move</span>
          <span>↵ open</span>
          <span className="ml-auto">A alerts · L boards · S smart money · H home</span>
        </div>
      </div>
    </div>
  );
}
