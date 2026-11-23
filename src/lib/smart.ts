import { leaderboard, positions, type Trader, type Position } from "./pm";

export type Consensus = {
  key: string;
  title: string;
  outcome: string;
  eventSlug: string;
  slug: string;
  icon: string;
  price: number;
  value: number;
  bucket: Position["bucket"];
  whales: { t: Trader; p: Position }[];
};

/** Markets where 2+ of the month's top traders hold the same side, most shared first. */
export async function podConsensus(top = 15): Promise<Consensus[]> {
  const leaders = ((await leaderboard({ period: "month", category: "overall", sort: "PNL", limit: top })) ?? []).filter((t) => t.address);
  const books = await Promise.all(leaders.map(async (t) => ({ t, pos: await positions(t.address, 20) })));
  const m = new Map<string, Consensus>();
  for (const { t, pos } of books)
    for (const p of pos) {
      if (p.value < 1000) continue;
      const key = `${p.conditionId}:${p.outcome}`;
      const a =
        m.get(key) ??
        ({ key, title: p.title, outcome: p.outcome, eventSlug: p.eventSlug, slug: p.slug, icon: p.icon ?? "", price: p.curPrice, value: 0, bucket: p.bucket, whales: [] } as Consensus);
      a.value += p.value;
      a.whales.push({ t, p });
      m.set(key, a);
    }
  return [...m.values()].filter((a) => a.whales.length >= 2).sort((a, b) => b.whales.length - a.whales.length || b.value - a.value);
}
