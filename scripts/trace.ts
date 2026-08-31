import "dotenv/config";
import { createPublicClient, http, parseAbiItem, formatUnits } from "viem";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const TX = "0xb72e87d3d5d5d95b22f57092731fe3c92ec93fa40016af33ed6306b160e323a9" as const;
const TUSDC = "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E".toLowerCase();

async function main() {
  const pub = createPublicClient({ chain: somniaShannon, transport: http() });
  const r = await pub.getTransactionReceipt({ hash: TX });
  const tx = await pub.getTransaction({ hash: TX });

  console.log("from:", tx.from);
  console.log("to  :", tx.to, "\n");

  const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  console.log("=== tUSDC Transfer events ===");
  for (const log of r.logs) {
    if (log.address.toLowerCase() !== TUSDC) continue;
    if (log.topics[0] !== TRANSFER) continue;
    const from = "0x" + (log.topics[1] as string).slice(26);
    const to = "0x" + (log.topics[2] as string).slice(26);
    console.log(from, "->", to, formatUnits(BigInt(log.data), 6));
  }

  console.log("\n=== all contracts touched ===");
  console.log([...new Set(r.logs.map(l => l.address))].join("\n"));
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
