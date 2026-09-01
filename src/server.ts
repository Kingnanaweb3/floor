import "dotenv/config";
import express from "express";
import cors from "cors";
import { createPublicClient, http, erc20Abi, formatUnits } from "viem";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import { VENUE_ID, makeExchange, retry } from "./config.js";
import { findLiveWindows, pickWindow } from "./markets.js";
import { quoteCoverage, downBook } from "./coverage.js";
import { buildCoverTx, buildApproveTx } from "./tx.js";

const CHAIN_ID = 50312;
const app = express();
app.use(cors());
app.use(express.json());

const exchange = makeExchange();
const pub = createPublicClient({ chain: somniaShannon, transport: http() });

let cache: { at: number; windows: any[] } = { at: 0, windows: [] };
async function windows() {
  if (cache.windows.length > 0 && Date.now() - cache.at < 10000) return cache.windows;
  const w = await retry(() => findLiveWindows(exchange));
  if (w.length > 0) cache = { at: Date.now(), windows: w };
  return w;
}

async function priceCoverage(w: any, coverAmount: number) {
  const p: any = await retry(() => exchange.client.getBinaryBookParams(w.pool));
  const lot = Number(p.lotSize) / 10 ** w.decimals;
  const book: any = await retry(() => exchange.fetchOrderBook(w.upSymbol, 10));
  const q = quoteCoverage(coverAmount, downBook(book.bids ?? []), lot);
  return { q, params: p };
}

app.get("/windows", async (_req, res) => {
  try {
    const w = await windows();
    res.json({
      windows: w.map(x => ({
        asset: x.asset,
        intervalSec: x.intervalSec,
        symbol: x.symbol,
        marketId: x.marketId,
        expiresAt: new Date(x.expiry * 1000).toISOString(),
        secondsLeft: x.expiry - Math.floor(Date.now() / 1000),
      })),
    });
  } catch (e) { res.status(502).json({ error: String(e).slice(0, 200) }); }
});

app.get("/quote", async (req, res) => {
  try {
    const asset = String(req.query.asset ?? "BTC").toUpperCase() as "BTC" | "ETH";
    const intervalSec = Number(req.query.intervalSec ?? 900);
    const cover = Number(req.query.cover ?? 10);
    if (!Number.isFinite(cover) || cover <= 0) return res.status(400).json({ error: "cover must be a positive number" });

    const w = pickWindow(await windows(), asset, intervalSec);
    if (!w) return res.status(404).json({ error: "no live window", asset, intervalSec });

    const { q } = await priceCoverage(w, cover);
    const worstLvl = q.levels[q.levels.length - 1]?.price ?? 0.99;
    const lim = Math.min(0.99, worstLvl + 0.02);
    res.json({
      window: { symbol: w.symbol, asset: w.asset, intervalSec: w.intervalSec, expiresAt: new Date(w.expiry * 1000).toISOString() },
      fillable: q.fillable,
      contracts: q.contracts,
      avgPrice: Number(q.pricePerContract.toFixed(4)),
      cost: Number((lim * q.contracts).toFixed(4)),
      payoutIfDown: q.payoutIfDown,
      netIfDown: Number(q.netIfDown.toFixed(4)),
      maxLoss: Number((lim * q.contracts).toFixed(4)),
      avgCost: Number(q.cost.toFixed(4)),
      maxCost: Number((lim * q.contracts).toFixed(4)),
      limitPrice: Number(lim.toFixed(4)),
    });
  } catch (e) { res.status(502).json({ error: String(e).slice(0, 200) }); }
});

app.post("/cover", async (req, res) => {
  try {
    const { asset = "BTC", intervalSec = 900, cover = 10, walletAddress } = req.body ?? {};
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress ?? "")) {
      return res.status(400).json({ error: "walletAddress required" });
    }
    const w = pickWindow(await windows(), String(asset).toUpperCase() as any, Number(intervalSec));
    if (!w) return res.status(404).json({ error: "no live window" });
    if (w.expiry - Math.floor(Date.now() / 1000) < 120) {
      return res.status(409).json({ error: "window closing, retry on successor" });
    }

    const { q, params } = await priceCoverage(w, Number(cover));
    if (!q.fillable) return res.status(409).json({ error: "insufficient depth", available: q.contracts });

    // SLIP_GUARD: re-read the book right before building calldata; the first
    // read can be up to 10s stale from the window cache.
    const fresh = await priceCoverage(w, Number(cover));
    if (!fresh.q.fillable) return res.status(409).json({ error: "book moved, retry" });
    const drift = Math.abs(fresh.q.pricePerContract - q.pricePerContract);
    if (drift > 0.05) return res.status(409).json({ error: "price moved " + drift.toFixed(3) + ", retry" });

    const worst = fresh.q.levels[fresh.q.levels.length - 1]?.price ?? 0.99;
    const limit = Math.min(0.99, worst + 0.02);
    const costRaw = BigInt(Math.ceil(limit * fresh.q.contracts * 10 ** w.decimals));

    const allowance = await pub.readContract({
      address: w.collateral, abi: erc20Abi, functionName: "allowance",
      args: [walletAddress, w.pool],
    }) as bigint;

    const txs = [];
    if (allowance < costRaw) txs.push(buildApproveTx(w.collateral, w.pool, costRaw * 10n, CHAIN_ID));
    txs.push(buildCoverTx({
      pool: w.pool, downPrice: limit, contracts: fresh.q.contracts, decimals: w.decimals,
      tickRaw: BigInt(params.tickSize), lotRaw: BigInt(params.lotSize),
      expirySec: Math.min(w.expiry, Math.floor(Date.now() / 1000) + 300),
      chainId: CHAIN_ID,
    }));

    res.json({
      window: { symbol: w.symbol, expiresAt: new Date(w.expiry * 1000).toISOString() },
      quote: {
        contracts: fresh.q.contracts, avgPrice: Number(fresh.q.pricePerContract.toFixed(4)),
        cost: Number(fresh.q.cost.toFixed(4)), maxLoss: Number(fresh.q.maxLoss.toFixed(4)),
        payoutIfDown: fresh.q.payoutIfDown, limitPrice: Number(limit.toFixed(4)),
      },
      allowance: formatUnits(allowance, w.decimals),
      transactions: txs,
      note: "Sign and broadcast in order. Floor never holds your funds.",
    });
  } catch (e) { res.status(502).json({ error: String(e).slice(0, 200) }); }
});

app.get("/status/:address", async (req, res) => {
  try {
    const p: any = await retry(() => exchange.client.getPortfolio(req.params.address));
    res.json({
      account: p.account,
      positions: (p.positions ?? []).map((x: any) => ({
        side: x.outcomeIndex === 1 ? "DOWN" : "UP",
        contracts: Number(x.balance) / 10 ** (x.market?.quoteDecimals ?? 6),
        asset: x.market?.asset,
        interval: x.market?.interval,
        status: x.market?.status,
        expiresAt: x.market?.expiry ? new Date(Number(x.market.expiry) * 1000).toISOString() : null,
        won: x.market?.winningOutcome == null ? null : x.market.winningOutcome === x.outcomeIndex,
        avgPrice: (function () {
          const d = x.market?.quoteDecimals ?? 6;
          const legs = (p.trades ?? []).filter((t: any) =>
            t.market?.marketAddress === x.market?.marketAddress &&
            (x.outcomeIndex === 1 ? t.side === "BUY_NO" : t.side === "BUY_YES"));
          if (legs.length === 0) return null;
          let qty = 0, cost = 0;
          for (const t of legs) {
            const q = Number(t.quantity) / 10 ** d;
            const up = Number(t.fillPrice) / 10 ** d;
            const price = x.outcomeIndex === 1 ? 1 - up : up;
            qty += q; cost += q * price;
          }
          return qty > 0 ? Number((cost / qty).toFixed(4)) : null;
        })(),
      })),
      trades: (p.trades ?? []).length,
    });
  } catch (e) { res.status(502).json({ error: String(e).slice(0, 200) }); }
});

const SPOT: Record<string, { token: `0x${string}`; pool: `0x${string}`; decimals: number }> = {
  ETH: { token: "0x4d8E02BBfCf205828A8352Af4376b165E123D7b0", pool: "0xD180195da5459C7a0DEA188ed61216ec43682b50", decimals: 18 },
  BTC: { token: "0x4e85DC48a70DA1298489d5B6FC2492767d98f384", pool: "0x3605f28aA7C50e7441211e77Cb0762d49539326C", decimals: 8 },
};
const LEVELS_ABI = [{ name: "getBookLevels", type: "function", stateMutability: "view",
  inputs: [{ type: "bool" }, { type: "uint64" }],
  outputs: [{ type: "tuple[]", components: [{ type: "uint256", name: "price" }, { type: "uint256", name: "quantity" }] }] }] as const;

app.get("/spot/:address", async (req, res) => {
  try {
    const who = req.params.address as `0x${string}`;
    if (!/^0x[a-fA-F0-9]{40}$/.test(who)) return res.status(400).json({ error: "bad address" });
    const out: any[] = [];
    for (const asset of Object.keys(SPOT)) {
      const s = SPOT[asset];
      const bal = await pub.readContract({ address: s.token, abi: erc20Abi, functionName: "balanceOf", args: [who] }) as bigint;
      let price = 0;
      try {
        const bids = await pub.readContract({ address: s.pool, abi: LEVELS_ABI, functionName: "getBookLevels", args: [true, 1n] }) as any[];
        const asks = await pub.readContract({ address: s.pool, abi: LEVELS_ABI, functionName: "getBookLevels", args: [false, 1n] }) as any[];
        const b = bids[0] ? Number(bids[0].price) / 1e18 : 0;
        const a = asks[0] ? Number(asks[0].price) / 1e18 : 0;
        price = b && a ? (b + a) / 2 : (b || a);
      } catch {}
      const qty = Number(bal) / 10 ** s.decimals;
      out.push({
        asset,
        quantity: Number(qty.toFixed(8)),
        price: Number(price.toFixed(2)),
        value: Number((qty * price).toFixed(2)),
        drop2pct: Number((qty * price * 0.02).toFixed(2)),
      });
    }
    res.json({ holdings: out });
  } catch (e) { res.status(502).json({ error: String(e).slice(0, 200) }); }
});

const REDEEM_ABI = [{ name: "redeem", type: "function", stateMutability: "nonpayable",
  inputs: [{ name: "operatorId", type: "uint32" }, { name: "venueId", type: "bytes32" },
           { name: "marketId", type: "bytes32" }, { name: "outcomeIdx", type: "uint8" },
           { name: "amount", type: "uint256" }],
  outputs: [] }] as const;
const OPERATOR_ID = 2;
const MODULE = "0x3ecC694Cef705358864a646142ac17A90E29e388" as const;

app.get("/claimable/:address", async (req, res) => {
  try {
    const me = req.params.address as `0x${string}`;
    if (!/^0x[a-fA-F0-9]{40}$/.test(me)) return res.status(400).json({ error: "bad address" });
    const settled: any[] = await retry(() =>
      exchange.client.listBinaryMarkets({ venueId: VENUE_ID, status: "Finalized", limit: 60 }));
    const recent = settled.sort((a, b) => Number(b.expiry ?? 0) - Number(a.expiry ?? 0)).slice(0, 25);
    const out: any[] = [];
    for (const row of recent) {
      let oc: any;
      try { oc = await retry(() => exchange.client.getMarketOnchain(row.marketId)); } catch { continue; }
      if (!oc?.outcomeToken || (!oc.isResolved && !oc.isVoided)) continue;
      let up = 0n, down = 0n;
      try {
        up = await exchange.client.getOutcomeBalance({ outcomeToken: oc.outcomeToken, account: me, id: oc.yesId }) as bigint;
        down = await exchange.client.getOutcomeBalance({ outcomeToken: oc.outcomeToken, account: me, id: oc.noId }) as bigint;
      } catch { continue; }
      if (up === 0n && down === 0n) continue;
      const idxs: number[] = oc.isVoided ? [0, 1] : [oc.winningOutcome === 0 ? 0 : 1];
      for (const idx of idxs) {
        const amt = idx === 0 ? up : down;
        if (amt === 0n) continue;
        out.push({
          marketId: row.marketId, asset: row.asset, interval: row.interval,
          outcomeIdx: idx, voided: oc.isVoided,
          amount: Number(amt) / 10 ** oc.decimals,
          payout: Number(amt) / 10 ** oc.decimals * (oc.isVoided ? 0.5 : 1),
          tx: { to: MODULE, value: "0", chainId: CHAIN_ID,
            data: encodeFunctionData({ abi: REDEEM_ABI, functionName: "redeem", args: [OPERATOR_ID, VENUE_ID as `0x${string}`, row.marketId, idx, amt] }) },
        });
      }
    }
    res.json({ claimable: out });
  } catch (e) { res.status(502).json({ error: String(e).slice(0, 200) }); }
});

const PORT = Number(process.env.PORT ?? 8080);
app.listen(PORT, () => console.log(`Floor API on :${PORT}`));
