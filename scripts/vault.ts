import "dotenv/config";
import { makeExchange } from "../src/config.js";
import { findLiveWindows } from "../src/markets.js";

async function main() {
  const ex: any = makeExchange(process.env.PRIVATE_KEY);
  console.log("depositVault src:", String(ex.trader.depositVault).slice(0, 300));
  console.log("\nwithdrawVault src:", String(ex.trader.withdrawVault).slice(0, 300));
  console.log("\nsetManualVaultMode src:", String(ex.trader.setManualVaultMode).slice(0, 300));
  console.log("\nsetOperatorApprovalGlobal src:", String(ex.trader.setOperatorApprovalGlobal).slice(0, 300));
  const w = await findLiveWindows(ex);
  console.log("\nlive pools:", w.slice(0, 3).map((x: any) => x.pool).join("\n"));
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
