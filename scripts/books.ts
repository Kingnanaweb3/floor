import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES, isBinaryMarket } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const VENUE = "0x679795a0195a1b76cdebb7c51d74e058aee92919b8c3389af86ef24535e8a28c";
const j = (v: any) => JSON.stringify(v, (_k, x) => typeof x === "bigint" ? x.toString() : x, 2);

const exchange = new SomniaMarkets({
  indexerUrl: "https://dev.smk.somnia.host/v1/graphql",
  chain: somniaShannon,
  wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws",
  addresses: SOMNIA_TESTNET_ADDRESSES,
});

async function main() {
  const rows: any[] = await exchange.client.listBinaryMarkets({ limit: 60 });
  const live = rows.filter(r => r.venueId === VENUE && r.status === "Trading");
  console.log("live on marketCreator venue:", live.length, "\n");

  const markets: any[] = Object.values(await exchange.loadMarkets(true));
  const now = Math.floor(Date.now() / 1000);

  for (const r of live) {
    const m = markets.find((x: any) => isBinaryMarket(x.info) && x.info.marketId === r.marketId);
    const up = m?.outcomes?.[0]?.symbol;
    console.log(`${r.asset} ${Number(r.intervalSec)/60}m  strike=${r.strike}  ${Number(r.expiry)-now}s left`);
    console.log("  symbol:", up ?? "(not in loadMarkets)");
    if (!up) { console.log(); continue; }
    try {
      const b: any = await exchange.fetchOrderBook(up, 5);
      console.log("  bids:", j(b.bids), "\n  asks:", j(b.asks));
    } catch (e) { console.log("  book failed:", String(e).slice(0, 160)); }
    console.log();
  }

  console.log("--- FINALIZED SAMPLE (redemption path) ---");
  const fin: any[] = await exchange.client.listBinaryMarkets({ venueId: VENUE, status: "Finalized", limit: 5 });
  for (const f of fin) {
    console.log(f.asset, Number(f.intervalSec)/60 + "m", "winner:", f.winningOutcome, "voided:", f.voided, "trades:", f.tradeCount, "vol:", f.cumulativeQuoteVolume);
  }
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
