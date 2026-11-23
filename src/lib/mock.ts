// Local preview data (only used when BREACH_MOCK=1). Never active in production.
const names = ["Theo4", "Fredi9999", "RepTrump", "zxgngl", "PrincessCaro", "walletmaxi", "GCottrell93", "Domer", "kch123", "HyperLiquid0xb", "SwissMiss", "Car", "ImJustKen", "50pence", "mikatrade77"];
const markets = [
  ["Will the Chiefs win Super Bowl LXI?", "nfl-super-bowl-lxi-winner", "Yes"],
  ["Lakers vs. Celtics", "nba-lal-bos-2026-11-23", "Lakers"],
  ["Fed decision in December?", "fed-decision-in-december", "No change"],
  ["Bitcoin above $120K on Dec 31?", "bitcoin-above-120k-dec-31", "Yes"],
  ["2028 Democratic nominee: Newsom?", "democratic-nominee-2028", "Yes"],
  ["Man City vs Arsenal", "epl-mci-ars-2026-11-29", "Arsenal"],
  ["UFC 320: Jones vs. Aspinall", "ufc-320-jones-aspinall", "Aspinall"],
  ["Will Trump approve a new tariff on EU?", "trump-eu-tariff-2026", "No"],
];
let seed = 7;
const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const addr = (i: number) => "0x" + (i * 2654435761 >>> 0).toString(16).padStart(8, "0").repeat(5);

export function mock(path: string, params: Record<string, unknown>) {
  const now = Math.floor(Date.now() / 1000);
  if (path === "/leaderboard") {
    if (params.user) return { data: { user_id: params.user, pnl: 182340, volume: 2.4e6, user_name: "Theo4", profile_image: "", x_username: "theo", verified: true, rank_pnl: 12, rank_volume: 40 } };
    return { data: Array.from({ length: Number(params.limit ?? 25) }, (_, i) => ({ rank: i + 1, user_id: addr(i + 1), pnl: Math.round(900000 / (i + 1) - i * 300), volume: Math.round(5e6 / (i + 1)), user_name: names[i % names.length], profile_image: "", x_username: i % 3 ? "" : names[i % names.length].toLowerCase(), verified: i % 4 === 0 })) };
  }
  if (path === "/trades") {
    seed = 7;
    return { data: Array.from({ length: 60 }, (_, i) => { const m = markets[i % markets.length]; const usd = 10000 + Math.pow(rnd(), 3) * 400000; const price = 0.15 + rnd() * 0.8; return { proxy_wallet: addr((i % 15) + 1), side: rnd() > 0.3 ? "BUY" : "SELL", token_id: String(i), condition_id: "0x" + i, size: usd / price, price, timestamp: now - i * 47, title: m[0], slug: m[1], icon: "", event_slug: m[1], outcome: m[2], outcome_index: 0, name: names[i % names.length], pseudonym: "", bio: "", profile_image: "", profile_image_optimized: "", transaction_hash: "0xtx" + i }; }), pagination: { next_cursor: null } };
  }
  if (path === "/positions") {
    return { data: markets.slice(0, 6).map((m, i) => ({ condition_id: "0x" + i, title: m[0], slug: m[1], event_slug: m[1], outcome: m[2], size: 50000 + i * 9000, avg_price: 0.42, current_price: 0.55, current_value: (50000 + i * 9000) * 0.55, entry_cost_usdc: (50000 + i * 9000) * 0.42, unrealized_pnl: (50000 + i * 9000) * 0.13 })) };
  }
  return { data: [] };
}
