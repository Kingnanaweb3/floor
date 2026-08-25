import "dotenv/config";
import { makeExchange } from "../src/config.js";

async function main() {
  const ex: any = makeExchange(process.env.PRIVATE_KEY);
  console.log("walletAddress:", ex.walletAddress);
  console.log("account.address:", ex.account?.address);
  console.log("trader.account:", ex.trader?.account?.address);

  const oc: any = await ex.client.getMarketOnchain("0x00000000000000000000000000000000000000000000000000000000000092eb");
  console.log("outcomeToken:", oc.outcomeToken);
  console.log("noId:", oc.noId, "type:", typeof oc.noId);

  const addr = ex.walletAddress ?? ex.account?.address;
  console.log("using addr:", addr);

  console.log("\n-- attempt 1: as returned --");
  try { console.log("ok:", await ex.client.getOutcomeBalance(oc.outcomeToken, addr, oc.noId)); }
  catch (e) { console.log("FAILED:", String(e).slice(0, 200)); }

  console.log("\n-- attempt 2: noId as BigInt --");
  try { console.log("ok:", await ex.client.getOutcomeBalance(oc.outcomeToken, addr, BigInt(oc.noId))); }
  catch (e) { console.log("FAILED:", String(e).slice(0, 200)); }

  console.log("\n-- attempt 3: hardcoded address --");
  try { console.log("ok:", await ex.client.getOutcomeBalance(oc.outcomeToken, "0xe2cB03B9BeC91eCf0dBf8645499ccF02c3727ab9", BigInt(oc.noId))); }
  catch (e) { console.log("FAILED:", String(e).slice(0, 200)); }

  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
