export function usd(n: number, opts: { sign?: boolean; compact?: boolean } = {}) {
  const { sign = false, compact = true } = opts;
  const abs = Math.abs(n);
  let s: string;
  if (compact && abs >= 1e9) s = `$${(abs / 1e9).toFixed(2)}B`;
  else if (compact && abs >= 1e6) s = `$${(abs / 1e6).toFixed(2)}M`;
  else if (compact && abs >= 1e4) s = `$${(abs / 1e3).toFixed(1)}K`;
  else s = `$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  // $10.0K → $10K, $5.80M → $5.8M, $5.00M → $5M
  s = s.replace(/\.0+(?=[KMB])/, "").replace(/(\.\d)0(?=[MB])/, "$1");
  if (n < 0) return `−${s}`;
  return sign && n > 0 ? `+${s}` : s;
}

export function cents(p: number) {
  return `${(p * 100).toFixed(p < 0.1 || p > 0.9 ? 1 : 0)}¢`;
}

export function ago(ts: number, now = Date.now() / 1000) {
  const d = Math.max(0, Math.floor(now - ts));
  if (d < 60) return `${d}s`;
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return `${Math.floor(d / 86400)}d`;
}

/** Whale tier by bet size. */
export function tier(n: number): { label: string; cls: string } {
  if (n >= 250_000) return { label: "Blue whale", cls: "tier-blue" };
  if (n >= 100_000) return { label: "Humpback", cls: "tier-hump" };
  if (n >= 50_000) return { label: "Orca", cls: "tier-orca" };
  return { label: "Whale", cls: "tier-whale" };
}

export const pmMarket = (eventSlug: string, slug: string) =>
  `https://polymarket.com/event/${eventSlug || slug}`;
export const pmProfile = (addr: string) => `https://polymarket.com/profile/${addr}`;
