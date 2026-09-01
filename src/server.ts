import "dotenv/config";
import express from "express";
import cors from "cors";
import { createPublicClient, http, erc20Abi, formatUnits } from "viem";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import { makeExchange, retry } from "./config.js";
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
  if (Date.now() - cache.at < 10000) return cache.windows;
  const w = await retry(() => findLiveWindows(exchange));
  cache = { at: Date.now(), windows: w };
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
    res.json({
      window: { symbol: w.symbol, asset: w.asset, intervalSec: w.intervalSec, expiresAt: new Date(w.expiry * 1000).toISOString() },
      fillable: q.fillable,
      contracts: q.contracts,
      avgPrice: Number(q.pricePerContract.toFixed(4)),
      cost: Number(q.cost.toFixed(4)),
      payoutIfDown: q.payoutIfDown,
      netIfDown: Number(q.netIfDown.toFixed(4)),
      maxLoss: Number(q.maxLoss.toFixed(4)),
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
      })),
      trades: (p.trades ?? []).length,
    });
  } catch (e) { res.status(502).json({ error: String(e).slice(0, 200) }); }
});

const PORT = Number(process.env.PORT ?? 8080);
app.listen(PORT, () => console.log(`Floor API on :${PORT}`));
