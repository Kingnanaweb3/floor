import "dotenv/config";
import { makeExchange, j } from "../src/config.js";
import { findLiveWindows, pickWindow } from "../src/markets.js";
import { quoteCoverage, downBook } from "../src/coverage.js";
import { createPublicClient, http, erc20Abi, formatUnits } from "viem";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const ASSET = (process.env.ASSET ?? "BTC") as "BTC" | "ETH";
const INTERVAL = Number(process.env.INTERVAL ?? 900);
const COVER = Number(process.env.COVER ?? 10);

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY missing");
  const exchange = makeExchange(pk);
  const me = exchange.walletAddress as `0x${string}`;

  const windows = await findLiveWindows(exchange);
  const w = pickWindow(windows, ASSET, INTERVAL);
  if (!w) {
    console.log("no live window for", ASSET, INTERVAL + "s");
    console.log("available:", windows.map(x => `${x.asset}/${x.intervalSec}s`).join(", "));
    process.exit(1);
  }
  console.log(`window: ${w.symbol}`);
  console.log(`expires in ${w.secondsLeft}s at ${new Date(w.expiry * 1000).toISOString()}`);

  const params = await exchange.client.getBinaryBookParams(w.pool);
  const lot = Number(params.lotSize) / 10 ** w.decimals;
  const tick = Number(params.tickSize) / 10 ** w.decimals;

  const book: any = await exchange.fetchOrderBook(w.upSymbol, 10);
  const asks = downBook(book.bids ?? []);
  const q = quoteCoverage(COVER, asks, lot);
  if (!q.fillable) {
    console.log(`cannot cover ${COVER}, only ${q.contracts} available`);
    process.exit(1);
  }
  console.log(`\ncover ${COVER} -> ${q.contracts} contracts @ avg ${q.pricePerContract.toFixed(3)}`);
  console.log(`cost ${q.cost.toFixed(2)}  net if down +${q.netIfDown.toFixed(2)}  max loss ${q.maxLoss.toFixed(2)}`);

  const pub = createPublicClient({ chain: somniaShannon, transport: http() });
  const allowance = await pub.readContract({
    address: w.collateral ?? ("0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E" as `0x${string}`),
    abi: erc20Abi, functionName: "allowance", args: [me, w.pool],
  });
  console.log("\nallowance to pool:", formatUnits(allowance as bigint, w.decimals));

  const worst = asks[asks.length - 1]?.[0] ?? 0.99;
  const limit = Math.min(0.999, Math.ceil((worst + 0.02) / tick) * tick);
  console.log(`placing IOC buy on ${w.downSymbol} size=${q.contracts} limit=${limit.toFixed(3)}`);

  const order: any = await exchange.createOrder(
    w.downSymbol, "limit", "buy", q.contracts, limit, { timeInForce: "IOC" }
  );
  const { receipt } = order.info as any;
  console.log("tx:", receipt?.transactionHash, "status:", receipt?.status);
  console.log("filled:", order.filled, "of", order.amount);

  const down = await exchange.client.getOutcomeBalance({ outcomeToken: w.outcomeToken, account: me, id: w.noId });
  console.log("down tokens held:", formatUnits(down as bigint, w.decimals));
  process.exit(0);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
