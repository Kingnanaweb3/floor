import "dotenv/config";
import { createWalletClient, createPublicClient, http, encodeFunctionData, erc20Abi, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const FAUCET = "0x89Ebc05dE83aB9752B95030218BB10A542b96B7C" as const;
const WETH = "0x4d8E02BBfCf205828A8352Af4376b165E123D7b0" as const;
const WBTC = "0x4e85DC48a70DA1298489d5B6FC2492767d98f384" as const;

const ABI = [{ name: "requestTokens", type: "function", stateMutability: "nonpayable",
  inputs: [{ name: "tokens", type: "address[]" }, { name: "amounts", type: "uint256[]" }], outputs: [] }] as const;

async function main() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const wc = createWalletClient({ account, chain: somniaShannon, transport: http() });
  const pub = createPublicClient({ chain: somniaShannon, transport: http() });
  console.log("wallet:", account.address);

  const data = encodeFunctionData({
    abi: ABI, functionName: "requestTokens",
    args: [[WETH, WBTC], [10n ** 18n, 10n ** 7n]],
  });

  try {
    await pub.call({ account: account.address, to: FAUCET, data });
    console.log("simulation ok");
  } catch (e) { console.log("SIMULATION FAILED:", String(e).slice(0, 300)); process.exit(1); }

  const hash = await wc.sendTransaction({ to: FAUCET, data, gas: 5_000_000n });
  const r = await pub.waitForTransactionReceipt({ hash });
  console.log("tx:", hash, r.status);

  for (const [n, t, d] of [["WETH", WETH, 18], ["WBTC", WBTC, 8]] as [string, `0x${string}`, number][]) {
    const b = await pub.readContract({ address: t, abi: erc20Abi, functionName: "balanceOf", args: [account.address] }) as bigint;
    console.log(n, "balance:", formatUnits(b, d));
  }
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
