import "dotenv/config";
import { makeExchange } from "../src/config.js";
import { createPublicClient, http, erc20Abi, formatUnits } from "viem";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

async function main() {
  const ex: any = makeExchange(process.env.PRIVATE_KEY);
  const me = ex.walletAddress as `0x${string}`;

  const all: any[] = await ex.client.listMarkets({ limit: 200 });
  console.log("listMarkets total:", all.length);
  console.log("types seen:", [...new Set(all.map((m: any) => m.marketType))]);

  console.log("\n=== does the testnet spot pool exist on chain? ===");
  const pub = createPublicClient({ chain: somniaShannon, transport: http() });
  for (const [name, addr] of [["WETH pool", "0xD180195da5459C7a0DEA188ed61216ec43682b50"], ["WBTC pool", "0x3605f28aA7C50e7441211e77Cb0762d49539326C"]] as [string, `0x${string}`][]) {
    const code = await pub.getBytecode({ address: addr });
    console.log(name, addr.slice(0, 10), code && code.length > 2 ? "deployed (" + code.length + " bytes)" : "NO CONTRACT");
  }

  console.log("\n=== testnet token faucet ===");
  const faucet = "0x89Ebc05dE83aB9752B95030218BB10A542b96B7C" as `0x${string}`;
  const fcode = await pub.getBytecode({ address: faucet });
  console.log("faucet contract:", fcode && fcode.length > 2 ? "deployed" : "NO CONTRACT");
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
