import "dotenv/config";
import { makeExchange } from "../src/config.js";
import { createPublicClient, http, erc20Abi, formatUnits } from "viem";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const POOLS: [string, `0x${string}`][] = [
  ["WBTC/USDso", "0x3605f28aA7C50e7441211e77Cb0762d49539326C"],
  ["WETH/USDso", "0xD180195da5459C7a0DEA188ed61216ec43682b50"],
];

async function main() {
  const ex: any = makeExchange(process.env.PRIVATE_KEY);
  const me = ex.walletAddress as `0x${string}`;
  const pub = createPublicClient({ chain: somniaShannon, transport: http() });

  console.log("=== spot pool params ===");
  for (const [name, pool] of POOLS) {
    try {
      const p: any = await ex.client.getPoolParams?.(pool);
      console.log(name, JSON.stringify(p, (_k, v) => typeof v === "bigint" ? v.toString() : v));
    } catch (e) {
      try {
        const base = await pub.readContract({
          address: pool, abi: [{ name: "getPoolParams", type: "function", stateMutability: "view", inputs: [], outputs: [
            { type: "address" }, { type: "address" }, { type: "uint256" }, { type: "uint256" },
            { type: "uint256" }, { type: "uint256" }, { type: "uint256" }] }],
          functionName: "getPoolParams",
        }) as any[];
        console.log(name, "base:", base[0], "quote:", base[1]);
        const sym = await pub.readContract({ address: base[0], abi: erc20Abi, functionName: "symbol" });
        const dec = await pub.readContract({ address: base[0], abi: erc20Abi, functionName: "decimals" });
        const bal = await pub.readContract({ address: base[0], abi: erc20Abi, functionName: "balanceOf", args: [me] });
        console.log("  ", sym, "decimals", dec, "your balance:", formatUnits(bal as bigint, dec as number));
      } catch (e2) { console.log(name, "FAILED:", String(e2).slice(0, 140)); }
    }
  }

  console.log("\n=== spot markets from indexer ===");
  const all: any[] = await ex.client.listMarkets({ limit: 40 });
  const spot = all.filter((m: any) => m.marketType === "SPOT");
  for (const m of spot) console.log(m.baseSymbol + "/" + m.quoteSymbol, m.poolAddress, "lastPrice:", m.lastPrice);
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
