# SDK and documentation feedback

Notes from building Floor on `@somnia-chain/markets-sdk` 0.28.1 against Somnia
Shannon. Everything below was hit in real testing, not read about.

## 1. `getOutcomeBalance` takes an object, and fails misleadingly when it doesn't

The call is `getOutcomeBalance({ outcomeToken, account, id })`. Passing the same
three values positionally — which reads naturally and matches the shape of most
other reads — produces:

    rpc readContract balanceOf failed: Address "undefined" is invalid.

The error names the address, so the obvious next step is to debug the account
value. It is correct. The real problem is the call shape, and nothing in the
message points there. This cost roughly an hour, including a redemption sweep
that reported "nothing to claim" across forty markets while a winning position
sat unredeemed.

Suggestion: the docs' Recipes page shows the object form, but a positional call
is easy to write from memory. A runtime check for a string first argument, with
an error naming the expected object shape, would close this.

## 2. Delegated rolling is blocked by per-pool collateral

`setOperatorApprovalGlobal` exists and reads as the right primitive for letting
an agent trade on a user's behalf across windows. In practice it is not enough:

- Auto-pull draws collateral via an ERC-20 allowance to the **pool**, confirmed
  by tracing a fill's Transfer events.
- `DepositVaultParams.vault` is documented as the pool address, so vault
  balances are also per-pool.
- Pools are recycled per window.

So each new window needs a fresh allowance or deposit, and only the owner can
grant either. An operator grant alone cannot fund the successor window. Any
product built on continuous rolling for third-party users runs into this.

Suggestion: a module-level collateral escrow, or an allowance granted to the
BinaryMarketsModule rather than the pool, would make operator delegation usable
as intended.

## 3. The indexer reports `Trading` for locked and long-expired windows

Documented in Gotchas, and accurate — but the gap is larger than "lags by
seconds". A `listBinaryMarkets({ status: "Trading" })` query returned rows whose
on-chain status was Locked and whose expiry was weeks past. Gating on the
on-chain status is the correct fix and the docs say so; the surprise is the
magnitude.

## 4. Two venues share the indexer with no default scoping

A pricefeed test venue runs 60s and 300s markets on the same assets as the real
rolling series. Because it produces four rows a minute, an unfiltered
`listBinaryMarkets({ limit: 60 })` fills entirely with test rows within about
fifteen minutes, and the real venue disappears from results. The failure is a
silent empty set rather than an error.

Gotcha 8 warns about venue scoping. Worth stating more strongly: scope every
query by venue id from the first line of code, not as a later filter.

## 5. Sequential `getMarketOnchain` is slow enough to look hung

At roughly 1.2s per call, checking thirty rows sequentially takes over half a
minute with no output. Parallelising with `Promise.all` fixes it. A note in
Recipes near the discovery snippet would save people assuming a hang.

## What worked well

- The three-tier design (unified, client, trader) is a good shape. Dropping to
  `exchange.trader` for redemption while staying on unified verbs elsewhere was
  natural.
- `getPortfolio` returning positions, open orders, and trades with market
  context nested is excellent — it replaced three separate reads.
- The Gotchas page is unusually honest and saved real time. The redemption trap
  in particular (settled markets leaving `loadMarkets`) would have been a silent
  money-losing bug.
- Fixed-fee signing via `realtime_sendRawTransaction` made writes fast and
  predictable, with no gas estimation round trips.
