# Floor

Downside coverage for spot traders on Somnia, built on dreamDEX Event Contracts.

## The idea, in plain terms

You sell fruit at a market stall. Your inventory is worth 1,000 dollars. If it rains, people stay home, your fruit spoils, and you lose money. You cannot control the weather.

Now someone next to you sells small tickets. Each costs 60 cents and pays 1 dollar if it rains today, nothing if it stays dry. That 60 cent price is the crowd's honest read on how likely rain is.

Buy enough tickets and a rainy day still hurts your fruit, but the tickets pay out and cover most of the loss. On a dry day you lose the ticket money, but your fruit sold fine. You have bought yourself a floor.

The fruit is a spot position. The rain is the asset closing below its opening price. The tickets are Down contracts on dreamDEX.

Floor is the thing that buys the tickets for you, works out how many, tells you exactly what it costs, and keeps buying fresh ones as each window rolls.

## Why this instead of a perp

The usual way to hedge is a perpetual future. Perps liquidate. Move against you far enough and the venue closes your hedge and takes your collateral, so you lose on both sides at once.

A Down contract cannot do that. It is fully collateralized, has no leverage, and no liquidation path. You paid 0.377, and 0.377 is the absolute most you can lose on it.

**Downside protection that cannot itself blow up.**

## What it does, honestly

A Down contract pays a fixed 1 tUSDC if the window closes down. It does not pay more when the move is larger. Your spot loss does scale with the size of the move.

So Floor does not claim to fully offset a loss. It covers a chosen amount against a down close. You pick the amount, Floor sizes and buys it, and shows the cost and the worst case before you commit.

## Status

Working today:

- Live window discovery, scoped to the rolling series venue and gated on on-chain status
- Coverage quoting: walks the book, snaps to the lot grid, returns cost, payout, and max loss
- Order placement — first fill landed on testnet at 0.377 for BTC 15m
- Redemption sweep across finalized markets, including the voided both-sides case

In progress: the roll agent, a REST and MCP surface so non-TypeScript agents can hedge, and the web control room.

## Notes from the build

The venue hosts more than one series. Markets from a pricefeed test venue sit alongside the real rolling series in the indexer, so every query is scoped by venue id.

The indexer reports `Trading` for windows that already locked. Every write is gated on the on-chain status and on remaining time, never on the indexed row.

Settled markets leave `loadMarkets()`. Winnings are found by scanning `listBinaryMarkets({ status: "Finalized" })` instead, which is why a redeem-by-scan bot built the obvious way silently claims nothing.

## Running it

```sh
npm install
cp .env.example .env   # add a testnet private key
npx tsx scripts/quote.ts    # read-only: live coverage quotes
npx tsx scripts/buy.ts      # buys coverage (needs STT gas + tUSDC)
npx tsx scripts/redeem.ts   # sweeps finalized markets for winnings
```

Testnet: Somnia Shannon, chain id 50312. Collateral is tUSDC at 6 decimals.

## Built for

Somnia x dreamDEX Event Contracts Hackathon, August 2026.
