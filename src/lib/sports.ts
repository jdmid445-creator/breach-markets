// Classify a market into a bucket from its slugs/title.
// Polymarket's leaderboard only offers one "sports" category, so per-sport
// boards are computed from the trade feed using this classifier.

export const SPORTS = [
  { id: "nfl", label: "NFL", re: /\bnfl\b|super-?bowl|\b(chiefs|eagles|bills|ravens|49ers|cowboys|packers|lions)\b/ },
  { id: "nba", label: "NBA", re: /\bnba\b|\b(lakers|celtics|knicks|warriors|nuggets|thunder|bucks|76ers|heat)\b/ },
  { id: "mlb", label: "MLB", re: /\bmlb\b|world-?series|\b(yankees|dodgers|mets|astros|phillies|braves)\b/ },
  { id: "nhl", label: "NHL", re: /\bnhl\b|stanley-?cup/ },
  { id: "soccer", label: "Soccer", re: /\b(epl|premier-league|ucl|champions-league|la-?liga|serie-a|bundesliga|ligue-1|mls|fifa|world-cup|uefa)\b/ },
  { id: "cfb", label: "College FB", re: /\b(cfb|ncaaf|college-football|cfp)\b/ },
  { id: "cbb", label: "College BB", re: /\b(cbb|ncaab|march-madness|final-four)\b/ },
  { id: "tennis", label: "Tennis", re: /\b(atp|wta|tennis|wimbledon|us-open-tennis|roland-garros|australian-open)\b/ },
  { id: "ufc", label: "UFC / Boxing", re: /\b(ufc|mma|boxing|bout)\b/ },
  { id: "golf", label: "Golf", re: /\b(pga|golf|masters|ryder-cup|liv)\b/ },
  { id: "f1", label: "F1", re: /\b(f1|formula-1|grand-prix)\b/ },
] as const;

export type SportId = (typeof SPORTS)[number]["id"];
export type Bucket = SportId | "politics" | "crypto" | "other";

const POLITICS = /\b(election|president|trump|senate|house|congress|governor|mayor|primary|democrat|republican|gop|biden|vance|newsom|parliament|prime-minister|fed-chair|supreme-court|cabinet|tariff|impeach)\b/;
const CRYPTO = /\b(bitcoin|btc|ethereum|eth|solana|sol|xrp|doge|crypto|memecoin|pump-fun|up-or-down|updown)\b/;

export function classify(slugs: string, title: string): Bucket {
  const s = `${slugs} ${title}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "-");
  const hay = s.replace(/-/g, " ").replace(/\s+/g, " ");
  const both = `${s} ${hay}`;
  for (const sp of SPORTS) if (sp.re.test(both)) return sp.id;
  if (POLITICS.test(both)) return "politics";
  if (CRYPTO.test(both)) return "crypto";
  return "other";
}

export const isSport = (b: Bucket) => SPORTS.some((s) => s.id === b);

export function bucketLabel(b: Bucket) {
  const sp = SPORTS.find((s) => s.id === b);
  if (sp) return sp.label;
  return b === "politics" ? "Politics" : b === "crypto" ? "Crypto" : "Other";
}
