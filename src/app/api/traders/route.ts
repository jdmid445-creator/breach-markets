import { NextResponse } from "next/server";
import { leaderboard } from "@/lib/pm";

export const revalidate = 900;

/** Top 1000 all-time traders, for the ⌘K search palette. */
export async function GET() {
  const rows = (await leaderboard({ period: "all", category: "overall", sort: "PNL", limit: 1000 })) ?? [];
  return NextResponse.json(
    { traders: rows.map((t) => ({ address: t.address, name: t.name, rank: t.rank, pnl: t.pnl })) },
    { headers: { "cache-control": "s-maxage=900, stale-while-revalidate=3600" } },
  );
}
