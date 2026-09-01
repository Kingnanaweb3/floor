# Floor

Downside coverage for spot traders on Somnia, built on dreamDEX Event Contracts.

Live on Somnia Shannon testnet (chain 50312).

## The idea, in plain terms

You sell fruit at a market stall. Your inventory is worth 1,000 dollars. If it rains,
people stay home, your fruit spoils, and you lose money. You cannot control the weather.

Now someone next to you sells small tickets. Each costs 60 cents and pays 1 dollar if it
rains today, nothing if it stays dry. That 60 cent price is the crowd's honest read on how
likely rain is.

Buy enough tickets and a rainy day still hurts your fruit, but the tickets pay out and
cover most of the loss. On a dry day you lose the ticket money, but your fruit sold fine.
You have bought yourself a floor.

The fruit is a spot position. The rain is the asset closing below its opening price. The
tickets are Down contracts on dreamDEX.

## What it does

Floor reads your actual WETH and WBTC balances from chain and values them against the live
spot books. It tells you what a 2 percent drop would cost, sizes coverage against that real
exposure, and shows the premium and your exact worst case before you sign anything.

It returns an unsigned transaction. You sign it in your own wallet. Floor never holds keys
or collateral.

## Why not a perpetual future

Perps liquidate. Move far enough against the position and the venue closes your hedge and
keeps the collateral, so you lose on both sides at once.

A Down contract is fully collateralized with no leverage. You already paid in full, so
there is nothing left to take. The premium is the absolute maximum you can lose.

## The honest limit

A Down contract pays a fixed amount if the window closes below its opening price. It does
not pay more when the move is larger, while your spot loss does scale with the size of the
move. So Floor covers an amount you choose, not your entire exposure. You pick the number
and see the exact worst case before committing.

Coverage also costs money when you do not need it. A window that closes up means the
premium is gone. That is what insurance is.

## What works

- Live window discovery across BTC and ETH at 5m, 15m, 1h, 4h and daily cadences, scoped to
  the rolling series venue and gated on on-chain status
- Spot exposure read from chain and valued against the live WETH and WBTC books
- Coverage quoting that walks the Down side of the book and snaps to the venue lot grid
- Non-custodial purchase: the API returns unsigned calldata, the user signs
- A roll agent that covers a window, reopens on the successor, and sweeps settled markets
  for winnings, resuming its position from chain on restart
- Redemption from the dashboard when a position settles in your favour
- A REST surface so non-TypeScript agents can reach event contracts at all

## Why the API matters

The dreamDEX HTTP API covers spot only and has no event-contract endpoints; the sole
developer surface is a TypeScript SDK. A Python, Go or Rust bot cannot touch these markets.
Floor's REST layer closes that gap, and the dashboard is its reference consumer.

```
GET  /windows              live coverage windows
GET  /quote                price coverage without committing
POST /cover                unsigned transactions to buy it
GET  /spot/:address        spot holdings valued at the live book
GET  /status/:address      positions, with cost basis
GET  /claimable/:address   settled winnings plus redeem calldata
```

## What does not work yet

Per-user delegated rolling. `setOperatorApprovalGlobal` exists and reads as the right
primitive, but collateral cannot follow it: auto-pull draws via an ERC-20 allowance to the
pool, `DepositVaultParams.vault` is the pool address, and pools are recycled every window.
Only the owner can grant an allowance or fund a vault, so each new window needs a fresh
signature. An operator grant alone cannot fund the successor.

Floor's own agent rolls continuously from its own key, which demonstrates the mechanism.
Doing it on a user's behalf needs a module-level collateral escrow. See FEEDBACK.md.

## Notes from the build

The deployment hosts more than one venue. A pricefeed test venue runs 60s and 300s markets
on the same assets and produces four rows a minute, so an unfiltered market query fills
entirely with test rows within about fifteen minutes and the real venue disappears. Every
query is scoped by venue id.

The indexer reports `Trading` for windows that locked weeks ago. Every write is gated on
the on-chain status and on remaining time, never on the indexed row.

Settled markets leave `loadMarkets()`. Winnings are found by scanning
`listBinaryMarkets({ status: "Finalized" })` instead, which is why a redeem-by-scan bot
built the obvious way silently claims nothing while real winnings sit unredeemed.

Prices are always quoted in Up terms. A Down fill reports as its Up complement, so every
cost inverts if you read the raw value.

## Running it

```sh
npm install
cp .env.example .env          # add a testnet private key
npx tsx src/server.ts         # API on :8080

cd web && npm install && npm run dev   # dashboard on :3005
```

Scripts:

```sh
npx tsx scripts/quote.ts      # read-only live coverage quotes
npx tsx scripts/buy.ts        # buy coverage directly
npx tsx scripts/redeem.ts     # sweep finalized markets
npx tsx scripts/run.ts        # the roll agent
npx tsx scripts/mint.ts       # testnet WETH and WBTC
```

Collateral is tUSDC at 6 decimals, self-minting via `faucet()`. Gas is STT from the Somnia
Shannon faucet.

## Built for

Somnia x dreamDEX Event Contracts Hackathon, August 2026.

Testnet only. Not financial advice.
