import Link from "next/link";
import type { Trader } from "@/lib/pm";
import { usd } from "@/lib/format";
import { Avatar } from "./Avatar";
import { SplitFlap } from "./SplitFlap";

/** Top three as a departure-board readout: the leader wide, profit on split-flap tiles. */
export function Podium({ rows }: { rows: Trader[] }) {
  const top = rows.slice(0, 3);
  if (top.length < 3) return null;
  return (
    <div className="grid border border-t-line bg-t-panel md:grid-cols-[1.4fr_1fr_1fr]">
      {top.map((t, i) => {
        const first = i === 0;
        return (
          <Link
            key={t.address}
            href={`/trader/${t.address}`}
            className={`group relative flex flex-col justify-between gap-6 border-t-line p-6 transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-t-olive/60 ${
              i > 0 ? "border-t md:border-l md:border-t-0" : ""
            } ${first ? "bg-t-olive" : ""}`}
          >
            <div className="t-mono flex items-center justify-between text-[12px]">
              <span className={first ? "text-t-amber" : "text-t-dim"}>#{t.rank || i + 1}</span>
              <span className="text-t-dim transition-colors group-hover:text-t-amber">open →</span>
            </div>
            <div className="flex items-center gap-4">
              <Avatar src={t.image} seed={t.address} size={first ? 64 : 48} />
              <div className="min-w-0">
                <div className={`truncate font-semibold text-t-text ${first ? "text-[22px]" : "text-[17px]"}`}>{t.name}</div>
                <div className="t-mono truncate text-[12px] text-t-dim">{t.x ? `@${t.x}` : `${t.address.slice(0, 6)}…${t.address.slice(-4)}`}</div>
              </div>
            </div>
            <div>
              <div className={`t-mono font-semibold ${first ? "text-[36px]" : "text-[26px]"} ${t.pnl >= 0 ? "text-t-up" : "text-t-down"}`}>
                <SplitFlap value={usd(t.pnl, { sign: true })} />
              </div>
              <div className="t-mono mt-2 text-[12px] text-t-dim">volume {usd(t.volume)}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
