"use client";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { Trader, FlowRow } from "@/lib/pm";
import { usd } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { Empty, Verified, Pnl } from "./ui";

/** Small board for the desk: rank, name, profit bar, profit. */
export function MiniBoard({ rows }: { rows: Trader[] | null }) {
  const list = rows ?? [];
  if (!list.length) return <Empty>Polymarket didn’t return this board. It refreshes every 30 seconds.</Empty>;
  const max = Math.max(...list.map((r) => Math.abs(r.pnl)), 1);
  return (
    <ol>
      {list.map((t, i) => (
        <li key={t.address} className="band">
          <Link href={`/trader/${t.address}`} className="row grid grid-cols-[22px_26px_1fr_88px] items-center gap-3 px-3 py-2.5 sm:px-4">
            <span className={`fig text-[13px] ${i < 3 ? "font-semibold text-fg" : "text-faint"}`}>{i + 1}</span>
            <Avatar src={t.image} seed={t.address} name={t.name} size={26} />
            <span className="min-w-0">
              <span className="block truncate text-[14px] text-fg">{t.name}</span>
              <span className="mt-1.5 block h-[3px] rounded-full bg-reef">
                <span className="bar-in block h-full rounded-full bg-stone" style={{ width: `${Math.max(3, (Math.abs(t.pnl) / max) * 100)}%`, animationDelay: `${i * 40}ms` }} />
              </span>
            </span>
            <Pnl value={t.pnl} className="text-right text-[14px]">
              {usd(t.pnl, { sign: true })}
            </Pnl>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** The full leaderboard. Sortable by profit or volume through the header links. */
export function TraderTable({ rows, sort, sortHrefs, skip = 0 }: { rows: Trader[]; sort: "PNL" | "VOLUME"; sortHrefs: { PNL: string; VOLUME: string }; skip?: number }) {
  const reduce = useReducedMotion();
  if (!rows.length) return <Empty>Polymarket didn’t return data for this board. Try another window or refresh in a moment.</Empty>;
  const max = Math.max(...rows.map((r) => Math.abs(sort === "PNL" ? r.pnl : r.volume)), 1);
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="text-[12.5px] text-faint">
          <th className="whitespace-nowrap w-[52px] px-3 sm:w-[72px] py-2.5 sm:px-4 font-normal">Rank</th>
          <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 font-normal">Trader</th>
          <th className="whitespace-nowrap w-[26%] px-3 py-2.5 sm:px-4 font-normal max-md:hidden" aria-hidden />
          <SortTh active={sort === "PNL"} href={sortHrefs.PNL}>
            Profit
          </SortTh>
          <SortTh active={sort === "VOLUME"} href={sortHrefs.VOLUME} className="max-sm:hidden">
            Volume
          </SortTh>
        </tr>
      </thead>
      <tbody>
        {rows.slice(skip).map((t, j) => {
          const i = j + skip;
          const v = sort === "PNL" ? t.pnl : t.volume;
          const rank = t.rank || i + 1;
          const podium = rank <= 3;
          return (
            <motion.tr
              key={`${t.address}-${i}`}
              initial={reduce ? false : { opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "0px 0px -5% 0px" }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: Math.min(j, 12) * 0.035 }}
              className="spot-row band"
            >
              <td className="px-3 py-3 sm:px-4">
                <span className={`fig ${podium ? "text-[20px] font-semibold text-fg" : "text-[15px] text-mist"}`}>{rank}</span>
              </td>
              <td className="w-full max-w-0 px-3 py-3 sm:px-4">
                <Link href={`/trader/${t.address}`} className="group flex min-w-0 items-center gap-3">
                  <Avatar src={t.image} seed={t.address} name={t.name} size={36} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className={`truncate group-hover:underline ${podium ? "text-[16px] font-semibold" : "text-[14.5px] font-semibold"} text-fg`}>{t.name}</span>
                      {t.verified && <Verified />}
                    </span>
                    <span className="block truncate text-[12.5px] text-faint">{t.x ? `@${t.x}` : `${t.address.slice(0, 6)}…${t.address.slice(-4)}`}</span>
                  </span>
                </Link>
              </td>
              <td className="px-3 py-3 sm:px-4 max-md:hidden">
                <span className="block h-[5px] rounded-full bg-reef">
                  <span
                    className={`bar-in block h-full rounded-full ${v >= 0 ? "bg-stone" : "bg-faint"}`}
                    style={{ width: `${Math.max(2, (Math.abs(v) / max) * 100)}%`, animationDelay: `${Math.min(i, 15) * 25}ms` }}
                  />
                </span>
              </td>
              <td className="px-3 py-3 sm:px-4 text-right">
                <Pnl value={t.pnl} className={podium ? "text-[17px]" : "text-[15px]"}>
                  {usd(t.pnl, { sign: true })}
                </Pnl>
              </td>
              <td className="fig px-3 py-3 sm:px-4 text-right text-[14px] text-mist max-sm:hidden">{usd(t.volume)}</td>
            </motion.tr>
          );
        })}
      </tbody>
    </table>
  );
}

function SortTh({ active, href, children, className = "" }: { active: boolean; href: string; children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2.5 sm:px-4 text-right font-normal ${className}`} aria-sort={active ? "descending" : "none"}>
      <Link href={href} scroll={false} className={`press inline-flex items-center gap-1 ${active ? "font-semibold text-fg" : "hover:text-fg"}`}>
        {children}
        {active && <ArrowDown size={13} />}
      </Link>
    </th>
  );
}

/** Flow board: who moved the most money, for cuts Polymarket doesn't rank. */
export function FlowTable({ rows, offset = 0 }: { rows: FlowRow[]; offset?: number }) {
  if (!rows.length) return <Empty>No $1K+ bets in this window yet.</Empty>;
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="text-[12.5px] text-faint">
          <th className="whitespace-nowrap w-[52px] px-3 sm:w-[72px] py-2.5 sm:px-4 font-normal">Rank</th>
          <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 font-normal">Trader and biggest bet</th>
          <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 text-right font-normal">Money moved</th>
          <th className="whitespace-nowrap px-3 py-2.5 sm:px-4 text-right font-normal max-sm:hidden">Bets</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.address} className="spot-row band">
            <td className={`fig px-3 py-3 sm:px-4 ${i + offset < 3 ? "text-[20px] font-semibold text-fg" : "text-[15px] text-mist"}`}>{i + 1 + offset}</td>
            <td className="w-full max-w-0 px-3 py-3 sm:px-4">
              <Link href={`/trader/${r.address}`} className="group flex min-w-0 items-center gap-3">
                <Avatar src={r.image} seed={r.address} name={r.name} size={34} />
                <span className="min-w-0">
                  <span className="block truncate text-[14.5px] font-semibold text-fg group-hover:underline">{r.name}</span>
                  <span className="block truncate text-[12.5px] text-faint">
                    <span className="fig text-mist">{usd(r.biggest)}</span> on {r.lastTitle || "—"}
                  </span>
                </span>
              </Link>
            </td>
            <td className="fig px-3 py-3 sm:px-4 text-right text-[15px] font-semibold text-fg">{usd(r.bought + r.sold)}</td>
            <td className="fig px-3 py-3 sm:px-4 text-right text-[13.5px] text-mist max-sm:hidden">
              {r.trades}
              <span className="block text-[12px] text-faint">
                {usd(r.bought)} in, {usd(r.sold)} out
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
