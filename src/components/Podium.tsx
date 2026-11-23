import Link from "next/link";
import type { Trader } from "@/lib/pm";
import { Avatar } from "./Avatar";
import { CountUp, Tilt } from "./fx";

/** Top three traders as tilting cards, the leader raised in the middle. */
export function Podium({ rows }: { rows: Trader[] }) {
  const top = rows.slice(0, 3);
  if (top.length < 3) return null;
  const order = [top[1], top[0], top[2]];
  const place = [2, 1, 3];
  return (
    <div className="grid items-end gap-4 md:grid-cols-3">
      {order.map((t, i) => {
        const first = place[i] === 1;
        return (
          <div key={t.address}>
            <Tilt className="group rounded-[28px]">
              <Link
                href={`/trader/${t.address}`}
                className={`relative block overflow-hidden rounded-[28px] border px-6 text-center ${
                  first
                    ? "border-line bg-charcoal pb-9 pt-10"
                    : "border-line bg-coal/80 pb-7 pt-8"
                }`}
              >
                <span className={`num absolute left-5 top-4 text-[13px] ${first ? "text-aqua" : "text-mute"}`}>#{place[i]}</span>
                <div className="mx-auto w-fit rounded-full p-1 ring-1 ring-aqua/30">
                  <Avatar src={t.image} seed={t.address} size={first ? 84 : 64} />
                </div>
                <div className="mt-4 truncate text-[17px] font-semibold">{t.name}</div>
                {t.x && <div className="truncate text-[12.5px] text-mute">@{t.x}</div>}
                <div className={`num mt-5 font-semibold ${first ? "text-[34px]" : "text-[26px]"} ${t.pnl >= 0 ? "text-up" : "text-down"}`}>
                  {t.pnl >= 0 ? "+" : "−"}
                  <CountUp value={Math.abs(t.pnl)} format="usd" />
                </div>
                <div className="num mt-1 text-[12px] text-mute">
                  vol <CountUp value={t.volume} format="usd" />
                </div>
              </Link>
            </Tilt>
          </div>
        );
      })}
    </div>
  );
}
