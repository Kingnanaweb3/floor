import "dotenv/config";
import { makeExchange } from "../src/config.js";
import { findLiveWindows } from "../src/markets.js";
import { createPublicClient, http, formatUnits, erc20Abi } from "viem";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const TUSDC = "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E" as const;

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY missing");
  const exchange = makeExchange(pk);
  const me = exchange.walletAddress as `0x${string}`;
  console.log("wallet:", me);

  const pub = createPublicClient({ chain: somniaShannon, transport: http() });

  const gas = await pub.getBalance({ address: me });
  console.log("STT gas:", formatUnits(gas, 18));

  const bal = await pub.readContract({
    address: TUSDC, abi: erc20Abi, functionName: "balanceOf", args: [me],
  });
  const dec = await pub.readContract({
    address: TUSDC, abi: erc20Abi, functionName: "decimals",
  });
  console.log("tUSDC:", formatUnits(bal as bigint, dec as number), `(${dec} decimals)`);

  const windows = await findLiveWindows(exchange);
  console.log("\nlive windows:", windows.length);
  if (windows[0]) {
    console.log("market collateral:", windows[0].pool ? "(checking)" : "");
    const oc = await exchange.client.getMarketOnchain(windows[0].marketId);
    console.log("collateral addr:", oc.collateral);
    console.log("matches tUSDC:", oc.collateral.toLowerCase() === TUSDC.toLowerCase());
  }
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
