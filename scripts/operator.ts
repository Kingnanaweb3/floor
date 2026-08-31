import "dotenv/config";
import { makeExchange, VENUE_ID } from "../src/config.js";
import { findLiveWindows } from "../src/markets.js";

async function main() {
  const ex: any = makeExchange(process.env.PRIVATE_KEY);
  console.log("trader keys:", Object.keys(ex.trader ?? {}));
  console.log("client keys with 'perator':", Object.keys(ex.client).filter((k: string) => /perator|pproval/i.test(k)));

  const windows = await findLiveWindows(ex);
  console.log("\nlive windows:", windows.length);
  const a = windows[0], b = windows.find(w => w.pool !== windows[0]?.pool);
  console.log("pool A:", a?.symbol, a?.pool);
  console.log("pool B:", b?.symbol, b?.pool);

  const me = ex.walletAddress;
  try {
    console.log("\nisOperatorAuthorized:", await ex.client.isOperatorAuthorized?.({ owner: me, operator: me, selector: "0x80054449", pool: a.pool }));
  } catch (e) { console.log("isOperatorAuthorized failed:", String(e).slice(0, 160)); }

  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
