// Polymarket Data API v2 client (server-side). Public, no key required.
// Docs: https://docs.polymarket.com/api-reference/data-api/overview
import { classify, type Bucket } from "./sports";

const DATA = "https://data-api.polymarket.com/v2";

export type Period = "day" | "week" | "month" | "all";
export type SortBy = "PNL" | "VOLUME";

export const CATEGORIES = [
  { id: "overall", label: "Overall" },
  { id: "politics", label: "Politics" },
  { id: "sports", label: "Sports" },
  { id: "crypto", label: "Crypto" },
  { id: "esports", label: "Esports" },
  { id: "culture", label: "Culture" },
  { id: "economics", label: "Economics" },
  { id: "finance", label: "Finance" },
  { id: "tech", label: "Tech" },
  { id: "weather", label: "Weather" },
  { id: "mentions", label: "Mentions" },
] as const;

type Raw = Record<string, unknown>;
const num = (v: unknown): number => {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const pick = (r: Raw, ...keys: string[]) => {
  for (const k of keys) if (r[k] !== undefined && r[k] !== null) return r[k];
  return undefined;
};

async function get<T = unknown>(path: string, params: Record<string, string | number | boolean | undefined>, revalidate = 30): Promise<T | null> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") qs.set(k, String(v));
  if (process.env.BREACH_MOCK === "1") {
    const { mock } = await import("./mock");
    return mock(path, params) as T;
  }
  try {
    const res = await fetch(`${DATA}${path}?${qs}`, {
      next: { revalidate },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ---------------- Leaderboard ---------------- */

export type Trader = {
  rank: number;
  address: string;
  name: string;
  image: string;
  x: string;
  verified: boolean;
  pnl: number;
  volume: number;
};

function toTrader(r: Raw, i: number): Trader {
  const address = str(pick(r, "user_id", "proxy_wallet", "proxyWallet", "address"));
  return {
    rank: num(pick(r, "rank")) || i + 1,
    address,
    name: displayName(str(pick(r, "user_name", "userName", "name")), address),
    image: str(pick(r, "profile_image", "profileImage")),
    x: str(pick(r, "x_username", "xUsername")),
    verified: Boolean(pick(r, "verified", "verifiedBadge")),
    pnl: num(pick(r, "pnl")),
    volume: num(pick(r, "volume", "vol")),
  };
}

export async function leaderboard(opts: { period: Period; category: string; sort: SortBy; limit?: number }): Promise<Trader[] | null> {
  const json = await get<{ data?: Raw[] }>("/leaderboard", {
    time_period: opts.period,
    category: opts.category,
    sort_by: opts.sort,
    limit: opts.limit ?? 100,
  }, 60);
  if (!json || !Array.isArray(json.data)) return null;
  return json.data.map(toTrader);
}

export type Standing = { period: Period; pnl: number; volume: number; rankPnl: number | null; rankVolume: number | null };

export async function standing(address: string, period: Period, category = "overall"): Promise<Standing | null> {
  const json = await get<{ data?: Raw | null }>("/leaderboard", { user: address, time_period: period, category }, 120);
  const d = json?.data;
  if (!d) return null;
  const rp = pick(d, "rank_pnl");
  const rv = pick(d, "rank_volume");
  return {
    period,
    pnl: num(pick(d, "pnl")),
    volume: num(pick(d, "volume")),
    rankPnl: rp == null || num(rp) === 0 ? null : num(rp),
    rankVolume: rv == null || num(rv) === 0 ? null : num(rv),
  };
}

export async function profile(address: string): Promise<{ name: string; image: string; x: string; verified: boolean } | null> {
  const json = await get<{ data?: Raw | null }>("/leaderboard", { user: address, time_period: "all" }, 300);
  const d = json?.data;
  if (!d) return null;
  return {
    name: displayName(str(pick(d, "user_name")), address),
    image: str(pick(d, "profile_image")),
    x: str(pick(d, "x_username")),
    verified: Boolean(pick(d, "verified")),
  };
}

/* ---------------- Trades ---------------- */

export type Trade = {
  id: string;
  wallet: string;
  name: string;
  image: string;
  side: "BUY" | "SELL";
  outcome: string;
  price: number;
  size: number;
  usd: number;
  ts: number;
  title: string;
  slug: string;
  eventSlug: string;
  icon: string;
  tx: string;
  bucket: Bucket;
  /** Best leaderboard rank (all-time or 30-day profit), null if unranked. */
  rank: number | null;
  rankWindow: "all" | "month" | null;
};

function toTrade(r: Raw): Trade {
  const size = num(pick(r, "size"));
  const price = num(pick(r, "price"));
  const wallet = str(pick(r, "proxy_wallet", "proxyWallet"));
  const tx = str(pick(r, "transaction_hash", "transactionHash"));
  const token = str(pick(r, "token_id", "asset"));
  const title = str(pick(r, "title"));
  const slug = str(pick(r, "slug"));
  const eventSlug = str(pick(r, "event_slug", "eventSlug"));
  return {
    id: `${tx}:${token}:${wallet}:${size}`,
    wallet,
    name: displayName(str(pick(r, "name")) || str(pick(r, "pseudonym")), wallet),
    image: str(pick(r, "profile_image_optimized", "profile_image", "profileImage")),
    side: str(pick(r, "side")).toUpperCase() === "SELL" ? "SELL" : "BUY",
    outcome: str(pick(r, "outcome")),
    price,
    size,
    usd: size * price,
    ts: num(pick(r, "timestamp")),
    title,
    slug,
    eventSlug,
    icon: str(pick(r, "icon")),
    tx,
    bucket: classify(`${eventSlug} ${slug}`, title),
    rank: null,
    rankWindow: null,
  };
}

/* ---------------- Rank lookup ---------------- */

type RankEntry = { rank: number; window: "all" | "month" };

/** Wallet -> best rank across the all-time and 30-day profit boards (top 1000 each). */
export async function rankMap(): Promise<Map<string, RankEntry>> {
  const [all, month] = await Promise.all([
    get<{ data?: Raw[] }>("/leaderboard", { time_period: "all", sort_by: "PNL", limit: 1000 }, 900),
    get<{ data?: Raw[] }>("/leaderboard", { time_period: "month", sort_by: "PNL", limit: 1000 }, 600),
  ]);
  const m = new Map<string, RankEntry>();
  const add = (rows: Raw[] | undefined, window: "all" | "month") =>
    (rows ?? []).forEach((r, i) => {
      const a = str(pick(r, "user_id", "proxy_wallet", "proxyWallet")).toLowerCase();
      if (!a) return;
      const rank = num(pick(r, "rank")) || i + 1;
      const cur = m.get(a);
      if (!cur || rank < cur.rank) m.set(a, { rank, window });
    });
  add(all?.data, "all");
  add(month?.data, "month");
  return m;
}

export function withRanks(trades: Trade[], ranks: Map<string, RankEntry>): Trade[] {
  return trades.map((t) => {
    const r = ranks.get(t.wallet.toLowerCase());
    return r ? { ...t, rank: r.rank, rankWindow: r.window } : t;
  });
}

/** Global trade feed filtered by minimum cash size (USDC). */
export async function bigTrades(minUsd: number, limit = 100, revalidate = 5): Promise<Trade[] | null> {
  const json = await get<{ data?: Raw[] }>("/trades", {
    filter_type: "CASH",
    filter_amount: minUsd,
    taker_only: true,
    limit,
  }, revalidate);
  if (!json || !Array.isArray(json.data)) return null;
  const trades = json.data.map(toTrade).sort((a, b) => b.ts - a.ts);
  const ranks = await rankMap().catch(() => new Map<string, RankEntry>());
  return withRanks(trades, ranks);
}

/** Walk the global feed backwards until `sinceTs`, capped at `maxPages`. */
export async function tradesSince(minUsd: number, sinceTs: number, maxPages = 5): Promise<Trade[]> {
  const out: Trade[] = [];
  let cursor: string | undefined;
  for (let p = 0; p < maxPages; p++) {
    const json = await get<{ data?: Raw[]; pagination?: { next_cursor?: string | null } }>("/trades", {
      filter_type: "CASH",
      filter_amount: minUsd,
      taker_only: true,
      limit: 1000,
      cursor,
    }, 60);
    if (!json || !Array.isArray(json.data) || json.data.length === 0) break;
    const rows = json.data.map(toTrade);
    out.push(...rows);
    const oldest = Math.min(...rows.map((r) => r.ts));
    cursor = json.pagination?.next_cursor ?? undefined;
    if (!cursor || oldest < sinceTs) break;
  }
  return out.filter((t) => t.ts >= sinceTs);
}

export async function userTrades(address: string, limit = 40): Promise<Trade[]> {
  const json = await get<{ data?: Raw[] }>("/trades", { user: address, limit }, 30);
  return json && Array.isArray(json.data) ? json.data.map(toTrade) : [];
}

/* ---------------- Positions ---------------- */

export type Position = {
  conditionId: string;
  title: string;
  slug: string;
  eventSlug: string;
  icon: string;
  outcome: string;
  size: number;
  avgPrice: number;
  curPrice: number;
  value: number;
  cost: number;
  pnl: number;
  bucket: Bucket;
};

function toPosition(r: Raw): Position {
  const size = num(pick(r, "size", "shares", "tokens", "balance", "quantity"));
  const avgPrice = num(pick(r, "avg_price", "avgPrice", "average_price"));
  const curPrice = num(pick(r, "current_price", "cur_price", "curPrice", "price"));
  const value = num(pick(r, "current_value", "currentValue")) || size * curPrice;
  const cost = num(pick(r, "entry_cost_usdc", "initial_value", "initialValue")) || size * avgPrice;
  const unreal = pick(r, "unrealized_pnl", "cash_pnl", "cashPnl");
  const title = str(pick(r, "title"));
  const slug = str(pick(r, "slug"));
  const eventSlug = str(pick(r, "event_slug", "eventSlug"));
  return {
    conditionId: str(pick(r, "condition_id", "conditionId")),
    title,
    slug,
    eventSlug,
    icon: str(pick(r, "icon")),
    outcome: str(pick(r, "outcome")),
    size,
    avgPrice,
    curPrice,
    value,
    cost,
    pnl: unreal !== undefined ? num(unreal) : value - cost,
    bucket: classify(`${eventSlug} ${slug}`, title),
  };
}

export async function positions(address: string, limit = 25): Promise<Position[]> {
  let json = await get<{ data?: Raw[] }>("/positions", { user: address, limit, sort_by: "CURRENT_VALUE" }, 120);
  if (!json || !Array.isArray(json.data)) json = await get<{ data?: Raw[] }>("/positions", { user: address, limit }, 120);
  if (!json || !Array.isArray(json.data)) return [];
  return json.data
    .map(toPosition)
    .filter((p) => p.value > 0.5 || p.size > 0)
    .sort((a, b) => b.value - a.value);
}

/* ---------------- Aggregations ---------------- */

export type FlowRow = {
  address: string;
  name: string;
  image: string;
  bought: number;
  sold: number;
  trades: number;
  biggest: number;
  lastTitle: string;
};

/** Rank wallets by whale money deployed in a window (used for 1H + per-sport boards). */
export function flowBoard(trades: Trade[]): FlowRow[] {
  const m = new Map<string, FlowRow>();
  for (const t of trades) {
    const r = m.get(t.wallet) ?? { address: t.wallet, name: t.name, image: t.image, bought: 0, sold: 0, trades: 0, biggest: 0, lastTitle: t.title };
    if (t.side === "BUY") r.bought += t.usd;
    else r.sold += t.usd;
    r.trades += 1;
    if (t.usd > r.biggest) {
      r.biggest = t.usd;
      r.lastTitle = t.title;
    }
    m.set(t.wallet, r);
  }
  return [...m.values()].sort((a, b) => b.bought + b.sold - (a.bought + a.sold));
}

const looksLikeAddr = (s: string) => /^0x[a-fA-F0-9]{20,}/.test(s.trim());
export function displayName(name: string | undefined, addr: string) {
  const n = (name ?? "").trim();
  return n && !looksLikeAddr(n) ? n : short(addr);
}

export function short(addr: string) {
  return addr && addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr || "anon";
}
