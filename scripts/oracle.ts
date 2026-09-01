import "dotenv/config";
import { makeExchange, VENUE_ID, retry } from "../src/config.js";

async function main() {
  const ex = makeExchange();
  const rows: any[] = await retry(() =>
    ex.client.listBinaryMarkets({ venueId: VENUE_ID, status: "Finalized", limit: 120 })
  );
  const m = rows.find(r => String(r.marketId).endsWith("92eb"));
  if (!m) {
    console.log("92eb not in the last 120; showing newest with an oracle id instead:");
    const alt = rows.find(r => r.oracleQuestionId);
    console.log(alt?.asset, alt?.interval, "winner", alt?.winningOutcome);
    console.log("https://prd.oracle.somnia.host/questions/" + alt?.oracleQuestionId + "?view=graph");
  } else {
    console.log(m.asset, m.interval, "winner", m.winningOutcome);
    console.log("https://prd.oracle.somnia.host/questions/" + m.oracleQuestionId + "?view=graph");
  }
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
