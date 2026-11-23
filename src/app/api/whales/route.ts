import { NextResponse } from "next/server";
import { bigTrades } from "@/lib/pm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const min = Math.max(1000, Number(searchParams.get("min")) || 10000);
  const trades = await bigTrades(min, 100, 4);
  if (!trades) return NextResponse.json({ ok: false, trades: [] }, { status: 502 });
  return NextResponse.json(
    { ok: true, trades },
    { headers: { "cache-control": "s-maxage=4, stale-while-revalidate=10" } },
  );
}
