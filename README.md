# Breach

See the whales before the market does. A Polymarket whale tracker:

- **Live whales** (`/live`): every $10K+ bet as it lands, with filters, a bubble pool, and size tiers.
- **Leaderboards** (`/leaderboard`): profit and volume by category and window (24H/7D/30D/All), plus 1H and per-sport boards computed from the trade feed.
- **Whale profiles** (`/trader/[address]`): profit by window, open positions, recent moves, and market mix.
- **Smart money** (`/smart-money`): markets where 2+ of the month's top 30 traders hold the same side.

Data comes from the public Polymarket Data API v2 (no key needed). Next.js 15 on Vercel.

```bash
npm install
npm run dev          # live data
BREACH_MOCK=1 npm run dev   # offline preview with sample data
```
