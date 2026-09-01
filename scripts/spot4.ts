import "dotenv/config";
import { makeExchange } from "../src/config.js";
import { createPublicClient, http, erc20Abi, formatUnits } from "viem";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const LEVELS = [{ name: "getBookLevels", type: "function", stateMutability: "view",
  inputs: [{ type: "bool" }, { type: "uint64" }],
  outputs: [{ type: "tuple[]", components: [{ type: "uint256", name: "price" }, { type: "uint256", name: "quantity" }] }] }] as const;

const TOKENS: [string, `0x${string}`, `0x${string}`][] = [
  ["WETH", "0x4d8E02BBfCf205828A8352Af4376b165E123D7b0", "0xD180195da5459C7a0DEA188ed61216ec43682b50"],
  ["WBTC", "0x4e85DC48a70DA1298489d5B6FC2492767d98f384", "0x3605f28aA7C50e7441211e77Cb0762d49539326C"],
];

async function main() {
  const ex: any = makeExchange(process.env.PRIVATE_KEY);
  const me = ex.walletAddress as `0x${string}`;
  const pub = createPublicClient({ chain: somniaShannon, transport: http() });

  for (const [n, token, pool] of TOKENS) {
    console.log("\n===", n, "===");
    try {
      const sym = await pub.readContract({ address: token, abi: erc20Abi, functionName: "symbol" });
      const dec = await pub.readContract({ address: token, abi: erc20Abi, functionName: "decimals" }) as number;
      const bal = await pub.readContract({ address: token, abi: erc20Abi, functionName: "balanceOf", args: [me] }) as bigint;
      console.log("token:", sym, "decimals:", dec, "your balance:", formatUnits(bal, dec));
    } catch (e) { console.log("token read failed:", String(e).slice(0, 110)); }
    try {
      const bids = await pub.readContract({ address: pool, abi: LEVELS, functionName: "getBookLevels", args: [true, 3n] }) as any[];
      const asks = await pub.readContract({ address: pool, abi: LEVELS, functionName: "getBookLevels", args: [false, 3n] }) as any[];
      console.log("bids:", bids.length, "asks:", asks.length);
      if (bids[0]) console.log("best bid raw:", bids[0].price?.toString(), bids[0].quantity?.toString());
      if (asks[0]) console.log("best ask raw:", asks[0].price?.toString(), asks[0].quantity?.toString());
    } catch (e) { console.log("book read failed:", String(e).slice(0, 110)); }
  }
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
