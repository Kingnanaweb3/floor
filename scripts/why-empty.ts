import "dotenv/config";
import { makeExchange, VENUE_ID, MIN_SECONDS_LEFT } from "../src/config.js";
import { isBinaryMarket } from "@somnia-chain/markets-sdk";

async function main() {
  const ex: any = makeExchange();
  const now = Math.floor(Date.now() / 1000);
  const rows: any[] = await ex.client.listBinaryMarkets({ venueId: VENUE_ID, status: "Trading", limit: 40 });
  console.log("rows from indexer:", rows.length);

  const markets: any[] = Object.values(await ex.loadMarkets(true));
  const bins = markets.filter((m: any) => isBinaryMarket(m.info));
  console.log("loadMarkets total:", markets.length, "binary:", bins.length, "active:", bins.filter((m: any) => m.active).length);

  let okStatus = 0, okTime = 0, okSymbol = 0;
  for (const r of rows.slice(0, 12)) {
    const oc = await ex.client.getMarketOnchain(r.marketId);
    if (oc.status !== 1) continue;
    okStatus++;
    if (Number(oc.expiry) - now < MIN_SECONDS_LEFT) continue;
    okTime++;
    const m = bins.find((x: any) => x.info.marketId === r.marketId);
    if (!m) { console.log("  no loadMarkets entry for", r.marketId.slice(-6), r.asset, r.interval); continue; }
    if (!m.outcomes?.[0]?.symbol) { console.log("  no outcomes for", m.symbol); continue; }
    okSymbol++;
  }
  console.log("\npassed status:", okStatus, " passed time:", okTime, " passed symbol:", okSymbol);
  if (bins[0]) console.log("\nsample loadMarkets marketId:", bins[0].info.marketId);
  console.log("sample indexer marketId:  ", rows[0]?.marketId);
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
