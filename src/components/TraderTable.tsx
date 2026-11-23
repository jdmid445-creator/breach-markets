import Link from "next/link";
import type { Trader, FlowRow } from "@/lib/pm";
import { usd } from "@/lib/format";
import { Avatar } from "./Avatar";

export function TraderTable({ rows, sort, skip = 0 }: { rows: Trader[]; sort: "PNL" | "VOLUME"; skip?: number }) {
  if (!rows.length) return <Empty />;
  const list = rows.slice(skip);
  const max = Math.max(...rows.map((r) => Math.abs(sort === "PNL" ? r.pnl : r.volume)), 1);
  return (
    <div className="glass overflow-hidden rounded-[28px]">
      <div className="grid grid-cols-[52px_1fr_minmax(120px,220px)_120px] gap-4 border-b hairline px-6 py-3.5 text-[13px] text-mute max-md:grid-cols-[40px_1fr_110px]">
        <span>Rank</span>
        <span>Trader</span>
        <span className="max-md:hidden">{sort === "PNL" ? "Profit" : "Volume"}</span>
        <span className="text-right">{sort === "PNL" ? "P&L" : "Vol"}</span>
      </div>
      <ol>
        {list.map((t, i) => {
          const v = sort === "PNL" ? t.pnl : t.volume;
          return (
            <li key={`${t.address}-${i}`} className="row-in border-b hairline last:border-0" style={{ animationDelay: `${Math.min(i, 20) * 35}ms` }}>
              <Link
                href={`/trader/${t.address}`}
                className="group grid grid-cols-[52px_1fr_minmax(120px,220px)_120px] items-center gap-4 px-6 py-3.5 transition-colors hover:bg-aqua/[.04] max-md:grid-cols-[40px_1fr_110px]"
              >
                <span className="num text-[15px] text-mute group-hover:text-aqua">{String(t.rank || i + 1 + skip).padStart(2, "0")}</span>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar src={t.image} seed={t.address} size={36} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className="truncate transition-transform duration-300 group-hover:translate-x-1">{t.name}</span>
                      {t.verified && <Check />}
                    </span>
                    {t.x ? <span className="block truncate text-[12px] text-mute">@{t.x}</span> : <span className="num block truncate text-[12px] text-mute/70">{t.address.slice(0, 6)}…{t.address.slice(-4)}</span>}
                  </span>
                </span>
                <span className="relative h-1.5 overflow-hidden rounded-full bg-charcoal max-md:hidden">
                  <span
                    className={`bar-in absolute inset-y-0 left-0 rounded-full ${v >= 0 ? "bg-aqua/80" : "bg-down/80"}`}
                    style={{ width: `${Math.max(2, (Math.abs(v) / max) * 100)}%`, animationDelay: `${Math.min(i, 20) * 35 + 150}ms` }}
                  />
                </span>
                <span className={`num text-right text-[15px] font-semibold ${sort === "VOLUME" ? "text-bone" : t.pnl >= 0 ? "text-up" : "text-down"}`}>
                  {sort === "PNL" ? usd(t.pnl, { sign: true }) : usd(t.volume)}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function FlowTable({ rows }: { rows: FlowRow[] }) {
  if (!rows.length) return <Empty msg="No $1K+ bets in this window yet." />;
  return (
    <div className="glass overflow-hidden rounded-[28px]">
      <div className="grid grid-cols-[48px_1fr_120px_120px] gap-3 border-b hairline px-6 py-3.5 text-[13px] text-mute max-sm:grid-cols-[40px_1fr_110px]">
        <span>#</span>
        <span>Trader · biggest bet</span>
        <span className="text-right text-bone">Money in</span>
        <span className="text-right max-sm:hidden">Bets</span>
      </div>
      <ol>
        {rows.map((r, i) => (
          <li key={r.address} className="row-in border-b hairline last:border-0" style={{ animationDelay: `${Math.min(i, 20) * 35}ms` }}>
            <Link
              href={`/trader/${r.address}`}
              className="grid grid-cols-[48px_1fr_120px_120px] items-center gap-3 px-6 py-3.5 transition-colors hover:bg-aqua/[.04] max-sm:grid-cols-[40px_1fr_110px]"
            >
              <span className={`num text-[15px] ${i < 3 ? "font-bold text-aqua" : "text-mute"}`}>{String(i + 1).padStart(2, "0")}</span>
              <span className="flex min-w-0 items-center gap-3">
                <Avatar src={r.image} seed={r.address} size={34} />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{r.name}</span>
                  <span className="block truncate text-[12px] text-mute">
                    {usd(r.biggest)} on {r.lastTitle || "—"}
                  </span>
                </span>
              </span>
              <span className="num text-right text-[15px] font-semibold">{usd(r.bought + r.sold)}</span>
              <span className="num text-right text-[14px] text-mute max-sm:hidden">
                {r.trades} <span className="text-[12px]">({usd(r.bought)} in / {usd(r.sold)} out)</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-label="Verified" className="shrink-0">
      <circle cx="8" cy="8" r="8" fill="#74FFED" />
      <path d="M4.6 8.2 7 10.4 11.4 5.8" fill="none" stroke="#0a0f26" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Empty({ msg = "Polymarket didn’t return data for this board. Try another filter or refresh in a moment." }: { msg?: string }) {
  return <div className="glass rounded-[28px] px-5 py-14 text-center text-mute">{msg}</div>;
}
