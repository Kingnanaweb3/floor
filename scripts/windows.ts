import "dotenv/config";
import { makeExchange, VENUE_ID } from "../src/config.js";

async function main() {
  const exchange = makeExchange();
  const now = Math.floor(Date.now() / 1000);
  const rows: any[] = await exchange.client.listBinaryMarkets({ venueId: VENUE_ID, status: "Trading", limit: 40 });
  console.log("rows:", rows.length, " now:", now, "\n");

  const checked = await Promise.all(rows.map(async (r: any) => {
    try { return { r, oc: await exchange.client.getMarketOnchain(r.marketId) }; }
    catch { return null; }
  }));

  for (const c of checked) {
    if (!c) continue;
    const { r, oc } = c;
    console.log([
      r.asset,
      "int=" + r.intervalSec + "s",
      "idxExpiry=" + r.expiry,
      "ocExpiry=" + oc.expiry,
      "left=" + (Number(oc.expiry) - now) + "s",
      "ocStatus=" + oc.status,
      "start=" + r.tradingStart,
      "span=" + (Number(r.expiry) - Number(r.tradingStart)) + "s",
    ].join("  "));
  }
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
