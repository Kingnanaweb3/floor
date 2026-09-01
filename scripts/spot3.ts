import "dotenv/config";
import { createPublicClient, http } from "viem";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const ABI = [{ name: "getPoolParams", type: "function", stateMutability: "view", inputs: [], outputs: [
  { type: "address" }, { type: "address" }, { type: "uint256" }, { type: "uint256" },
  { type: "uint256" }, { type: "uint256" }, { type: "uint256" }] }] as const;

async function main() {
  const pub = createPublicClient({ chain: somniaShannon, transport: http() });
  for (const [n, a] of [["WETH", "0xD180195da5459C7a0DEA188ed61216ec43682b50"], ["WBTC", "0x3605f28aA7C50e7441211e77Cb0762d49539326C"]] as [string, `0x${string}`][]) {
    try {
      const r = await pub.readContract({ address: a, abi: ABI, functionName: "getPoolParams" }) as any[];
      console.log(n, "base:", r[0], "quote:", r[1]);
    } catch (e) { console.log(n, "read failed:", String(e).slice(0, 100)); }
  }
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
