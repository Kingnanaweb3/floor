import { makeExchange } from "../src/config.js";
import { findLiveWindows } from "../src/markets.js";
import { quoteCoverage, downBook } from "../src/coverage.js";

const COVER = 100;

async function main() {
  const exchange = makeExchange();
  const windows = await findLiveWindows(exchange);
  console.log("live windows:", windows.length, "\n");

  for (const w of windows) {
    const params = await exchange.client.getBinaryBookParams(w.pool);
    const lot = Number(params.lotSize) / 10 ** w.decimals;
    const book: any = await exchange.fetchOrderBook(w.upSymbol, 10);
    const asks = downBook(book.bids ?? []);
    const q = quoteCoverage(COVER, asks, lot);

    console.log(`${w.asset} ${w.intervalSec / 60}m  ${w.secondsLeft}s left  lot=${lot}`);
    console.log(`  down asks: ${asks.map(a => `${a[0].toFixed(3)}x${a[1]}`).join("  ")}`);
    if (!q.fillable) {
      console.log(`  cannot cover ${COVER} — only ${q.contracts} available\n`);
      continue;
    }
    console.log(`  cover ${COVER} tUSDC -> ${q.contracts} contracts @ avg ${q.pricePerContract.toFixed(3)}`);
    console.log(`  cost ${q.cost.toFixed(2)}  |  if down: +${q.netIfDown.toFixed(2)}  |  if up: -${q.maxLoss.toFixed(2)}\n`);
  }
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
