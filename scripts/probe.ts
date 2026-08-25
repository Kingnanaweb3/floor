import "dotenv/config";
import { makeExchange, VENUE_ID } from "../src/config.js";

const t = async (label: string, fn: () => Promise<any>) => {
  const s = Date.now();
  try {
    const r = await fn();
    console.log(`${label}: ${Date.now() - s}ms`);
    return r;
  } catch (e) {
    console.log(`${label}: FAILED after ${Date.now() - s}ms —`, String(e).slice(0, 240));
    return null;
  }
};

async function main() {
  const exchange = makeExchange();

  const rows = await t("listBinaryMarkets(venue+Trading)", () =>
    exchange.client.listBinaryMarkets({ venueId: VENUE_ID, status: "Trading", limit: 30 })
  );
  console.log("  rows:", rows?.length ?? "n/a");
  if (rows?.[0]) console.log("  first:", rows[0].asset, rows[0].intervalSec + "s", rows[0].marketId);

  const noFilter = await t("listBinaryMarkets(no filter)", () =>
    exchange.client.listBinaryMarkets({ limit: 30 })
  );
  console.log("  venues seen:", [...new Set((noFilter ?? []).map((r: any) => r.venueId))]);

  if (rows?.[0]) {
    await t("getMarketOnchain", () => exchange.client.getMarketOnchain(rows[0].marketId));
  }

  await t("loadMarkets(true)", () => exchange.loadMarkets(true));
  process.exit(0);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
