import "dotenv/config";
import { makeExchange, VENUE_ID, retry } from "../src/config.js";
import { formatUnits } from "viem";

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY missing");
  const exchange = makeExchange(pk);
  const me = exchange.walletAddress as `0x${string}`;

  const settled: any[] = await retry(() =>
    exchange.client.listBinaryMarkets({ venueId: VENUE_ID, status: "Finalized", limit: 120 })
  );
  const recent = settled
    .sort((a, b) => Number(b.expiry ?? 0) - Number(a.expiry ?? 0))
    .slice(0, 40);
  console.log("finalized markets checked:", recent.length);

  let claimed = 0;
  for (const row of recent) {
    let oc: any;
    try { oc = await retry(() => exchange.client.getMarketOnchain(row.marketId)); }
    catch (e) { console.log(`  skip ${row.marketId.slice(-6)}: read failed`); continue; }
    if (!oc || !oc.outcomeToken || oc.yesId == null || oc.noId == null) {
      console.log(`  skip ${row.marketId.slice(-6)}: incomplete on-chain record`);
      continue;
    }
    if (!oc.isResolved && !oc.isVoided) continue;

    let up = 0n, down = 0n;
    try {
      up = await exchange.client.getOutcomeBalance({ outcomeToken: oc.outcomeToken, account: me, id: oc.yesId }) as bigint;
      down = await exchange.client.getOutcomeBalance({ outcomeToken: oc.outcomeToken, account: me, id: oc.noId }) as bigint;
    } catch (e) { console.log(`  skip ${row.marketId.slice(-6)}: balance read failed`); continue; }
    if (up === 0n && down === 0n) continue;

    const held: Record<0 | 1, bigint> = { 0: up, 1: down };
    const toClaim: (0 | 1)[] = oc.isVoided
      ? [0, 1]
      : [oc.winningOutcome === 0 ? 0 : 1];

    console.log(`\n${row.asset} ${row.interval} ${row.marketId}`);
    console.log(`  voided=${oc.isVoided} winner=${oc.isVoided ? "n/a" : oc.winningOutcome}`);
    console.log(`  held up=${formatUnits(up, oc.decimals)} down=${formatUnits(down, oc.decimals)}`);

    for (const idx of toClaim) {
      if (held[idx] === 0n) { console.log(`  outcome ${idx}: nothing held, skip`); continue; }
      const res: any = await exchange.trader.redeem({
        marketId: row.marketId,
        market: oc.marketAddress,
        outcomeToken: oc.outcomeToken,
        outcomeIdx: idx,
        amount: held[idx],
      });
      const ok = res.receipt?.status;
      console.log(`  redeemed outcome ${idx}: ${formatUnits(held[idx], oc.decimals)} -> ${ok} ${res.hash}`);
      if (ok === "success") claimed++;
    }
  }
  console.log(`\nredemptions: ${claimed}`);
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
