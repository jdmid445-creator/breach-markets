import { NextResponse } from "next/server";
import { CATEGORIES, leaderboard, tradesSince, flowBoard, type Period } from "@/lib/pm";
import { SPORTS } from "@/lib/sports";

export const dynamic = "force-dynamic";

/**
 * Top traders for the homepage board switcher.
 * Markets come from Polymarket's leaderboard (profit or volume). A single sport
 * isn't ranked by Polymarket, so those boards rank money moved in $1K+ bets.
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));
  const sport = SPORTS.find((s) => s.id === sp.get("sport"))?.id;
  const period = (["day", "week", "month", "all"].includes(sp.get("w") ?? "") ? sp.get("w") : "day") as Period;
  const headers = { "cache-control": "s-maxage=60, stale-while-revalidate=120" };

  if (sport) {
    const span = { day: 86400, week: 7 * 86400, month: 30 * 86400, all: 30 * 86400 }[period];
    const trades = await tradesSince(1000, Math.floor(Date.now() / 1000) - span, period === "day" ? 6 : 8);
    const rows = flowBoard(trades.filter((t) => t.bucket === sport))
      .slice(0, limit)
      .map((r, i) => ({ rank: i + 1, address: r.address, name: r.name, image: r.image, x: "", verified: false, pnl: 0, volume: r.bought + r.sold, trades: r.trades }));
    return NextResponse.json({ ok: true, mode: "flow", rows }, { headers });
  }

  const category = CATEGORIES.some((c) => c.id === sp.get("cat")) ? sp.get("cat")! : "overall";
  const sort = sp.get("sort") === "VOLUME" ? "VOLUME" : "PNL";
  const rows = await leaderboard({ period, category, sort, limit });
  if (!rows) return NextResponse.json({ ok: false, mode: "rank", rows: [] }, { status: 502 });
  return NextResponse.json({ ok: true, mode: "rank", rows }, { headers });
}
