import { retry } from "./config.js";
import { findLiveWindows, pickWindow, type LiveWindow } from "./markets.js";
import { quoteCoverage, downBook, type Quote } from "./coverage.js";

export type Policy = {
  asset: "BTC" | "ETH";
  intervalSec: number;
  coverAmount: number;
  maxPricePerContract: number;
};

export type CoverageState = {
  policy: Policy;
  active: boolean;
  currentMarketId: string | null;
  currentExpiry: number | null;
  contractsHeld: number;
  spentThisWindow: number;
  history: { marketId: string; expiry: number; contracts: number; cost: number; avgPrice: number }[];
};

export function newState(policy: Policy): CoverageState {
  return {
    policy, active: true, currentMarketId: null, currentExpiry: null,
    contractsHeld: 0, spentThisWindow: 0, history: [],
  };
}

export async function quoteFor(exchange: any, w: LiveWindow, coverAmount: number): Promise<Quote> {
  const params = await retry(() => exchange.client.getBinaryBookParams(w.pool));
  const lot = Number(params.lotSize) / 10 ** w.decimals;
  const book: any = await retry(() => exchange.fetchOrderBook(w.upSymbol, 10));
  return quoteCoverage(coverAmount, downBook(book.bids ?? []), lot);
}

export async function sweepSettled(exchange: any, venueId: string, log = console.log) {
  const me = exchange.walletAddress as `0x${string}`;
  const settled: any[] = await retry(() =>
    exchange.client.listBinaryMarkets({ venueId, status: "Finalized", limit: 60 })
  );
  const recent = settled.sort((a, b) => Number(b.expiry ?? 0) - Number(a.expiry ?? 0)).slice(0, 20);
  let claimed = 0;

  for (const row of recent) {
    let oc: any;
    try { oc = await retry(() => exchange.client.getMarketOnchain(row.marketId)); } catch { continue; }
    if (!oc?.outcomeToken || (!oc.isResolved && !oc.isVoided)) continue;

    let up = 0n, down = 0n;
    try {
      up = await exchange.client.getOutcomeBalance({ outcomeToken: oc.outcomeToken, account: me, id: oc.yesId }) as bigint;
      down = await exchange.client.getOutcomeBalance({ outcomeToken: oc.outcomeToken, account: me, id: oc.noId }) as bigint;
    } catch (e) { log(`sweep read failed ${row.marketId.slice(-6)}: ${String(e).slice(0, 80)}`); continue; }
    if (up === 0n && down === 0n) continue;

    const held: Record<0 | 1, bigint> = { 0: up, 1: down };
    const toClaim: (0 | 1)[] = oc.isVoided ? [0, 1] : [oc.winningOutcome === 0 ? 0 : 1];

    for (const idx of toClaim) {
      if (held[idx] === 0n) continue;
      try {
        const res: any = await exchange.trader.redeem({
          marketId: row.marketId, market: oc.marketAddress,
          outcomeToken: oc.outcomeToken, outcomeIdx: idx, amount: held[idx],
        });
        if (res.receipt?.status === "success") {
          claimed++;
          log(`redeemed ${Number(held[idx]) / 10 ** oc.decimals} on ${row.asset} ${row.interval} (${oc.isVoided ? "voided" : "won"})`);
        }
      } catch (e) { log(`redeem failed: ${String(e).slice(0, 100)}`); }
    }
  }
  return claimed;
}

export async function tick(exchange: any, state: CoverageState, log = console.log) {
  if (!state.active) return state;
  const { asset, intervalSec, coverAmount, maxPricePerContract } = state.policy;

  const windows = await retry(() => findLiveWindows(exchange));
  const w = pickWindow(windows, asset, intervalSec);
  if (!w) { log(`no live ${asset} ${intervalSec}s window`); return state; }

  if (state.currentMarketId === null) {
    try {
      const me = exchange.walletAddress as `0x${string}`;
      const held = await retry(() => exchange.client.getOutcomeBalance({
        outcomeToken: w.outcomeToken, account: me, id: w.noId,
      })) as bigint;
      if (held > 0n) {
        state.currentMarketId = w.marketId;
        state.currentExpiry = w.expiry;
        state.contractsHeld = Number(held) / 10 ** w.decimals;
        log(`resumed: already hold ${state.contractsHeld} on ${w.symbol}`);
      }
    } catch { }
  }

  if (state.currentMarketId === w.marketId) {
    log(`covered: ${w.symbol}, ${w.secondsLeft}s left, ${state.contractsHeld} contracts`);
    return state;
  }

  if (state.currentMarketId) log(`window rolled -> ${w.symbol}`);

  const q = await quoteFor(exchange, w, coverAmount);
  if (!q.fillable) { log(`insufficient depth: ${q.contracts}/${coverAmount}`); return state; }
  if (q.pricePerContract > maxPricePerContract) {
    log(`too expensive: ${q.pricePerContract.toFixed(3)} > ${maxPricePerContract}`);
    return state;
  }

  const params = await retry(() => exchange.client.getBinaryBookParams(w.pool));
  const tickSize = Number(params.tickSize) / 10 ** w.decimals;
  const worst = q.levels[q.levels.length - 1]?.price ?? 0.99;
  const limit = Math.min(0.999, Math.ceil((worst + 0.02) / tickSize) * tickSize);

  log(`buying ${q.contracts} @ limit ${limit.toFixed(3)} (avg ${q.pricePerContract.toFixed(3)}, cost ${q.cost.toFixed(2)})`);

  try {
    const order: any = await exchange.createOrder(
      w.downSymbol, "limit", "buy", q.contracts, limit, { timeInForce: "IOC" }
    );
    const receipt = (order.info as any)?.receipt;
    if (receipt?.status !== "success") { log(`order not successful: ${receipt?.status}`); return state; }

    state.currentMarketId = w.marketId;
    state.currentExpiry = w.expiry;
    state.contractsHeld = Number(order.filled ?? q.contracts);
    state.spentThisWindow = q.cost;
    state.history.push({
      marketId: w.marketId, expiry: w.expiry,
      contracts: state.contractsHeld, cost: q.cost, avgPrice: q.pricePerContract,
    });
    log(`covered until ${new Date(w.expiry * 1000).toISOString()} — tx ${receipt.transactionHash}`);
  } catch (e) {
    const msg = String(e);
    if (msg.includes("PostOnlyWouldCross")) log("book moved, will requote");
    else log(`order failed: ${msg.slice(0, 160)}`);
  }
  return state;
}
