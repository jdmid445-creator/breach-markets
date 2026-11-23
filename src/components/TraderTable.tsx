import Link from "next/link";
import type { Trader, FlowRow } from "@/lib/pm";
import { usd } from "@/lib/format";
import { Avatar } from "./Avatar";

export function TraderTable({ rows, sort }: { rows: Trader[]; sort: "PNL" | "VOLUME" }) {
  if (!rows.length) return <Empty />;
  return (
    <div className="overflow-hidden rounded-2xl border hairline bg-coal">
      <div className="grid grid-cols-[48px_1fr_120px_120px] gap-3 border-b hairline px-5 py-3 text-[12px] uppercase tracking-[0.12em] text-mute max-sm:grid-cols-[40px_1fr_100px]">
        <span>#</span>
        <span>Trader</span>
        <span className={`text-right ${sort === "PNL" ? "text-bone" : ""}`}>Profit</span>
        <span className={`text-right max-sm:hidden ${sort === "VOLUME" ? "text-bone" : ""}`}>Volume</span>
      </div>
      <ol>
        {rows.map((t, i) => (
          <li key={`${t.address}-${i}`} className="border-b hairline last:border-0">
            <Link
              href={`/trader/${t.address}`}
              className="grid grid-cols-[48px_1fr_120px_120px] items-center gap-3 px-5 py-3 transition-colors hover:bg-charcoal/60 max-sm:grid-cols-[40px_1fr_100px]"
            >
              <span className={`num text-[15px] ${i < 3 ? "font-bold text-tang" : "text-mute"}`}>{t.rank || i + 1}</span>
              <span className="flex min-w-0 items-center gap-3">
                <Avatar src={t.image} seed={t.address} size={34} />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 truncate font-semibold">
                    <span className="truncate">{t.name}</span>
                    {t.verified && <Check />}
                  </span>
                  {t.x && <span className="block truncate text-[12px] text-mute">@{t.x}</span>}
                </span>
              </span>
              <span className={`num text-right text-[15px] font-semibold ${t.pnl >= 0 ? "text-up" : "text-down"}`}>
                {usd(t.pnl, { sign: true })}
              </span>
              <span className="num text-right text-[14px] text-mute max-sm:hidden">{usd(t.volume)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function FlowTable({ rows }: { rows: FlowRow[] }) {
  if (!rows.length) return <Empty msg="No $1K+ bets in this window yet." />;
  return (
    <div className="overflow-hidden rounded-2xl border hairline bg-coal">
      <div className="grid grid-cols-[48px_1fr_120px_120px] gap-3 border-b hairline px-5 py-3 text-[12px] uppercase tracking-[0.12em] text-mute max-sm:grid-cols-[40px_1fr_110px]">
        <span>#</span>
        <span>Trader · biggest bet</span>
        <span className="text-right text-bone">Money in</span>
        <span className="text-right max-sm:hidden">Bets</span>
      </div>
      <ol>
        {rows.map((r, i) => (
          <li key={r.address} className="border-b hairline last:border-0">
            <Link
              href={`/trader/${r.address}`}
              className="grid grid-cols-[48px_1fr_120px_120px] items-center gap-3 px-5 py-3 transition-colors hover:bg-charcoal/60 max-sm:grid-cols-[40px_1fr_110px]"
            >
              <span className={`num text-[15px] ${i < 3 ? "font-bold text-tang" : "text-mute"}`}>{i + 1}</span>
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
      <circle cx="8" cy="8" r="8" fill="#105BFF" />
      <path d="M4.6 8.2 7 10.4 11.4 5.8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Empty({ msg = "Polymarket didn’t return data for this board. Try another filter or refresh in a moment." }: { msg?: string }) {
  return <div className="rounded-2xl border hairline bg-coal px-5 py-14 text-center text-mute">{msg}</div>;
}
