import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES, isBinaryMarket } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const exchange = new SomniaMarkets({
  indexerUrl: "https://dev.smk.somnia.host/v1/graphql",
  chain: somniaShannon,
  wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws",
  addresses: SOMNIA_TESTNET_ADDRESSES,
});

async function main() {
  console.log("--- SYSTEM ---");
  try { console.log(await exchange.client.getSystemInfo()); } catch (e) { console.log("getSystemInfo failed:", String(e).slice(0, 200)); }
  try { console.log(await exchange.client.getSyncStatus()); } catch (e) { console.log("getSyncStatus failed:", String(e).slice(0, 200)); }

  console.log("\n--- BINARY MARKETS (raw first row) ---");
  const rows = await exchange.client.listBinaryMarkets({ limit: 60 });
  console.log("count:", rows.length);
  if (rows[0]) console.log(JSON.stringify(rows[0], null, 2));

  console.log("\n--- SUMMARY ---");
  for (const m of rows) {
    console.log([
      m.marketId,
      (m as any).venueId,
      (m as any).asset,
      (m as any).intervalSec,
      (m as any).status,
      (m as any).expiry,
      (m as any).symbol ?? "",
    ].join(" | "));
  }

  console.log("\n--- DISTINCT ---");
  const key = (k: string) => [...new Set(rows.map((r: any) => r[k]))];
  console.log("venueId:", key("venueId"));
  console.log("asset:", key("asset"));
  console.log("intervalSec:", key("intervalSec"));
  console.log("status:", key("status"));

  console.log("\n--- LOADMARKETS SYMBOLS ---");
  const markets = Object.values(await exchange.loadMarkets(true));
  const binaries = markets.filter((m: any) => m.active && isBinaryMarket(m.info));
  console.log("active binary:", binaries.length);
  for (const m of binaries.slice(0, 8)) {
    console.log(m.symbol, "|", (m as any).outcomes?.map((o: any) => o.symbol).join(", "));
  }

  const first: any = binaries[0];
  if (first) {
    console.log("\n--- ONCHAIN + BOOK (first active) ---");
    const oc = await exchange.client.getMarketOnchain(first.info.marketId);
    console.log(JSON.stringify(oc, (_k, v) => typeof v === "bigint" ? v.toString() : v, 2));
    try {
      const params = await exchange.client.getBinaryBookParams(oc.pool ?? oc.poolAddress);
      console.log("bookParams:", JSON.stringify(params, (_k, v) => typeof v === "bigint" ? v.toString() : v, 2));
    } catch (e) { console.log("getBinaryBookParams failed:", String(e).slice(0, 300)); }
    const up = first.outcomes?.[0]?.symbol;
    if (up) console.log("book:", JSON.stringify(await exchange.fetchOrderBook(up, 5), null, 2));
  }
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
