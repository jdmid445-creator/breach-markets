# Breach — product truth

## What it is
Breach is a free, no-login Polymarket whale tracker at breach-markets.vercel.app. It watches every Polymarket trade of $10,000 or more and shows who placed it and how good that trader is.

## Mechanism (the one thing it does that others don't)
Every big bet is joined to the bettor's standing: if the trader is in Polymarket's top 1,000 by profit (all-time or this month), the alert carries their rank in bold next to their name. Size alone is noise; size plus a proven track record is signal.

## Audience
Polymarket bettors and crypto-native traders, mostly 18–30, often on a laptop with Polymarket open in another tab, or on a phone between classes. They follow sports, politics and crypto markets and want to copy or fade sharp money fast.

## Surfaces
- Home (/): scroll-driven intro film (dive → breach → BREACH wordmark), then the desk: live whale tape, sonar of recent bets, money-by-market-type, top boards.
- Whale alerts (/live): live feed of $10k+ trades, filters (market type, side, min size, ranked only), browser notifications, pause.
- Leaderboards (/leaderboard): profit or volume, by category (overall, politics, sports, crypto, esports, culture, economics, finance, tech, weather, mentions), per sport, windows 1H/24H/7D/30D/all.
- Smart money (/smart-money): markets where two or more of the top 30 monthly traders hold the same side.
- Trader profile (/trader/[address]): rank per window, P&L, open positions, recent trades, category mix.
- ⌘K search for any trader.

## Data truth
Polymarket Data API v2, public, no auth. Whale threshold $10k. Ranks from /v2/leaderboard top 1,000. Nothing on the site is invented; mock data is dev-only.

## Brand commitments (pinned by the owner)
- Logo: Royal Blue (#105BFF) rounded tile with a bone-colored whale tail, centered. Do not change.
- Intro film (ScrollIntro) is final. Do not change it; the nav stays hidden until it ends.
- Palette family: Silent Power — Egyptian Blue #03203D, Stone Blue #639CC5, Scarlet #EB2F33 accent. The owner rejected an amber terminal palette as unprofessional.
- Must not look AI-generated. Owner's bar: @heydamir "unslop" work and his 20-point unslop checklist.
- Wants it heavily animated and interactive, but purposeful.

## Out of scope
Trading, wallets, accounts, paid tiers.
