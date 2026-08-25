import "dotenv/config";
import { makeExchange, VENUE_ID, j } from "../src/config.js";

async function main() {
  const exchange = makeExchange(process.env.PRIVATE_KEY);
  const rows: any[] = await exchange.client.listBinaryMarkets({ venueId: VENUE_ID, status: "Trading", limit: 5 });
  const oc: any = await exchange.client.getMarketOnchain(rows[0].marketId);
  console.log("getMarketOnchain keys:", Object.keys(oc));
  console.log(j(oc));

  const me = exchange.walletAddress;
  console.log("\nwalletAddress:", me);
  const p: any = await exchange.client.getPortfolio(me);
  console.log("\nportfolio keys:", Object.keys(p ?? {}));
  console.log(j(p));
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
