import "dotenv/config";
import { makeExchange } from "../src/config.js";
import { findLiveWindows } from "../src/markets.js";
import { createPublicClient, http, erc20Abi, formatUnits } from "viem";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

async function main() {
  const ex: any = makeExchange(process.env.PRIVATE_KEY);
  const me = ex.walletAddress;
  const w = await findLiveWindows(ex);
  const a = w[0], b = w.find((x: any) => x.pool !== w[0].pool);

  console.log("=== signatures ===");
  console.log("setOperatorApprovalGlobal:", ex.trader.setOperatorApprovalGlobal?.length, "arg(s)");
  console.log("setOperatorApprovalForPool:", ex.trader.setOperatorApprovalForPool?.length, "arg(s)");
  console.log("depositVault:", ex.trader.depositVault?.length, "arg(s)");
  console.log("setManualVaultMode:", ex.trader.setManualVaultMode?.length, "arg(s)");

  console.log("\n=== allowance per pool (the key question) ===");
  const pub = createPublicClient({ chain: somniaShannon, transport: http() });
  for (const p of [a, b]) {
    const al = await pub.readContract({
      address: p.collateral, abi: erc20Abi, functionName: "allowance", args: [me, p.pool],
    }) as bigint;
    console.log(p.symbol.slice(0, 22), p.pool.slice(0, 10), "allowance:", formatUnits(al, p.decimals));
  }

  console.log("\n=== vault balance on each pool ===");
  for (const p of [a, b]) {
    try {
      const v = await ex.client.getVaultBalance?.({ pool: p.pool, owner: me, token: p.collateral });
      console.log(p.pool.slice(0, 10), "vault:", v);
    } catch (e) { console.log(p.pool.slice(0, 10), "getVaultBalance:", String(e).slice(0, 90)); }
  }
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
