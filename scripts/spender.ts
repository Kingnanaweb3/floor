import "dotenv/config";
import { makeExchange } from "../src/config.js";
import { createPublicClient, http, erc20Abi, formatUnits } from "viem";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const TUSDC = "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E" as const;
const CANDIDATES: [string, `0x${string}`][] = [
  ["BinaryMarketsModule", "0x3ecC694Cef705358864a646142ac17A90E29e388"],
  ["MarketsCore",         "0x2802504314685D89bF6C992CA5a8e7cC78bc0294"],
  ["CollateralRouter",    "0xbC0C9834B15ACE38bB50dDaa7d7f7C7CC4DC183C"],
  ["BinarySettlement",    "0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23"],
];

async function main() {
  const ex: any = makeExchange(process.env.PRIVATE_KEY);
  const me = ex.walletAddress as `0x${string}`;
  const pub = createPublicClient({ chain: somniaShannon, transport: http() });

  console.log("wallet:", me, "\n=== tUSDC allowance by spender ===");
  for (const [name, addr] of CANDIDATES) {
    const a = await pub.readContract({
      address: TUSDC, abi: erc20Abi, functionName: "allowance", args: [me, addr],
    }) as bigint;
    const shown = a > 10n ** 30n ? "MAX" : formatUnits(a, 6);
    console.log(name.padEnd(22), addr.slice(0, 10), shown);
  }

  console.log("\n=== operator approval shape ===");
  console.log(String(ex.trader.setOperatorApprovalGlobal).slice(0, 400));
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
