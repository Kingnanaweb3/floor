import "dotenv/config";
import { makeExchange } from "../src/config.js";
import { findLiveWindows } from "../src/markets.js";
import { buildCoverTx } from "../src/tx.js";

async function main() {
  const ex = makeExchange();
  const [w] = await findLiveWindows(ex);
  if (!w) { console.log("no live window"); process.exit(1); }

  const p: any = await ex.client.getBinaryBookParams(w.pool);
  const tx = buildCoverTx({
    pool: w.pool, downPrice: 0.25, contracts: 10, decimals: w.decimals,
    tickRaw: BigInt(p.tickSize), lotRaw: BigInt(p.lotSize),
    expirySec: Math.min(w.expiry, Math.floor(Date.now() / 1000) + 300),
    chainId: 50312,
  });
  console.log("window:", w.symbol);
  console.log("tx:", JSON.stringify(tx, null, 2));
  console.log("\nexpect price arg = 0.75 raw =", (10n ** BigInt(w.decimals)) * 3n / 4n);
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
