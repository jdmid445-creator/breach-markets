import { leaderboard, positions } from "./pm";

/** Markets where 2+ of the month's top traders hold the same side. */
export async function podConsensus(top = 15) {
  const leaders = ((await leaderboard({ period: "month", category: "overall", sort: "PNL", limit: top })) ?? []).filter((t) => t.address);
  const books = await Promise.all(leaders.map(async (t) => ({ t, pos: await positions(t.address, 20) })));
  const m = new Map<string, { title: string; outcome: string; whales: number; value: number }>();
  for (const { pos } of books)
    for (const p of pos) {
      if (p.value < 1000) continue;
      const k = `${p.conditionId}:${p.outcome}`;
      const a = m.get(k) ?? { title: p.title, outcome: p.outcome, whales: 0, value: 0 };
      a.whales += 1;
      a.value += p.value;
      m.set(k, a);
    }
  return [...m.values()].filter((a) => a.whales >= 2).sort((a, b) => b.whales - a.whales || b.value - a.value);
}
