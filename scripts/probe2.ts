import "dotenv/config";
import { makeExchange, VENUE_ID, retry, j } from "../src/config.js";

async function main() {
  const exchange = makeExchange(process.env.PRIVATE_KEY);
  const settled: any[] = await retry(() =>
    exchange.client.listBinaryMarkets({ venueId: VENUE_ID, status: "Finalized", limit: 20 })
  );
  const recent = settled.sort((a, b) => Number(b.expiry ?? 0) - Number(a.expiry ?? 0)).slice(0, 8);

  for (const row of recent) {
    let oc: any;
    try { oc = await retry(() => exchange.client.getMarketOnchain(row.marketId)); }
    catch (e) { console.log(row.marketId, "getMarketOnchain FAILED:", String(e).slice(0, 100)); continue; }
    console.log([
      row.marketId.slice(-6),
      row.asset,
      row.interval,
      "resolved=" + oc.isResolved,
      "voided=" + oc.isVoided,
      "winner=" + oc.winningOutcome,
      "outcomeToken=" + oc.outcomeToken,
      "yesId=" + (oc.yesId ? "ok" : "MISSING"),
    ].join("  "));
  }

  console.log("\n--- my position market 92eb ---");
  const mine: any = await retry(() => exchange.client.getMarketOnchain("0x00000000000000000000000000000000000000000000000000000000000092eb"));
  console.log(j(mine));
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
