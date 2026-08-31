import "dotenv/config";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const API = process.env.API ?? "http://localhost:8080";

async function main() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const wallet = createWalletClient({ account, chain: somniaShannon, transport: http() });
  const pub = createPublicClient({ chain: somniaShannon, transport: http() });

  const r = await fetch(`${API}/cover`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ asset: "BTC", intervalSec: 900, cover: 5, walletAddress: account.address }),
  });
  const body: any = await r.json();
  if (!r.ok) { console.log("API error:", body); process.exit(1); }

  console.log("quote:", body.quote);
  console.log("window:", body.window.symbol);

  for (const tx of body.transactions) {
    console.log(`\nsigning ${tx.tag}...`);
    const hash = await wallet.sendTransaction({
      to: tx.to as `0x${string}`,
      data: tx.data as `0x${string}`,
      value: BigInt(tx.value),
      gas: 5_000_000n,
    });
    const rec = await pub.waitForTransactionReceipt({ hash });
    console.log(`  ${tx.tag}: ${rec.status} ${hash}`);
  }

  const s = await (await fetch(`${API}/status/${account.address}`)).json() as any;
  console.log("\npositions:", JSON.stringify(s.positions?.slice(0, 3), null, 2));
  process.exit(0);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
