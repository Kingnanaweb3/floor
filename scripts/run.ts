import "dotenv/config";
import { makeExchange } from "../src/config.js";
import { newState, tick } from "../src/agent.js";

const POLL_MS = 20000;

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY missing");
  const exchange = makeExchange(pk);

  let state = newState({
    asset: (process.env.ASSET ?? "BTC") as "BTC" | "ETH",
    intervalSec: Number(process.env.INTERVAL ?? 900),
    coverAmount: Number(process.env.COVER ?? 10),
    maxPricePerContract: Number(process.env.MAX_PRICE ?? 0.8),
  });

  console.log("policy:", state.policy);
  console.log("wallet:", exchange.walletAddress, "\n");

  for (;;) {
    const t = new Date().toISOString().slice(11, 19);
    try { state = await tick(exchange, state, (m: string) => console.log(`[${t}] ${m}`)); }
    catch (e) { console.log(`[${t}] tick failed: ${String(e).slice(0, 160)}`); }
    await new Promise(r => setTimeout(r, POLL_MS));
  }
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
